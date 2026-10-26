/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK with server-side API key
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function withTimeout<T>(promise: Promise<T>, timeoutMs = 4000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out')), timeoutMs)
    ),
  ]);
}

// Deterministic What-If Regex Fallback Parser
function deterministicParseWhatIf(text: string) {
  const lower = text.toLowerCase();
  let appName = 'Instagram';
  if (lower.includes('slack')) appName = 'Slack';
  else if (lower.includes('whatsapp')) appName = 'WhatsApp';
  else if (lower.includes('youtube')) appName = 'YouTube';
  else if (lower.includes('gmail') || lower.includes('email')) appName = 'Gmail';
  else if (lower.includes('reddit')) appName = 'Reddit';
  else if (lower.includes('telegram')) appName = 'Telegram';
  else if (lower.includes('notion')) appName = 'Notion';
  else if (lower.includes('code') || lower.includes('vscode')) appName = 'VS Code';
  else if (lower.includes('chrome') || lower.includes('browser')) appName = 'Chrome';
  else if (lower.includes('otp') || lower.includes('security') || lower.includes('bank')) appName = 'System';

  let notifType = 'social_like';
  if (lower.includes('otp') || lower.includes('code') || lower.includes('passcode') || lower.includes('bank')) notifType = 'otp';
  else if (lower.includes('work') || lower.includes('pr') || lower.includes('review') || lower.includes('deploy')) notifType = 'work_msg';
  else if (lower.includes('dm') || lower.includes('message') || lower.includes('chat') || lower.includes('text')) notifType = 'dm';
  else if (lower.includes('calendar') || lower.includes('meeting') || lower.includes('invite')) notifType = 'calendar';
  else if (lower.includes('promo') || lower.includes('deal') || lower.includes('sale')) notifType = 'promo';
  else if (lower.includes('news') || lower.includes('headline')) notifType = 'news';

  let hour = 22;
  const hourMatch = lower.match(/(\d{1,2})\s*(am|pm)/i);
  if (hourMatch) {
    let h = parseInt(hourMatch[1], 10);
    const meridiem = hourMatch[2].toLowerCase();
    if (meridiem === 'pm' && h < 12) h += 12;
    if (meridiem === 'am' && h === 12) h = 0;
    hour = Math.min(23, Math.max(0, h));
  } else {
    const rawNum = lower.match(/(?:at|hour)\s*(\d{1,2})/);
    if (rawNum) {
      hour = Math.min(23, Math.max(0, parseInt(rawNum[1], 10)));
    }
  }

  let activity = 'coding';
  if (lower.includes('study') || lower.includes('exam')) activity = 'studying';
  else if (lower.includes('read') || lower.includes('paper')) activity = 'reading';
  else if (lower.includes('writ') || lower.includes('draft')) activity = 'writing';
  else if (lower.includes('idle') || lower.includes('chill') || lower.includes('rest')) activity = 'idle';

  let senderImportance = 0.2;
  if (notifType === 'otp') senderImportance = 0.99;
  else if (lower.includes('boss') || lower.includes('ceo') || lower.includes('urgent') || lower.includes('critical')) senderImportance = 0.9;
  else if (lower.includes('friend') || lower.includes('team') || notifType === 'work_msg') senderImportance = 0.65;
  else if (notifType === 'promo') senderImportance = 0.05;

  return {
    appName,
    notifType,
    hour,
    activity,
    senderImportance,
    title: `${appName} Alert`,
    body: text.slice(0, 100),
    source: 'deterministic-parser' as const,
  };
}

// 1. Natural Language What-If Parser
app.post('/api/gemini/parse-what-if', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text in request body' });
  }

  // Deterministic fallback ready immediately
  const fallback = deterministicParseWhatIf(text);

  if (!geminiApiKey) {
    return res.json(fallback);
  }

  try {
    const prompt = `Parse this user scenario into structured simulation parameters for an Attention Digital Twin:
"${text}"

Supported appName values: "Instagram", "WhatsApp", "YouTube", "Slack", "Gmail", "Reddit", "Telegram", "VS Code", "Notion", "Chrome", "System"
Supported notifType values: "social_like", "dm", "work_msg", "otp", "calendar", "promo", "news", "system"
Supported activity values: "coding", "studying", "reading", "writing", "idle"
Hour should be an integer from 0 to 23.
senderImportance should be a float from 0.0 to 1.0.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              appName: { type: Type.STRING },
              notifType: { type: Type.STRING },
              hour: { type: Type.INTEGER },
              activity: { type: Type.STRING },
              senderImportance: { type: Type.NUMBER },
              title: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ['appName', 'notifType', 'hour', 'activity', 'senderImportance', 'title', 'body'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...fallback,
      ...parsed,
      source: 'gemini',
    });
  } catch (err) {
    return res.json(fallback);
  }
});

// 2. Verdict Plain-Language Explainer (Quotes exact engine numbers)
app.post('/api/gemini/explain-verdict', async (req: Request, res: Response) => {
  const {
    verdict,
    primaryReason,
    detourMinutes,
    lossMinutes,
    savedMinutes,
    appName,
    notifType,
    activity,
    hour,
    pDetour,
  } = req.body;

  const fallback = `Allowing this ${appName} notification while ${activity} is projected to divert your flow for ~${Math.round(detourMinutes || 0)} minutes (${Math.round((pDetour || 0) * 100)}% chance), causing ~${Math.round(lossMinutes || 0)} minutes of cognitive friction. Holding it preserves +${Math.round(savedMinutes || 0)} minutes of unbroken concentration.`;

  if (!geminiApiKey) {
    return res.json({ explanation: fallback, source: 'template' });
  }

  try {
    const prompt = `You are the KAIROS Attention Digital Twin explainer. Write exactly 1 or 2 concise, friendly, scannable sentences explaining the twin's verdict to the user.
CRITICAL INTEGRITY REQUIREMENT: You MUST strictly quote the computed engine numbers without altering them:
- Verdict: ${verdict}
- Expected Detour: ${detourMinutes} minutes
- Expected Focus Loss: ${lossMinutes} minutes
- Focus Minutes Preserved: +${savedMinutes} minutes
- Application: ${appName}
- User Activity: ${activity} at ${hour}:00
- Stated Primary Reason: ${primaryReason}

Do NOT invent any numbers. Do NOT include preambles or greetings.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      })
    );

    const text = response.text?.trim() || fallback;
    return res.json({ explanation: text, source: 'gemini' });
  } catch (err) {
    return res.json({ explanation: fallback, source: 'template' });
  }
});

// 3. Weekly Attention Narrative Report
app.post('/api/gemini/weekly-report', async (req: Request, res: Response) => {
  const {
    personaName = 'Arjun',
    fidelityScore = 94,
    ece = 0.04,
    detourMaeMinutes = 2.4,
    cfMaeMinutes = 1.8,
    attentionSavedMinutes = 142,
    topSinkApp = 'Instagram',
    peakHour = 22,
  } = req.body;

  const fallback = `Weekly Attention Twin Audit for ${personaName}:
Over the past 7 evaluation days, your personal Attention Digital Twin achieved a unified empirical fidelity score of ${fidelityScore}% (Expected Calibration Error: ±${Math.round(ece * 100)}%, Detour MAE: ${detourMaeMinutes}m). The on-device firewall successfully shielded +${attentionSavedMinutes} minutes of deep cognitive focus from algorithmic capture.

The model identified ${topSinkApp} as your primary cognitive detour surface, where notifications delivered during non-peak windows triggered prolonged sessions with high resumption friction. In contrast, your highest concentration stability consistently aligned with the ${peakHour}:00 golden window.

By filtering low-utility signals locally without transmitting raw activity data off-device, your twin converted reactive interruption spirals into intentional task completion while maintaining 100% data sovereignty.`;

  if (!geminiApiKey) {
    return res.json({ narrative: fallback, source: 'template' });
  }

  try {
    const prompt = `Write a 3-paragraph executive Weekly Attention Report for ${personaName}'s attention digital twin.
Strictly quote these engine empirical numbers:
- Fidelity Score: ${fidelityScore}%
- Expected Calibration Error (ECE): ±${Math.round(ece * 100)}%
- Detour MAE: ${detourMaeMinutes} minutes
- Counterfactual MAE: ${cfMaeMinutes} minutes
- Attention Preserved: +${attentionSavedMinutes} minutes
- Top Distraction Sink: ${topSinkApp}
- Peak Focus Hour: ${peakHour}:00

Tone: High-agency, scientific, respectful of human attention, zero guilt.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      })
    );

    const text = response.text?.trim() || fallback;
    return res.json({ narrative: text, source: 'gemini' });
  } catch (err) {
    return res.json({ narrative: fallback, source: 'template' });
  }
});

// Full-stack Vite development middleware or static production serve
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KAIROS] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();

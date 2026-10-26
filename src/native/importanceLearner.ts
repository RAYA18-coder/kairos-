/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'creator' | 'developer' | 'student' | 'founder' | 'other';

export interface BetaDist {
  alpha: number;
  beta: number;
}

export interface ImportanceScore {
  value: number;        // Posterior mean [0, 1]
  low: number;          // 95% Credible Interval lower bound
  high: number;         // 95% Credible Interval upper bound
  n: number;            // Sample count
  level: 'sender' | 'channel' | 'app' | 'role_prior';
  vip: boolean;
  why: string;
}

export interface FeedbackEvent {
  appName: string;
  channel: string;
  senderId?: string;
  outcome: 'worth_it' | 'hijacked' | 'dismissed' | 'vip_toggled';
  explicit?: boolean;   // true if user tapped "Worth it" / "Not worth it"
  sessionMinutes?: number;
  tapDelaySeconds?: number;
  timestamp: number;
}

// Simple deterministic hash for sender privacy
export function hashSender(senderName: string, salt = 'kairos_salt_v1'): string {
  if (!senderName) return 'anonymous';
  let h = 0x811c9dc5;
  const str = `${salt}:${senderName.toLowerCase().trim()}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `snd_${(h >>> 0).toString(16).padStart(8, '0')}`;
}

// Role-based priors for App -> Channel
export function getRolePrior(role: UserRole, appName: string, channel: string, workApps: string[]): BetaDist {
  const isDeclaredWork = workApps.map((a) => a.toLowerCase()).includes(appName.toLowerCase());
  const ch = channel.toLowerCase();
  const app = appName.toLowerCase();

  // 1. Creator Prior
  if (role === 'creator') {
    if (app.includes('instagram') || app.includes('youtube') || app.includes('tiktok') || isDeclaredWork) {
      if (ch.includes('dm') || ch.includes('message') || ch.includes('inbox')) {
        return { alpha: 8.5, beta: 1.5 }; // ~0.85 prior
      }
      if (ch.includes('comment') || ch.includes('reply') || ch.includes('mention')) {
        return { alpha: 6.0, beta: 4.0 }; // ~0.60 prior
      }
      if (ch.includes('like') || ch.includes('follow') || ch.includes('react')) {
        return { alpha: 2.0, beta: 8.0 }; // ~0.20 prior
      }
      return { alpha: 7.0, beta: 3.0 };   // General work social ~0.70
    }
    if (ch.includes('work_msg') || ch.includes('calendar') || ch.includes('otp')) {
      return { alpha: 9.0, beta: 1.0 };
    }
    return { alpha: 3.0, beta: 7.0 };
  }

  // 2. Developer Prior
  if (role === 'developer') {
    if (app.includes('slack') || app.includes('github') || app.includes('linear') || app.includes('terminal') || isDeclaredWork) {
      if (ch.includes('work_msg') || ch.includes('mention') || ch.includes('deploy') || ch.includes('pr')) {
        return { alpha: 9.0, beta: 1.2 }; // ~0.88 prior
      }
      return { alpha: 7.5, beta: 2.5 };
    }
    if (ch.includes('otp') || ch.includes('security')) {
      return { alpha: 9.9, beta: 0.1 };
    }
    if (app.includes('instagram') || app.includes('reddit') || app.includes('tiktok')) {
      return { alpha: 1.2, beta: 8.8 }; // ~0.12 prior
    }
    return { alpha: 3.0, beta: 7.0 };
  }

  // 3. Student Prior
  if (role === 'student') {
    if (app.includes('canvas') || app.includes('notion') || app.includes('classroom') || isDeclaredWork) {
      return { alpha: 8.0, beta: 2.0 };
    }
    if (ch.includes('calendar') || ch.includes('assignment')) {
      return { alpha: 8.5, beta: 1.5 };
    }
    if (app.includes('instagram') || app.includes('snapchat')) {
      return { alpha: 1.5, beta: 8.5 };
    }
    return { alpha: 3.5, beta: 6.5 };
  }

  // 4. Founder Prior
  if (role === 'founder') {
    if (ch.includes('email') || ch.includes('dm') || ch.includes('work_msg') || ch.includes('calendar') || isDeclaredWork) {
      return { alpha: 8.8, beta: 1.2 };
    }
    if (app.includes('slack') || app.includes('whatsapp') || app.includes('gmail')) {
      return { alpha: 8.5, beta: 1.5 };
    }
    return { alpha: 4.0, beta: 6.0 };
  }

  // 5. Default / Other Prior
  if (isDeclaredWork) {
    return { alpha: 7.5, beta: 2.5 };
  }
  if (ch.includes('otp')) return { alpha: 9.8, beta: 0.2 };
  if (ch.includes('work_msg') || ch.includes('calendar')) return { alpha: 7.0, beta: 3.0 };
  return { alpha: 4.0, beta: 6.0 };
}

// Compute Beta posterior mean & variance
function betaStats(alpha: number, beta: number) {
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
  const std = Math.sqrt(variance);
  // Normal approx 95% CI bounded by [0.02, 0.99]
  const low = Math.max(0.01, mean - 1.96 * std);
  const high = Math.min(0.99, mean + 1.96 * std);
  return { mean, low, high };
}

export class ImportanceLearner {
  private role: UserRole = 'developer';
  private workApps: Set<string> = new Set(['Slack', 'GitHub']);
  private vipSenders: Set<string> = new Set();
  
  // Storage for Beta observations: key -> { alphaUpdates: number, betaUpdates: number, count: number }
  private senderStore: Map<string, { alpha: number; beta: number; count: number }> = new Map();
  private channelStore: Map<string, { alpha: number; beta: number; count: number }> = new Map();
  private appStore: Map<string, { alpha: number; beta: number; count: number }> = new Map();

  constructor() {
    this.load();
  }

  public setRole(role: UserRole) {
    this.role = role;
    this.save();
  }

  public getRole(): UserRole {
    return this.role;
  }

  public setWorkApps(apps: string[]) {
    this.workApps = new Set(apps);
    this.save();
  }

  public getWorkApps(): string[] {
    return Array.from(this.workApps);
  }

  public isVip(senderId: string): boolean {
    return this.vipSenders.has(senderId);
  }

  public toggleVip(senderId: string): boolean {
    const next = !this.vipSenders.has(senderId);
    if (next) {
      this.vipSenders.add(senderId);
    } else {
      this.vipSenders.delete(senderId);
    }
    this.save();
    return next;
  }

  // Register feedback / reaction
  public recordReaction(
    appName: string,
    channel: string,
    outcome: 'worth_it' | 'hijacked' | 'dismissed',
    senderId?: string,
    explicit = false
  ) {
    const weight = explicit ? 2.0 : 1.0;
    let deltaAlpha = 0;
    let deltaBeta = 0;

    if (outcome === 'worth_it') {
      deltaAlpha = 1.0 * weight;
    } else if (outcome === 'hijacked') {
      deltaBeta = 1.2 * weight;
    } else if (outcome === 'dismissed') {
      deltaBeta = 0.4 * weight;
    }

    // 1. App level
    const appKey = appName.toLowerCase();
    const appData = this.appStore.get(appKey) || { alpha: 0, beta: 0, count: 0 };
    appData.alpha += deltaAlpha * 0.5;
    appData.beta += deltaBeta * 0.5;
    appData.count += 1;
    this.appStore.set(appKey, appData);

    // 2. Channel level
    const chKey = `${appKey}:${channel.toLowerCase()}`;
    const chData = this.channelStore.get(chKey) || { alpha: 0, beta: 0, count: 0 };
    chData.alpha += deltaAlpha * 0.75;
    chData.beta += deltaBeta * 0.75;
    chData.count += 1;
    this.channelStore.set(chKey, chData);

    // 3. Sender level
    if (senderId) {
      const sData = this.senderStore.get(senderId) || { alpha: 0, beta: 0, count: 0 };
      sData.alpha += deltaAlpha;
      sData.beta += deltaBeta;
      sData.count += 1;
      this.senderStore.set(senderId, sData);
    }

    this.save();
  }

  // Score hierarchical posterior
  public score(appName: string, channel: string, senderId?: string): ImportanceScore {
    const isVip = senderId ? this.vipSenders.has(senderId) : false;
    const prior = getRolePrior(this.role, appName, channel, Array.from(this.workApps));

    let effectiveAlpha = prior.alpha;
    let effectiveBeta = prior.beta;
    let n = 0;
    let level: ImportanceScore['level'] = 'role_prior';
    let why = `Initial prior: ${this.role.toUpperCase()} profile`;

    // 1. Propagate App evidence
    const appData = this.appStore.get(appName.toLowerCase());
    if (appData && appData.count > 0) {
      effectiveAlpha += appData.alpha;
      effectiveBeta += appData.beta;
      n += appData.count;
      level = 'app';
      why = `Learned from ${appData.count} past interactions with ${appName}`;
    }

    // 2. Propagate Channel evidence
    const chKey = `${appName.toLowerCase()}:${channel.toLowerCase()}`;
    const chData = this.channelStore.get(chKey);
    if (chData && chData.count > 0) {
      effectiveAlpha += chData.alpha;
      effectiveBeta += chData.beta;
      n += chData.count;
      level = 'channel';
      why = `Learned from ${chData.count} ${channel} notifications`;
    }

    // 3. Propagate Sender evidence
    if (senderId) {
      const sData = this.senderStore.get(senderId);
      if (sData && sData.count > 0) {
        effectiveAlpha += sData.alpha;
        effectiveBeta += sData.beta;
        n = sData.count;
        level = 'sender';
        why = `Learned from ${sData.count} past reactions to this sender`;
      }
    }

    let stats = betaStats(effectiveAlpha, effectiveBeta);

    // VIP Sender Floor
    if (isVip) {
      stats.mean = Math.max(0.92, stats.mean);
      stats.low = Math.max(0.88, stats.low);
      stats.high = 0.99;
      why = 'VIP sender override: Guaranteed high-priority routing';
    }

    return {
      value: Math.round(stats.mean * 100) / 100,
      low: Math.round(stats.low * 100) / 100,
      high: Math.round(stats.high * 100) / 100,
      n,
      level,
      vip: isVip,
      why,
    };
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        role: this.role,
        workApps: Array.from(this.workApps),
        vipSenders: Array.from(this.vipSenders),
        senderStore: Array.from(this.senderStore.entries()),
        channelStore: Array.from(this.channelStore.entries()),
        appStore: Array.from(this.appStore.entries()),
      };
      localStorage.setItem('kairos_importance_learner_v2', JSON.stringify(payload));
    } catch {
      // storage unavailable
    }
  }

  private load() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('kairos_importance_learner_v2');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.role) this.role = data.role;
      if (Array.isArray(data.workApps)) this.workApps = new Set(data.workApps);
      if (Array.isArray(data.vipSenders)) this.vipSenders = new Set(data.vipSenders);
      if (Array.isArray(data.senderStore)) this.senderStore = new Map(data.senderStore);
      if (Array.isArray(data.channelStore)) this.channelStore = new Map(data.channelStore);
      if (Array.isArray(data.appStore)) this.appStore = new Map(data.appStore);
    } catch {
      // fallback to initial
    }
  }

  public clearAll() {
    this.senderStore.clear();
    this.channelStore.clear();
    this.appStore.clear();
    this.vipSenders.clear();
    this.workApps = new Set(['Slack', 'GitHub']);
    this.role = 'developer';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kairos_importance_learner_v2');
    }
  }
}

export const importanceLearner = new ImportanceLearner();

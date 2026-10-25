package com.shrii.kairos;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;

/** Maps an Android package to one of: social, messaging, video, work, email, news, other. */
public class AppCategory {

    public static String label(Context ctx, String pkg) {
        try {
            PackageManager pm = ctx.getPackageManager();
            ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
            CharSequence l = pm.getApplicationLabel(ai);
            return l != null ? l.toString() : pkg;
        } catch (Exception e) {
            return pkg;
        }
    }

    public static String of(Context ctx, String pkg) {
        String p = pkg.toLowerCase();
        if (p.contains("instagram") || p.contains("reddit") || p.contains("twitter")
                || p.contains("facebook") || p.contains("snapchat") || p.contains("linkedin")
                || p.contains("pinterest") || p.equals("com.x.android")) return "social";
        if (p.contains("whatsapp") || p.contains("telegram") || p.contains("discord")
                || p.contains("messaging") || p.contains("signal") || p.contains("mms")) return "messaging";
        if (p.contains("youtube") || p.contains("netflix") || p.contains("hotstar")
                || p.contains("primevideo")) return "video";
        if (p.contains("slack") || p.contains("teams") || p.contains("notion")
                || p.contains("trello") || p.contains("asana") || p.contains("jira")
                || p.contains("docs") || p.contains("drive")) return "work";
        if (p.contains(".gm") || p.contains("outlook") || p.contains("mail")) return "email";
        if (p.contains("news") || p.contains("inshorts") || p.contains("dailyhunt")) return "news";

        // Fallback: the category the app declared itself (API 26+)
        try {
            ApplicationInfo ai = ctx.getPackageManager().getApplicationInfo(pkg, 0);
            switch (ai.category) {
                case ApplicationInfo.CATEGORY_SOCIAL: return "social";
                case ApplicationInfo.CATEGORY_VIDEO: return "video";
                case ApplicationInfo.CATEGORY_NEWS: return "news";
                case ApplicationInfo.CATEGORY_PRODUCTIVITY: return "work";
                default: break;
            }
        } catch (Exception ignored) { }
        return "other";
    }
}

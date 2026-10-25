package com.shrii.kairos;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import org.json.JSONArray;
import org.json.JSONObject;

import java.security.MessageDigest;
import java.util.UUID;

/**
 * Records notification METADATA only (package, category, timing, tapped/dismissed).
 * Title/body text is NEVER stored. A salted hash of the title gives a stable
 * anonymous sender id so the twin can learn "this sender matters" without names.
 */
public class KairosNotificationListener extends NotificationListenerService {

    public interface LiveCallback { void onEvent(JSONObject event); }

    private static final String PREFS = "kairos_sensor";
    private static final String KEY_BUFFER = "notif_buffer";
    private static final String KEY_SALT = "sender_salt";
    private static final int MAX_EVENTS = 2000;
    private static final Object LOCK = new Object();

    public static volatile LiveCallback liveCallback = null;

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            if (shouldSkip(sbn)) return;
            Notification n = sbn.getNotification();
            JSONObject e = new JSONObject();
            e.put("kind", "posted");
            e.put("key", sbn.getKey());
            e.put("pkg", sbn.getPackageName());
            e.put("appLabel", AppCategory.label(this, sbn.getPackageName()));
            e.put("appCategory", AppCategory.of(this, sbn.getPackageName()));
            e.put("androidCategory", n.category == null ? "" : n.category);
            e.put("importance", getImportance(sbn));
            e.put("senderHash", senderHash(this, n.extras));
            e.put("timeMs", sbn.getPostTime());
            store(this, e);
        } catch (Exception ignored) { }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn, RankingMap rankingMap, int reason) {
        try {
            if (shouldSkip(sbn)) return;
            JSONObject e = new JSONObject();
            e.put("kind", "removed");
            e.put("key", sbn.getKey());
            e.put("pkg", sbn.getPackageName());
            e.put("timeMs", System.currentTimeMillis());
            // REASON_CLICK = tapped, REASON_CANCEL = swiped away by user
            e.put("wasTapped", reason == REASON_CLICK);
            e.put("wasDismissed", reason == REASON_CANCEL || reason == REASON_CANCEL_ALL);
            store(this, e);
        } catch (Exception ignored) { }
    }

    private boolean shouldSkip(StatusBarNotification sbn) {
        if (sbn.getPackageName().equals(getPackageName())) return true;
        Notification n = sbn.getNotification();
        if (sbn.isOngoing()) return true;                              // music players, downloads...
        return (n.flags & Notification.FLAG_GROUP_SUMMARY) != 0;       // duplicate group headers
    }

    private int getImportance(StatusBarNotification sbn) {
        try {
            RankingMap rm = getCurrentRanking();
            Ranking r = new Ranking();
            if (rm != null && rm.getRanking(sbn.getKey(), r)) return r.getImportance();
        } catch (Exception ignored) { }
        return -1;
    }

    private static String senderHash(Context ctx, Bundle extras) {
        try {
            if (extras == null) return "";
            CharSequence title = extras.getCharSequence(Notification.EXTRA_TITLE);
            if (title == null) return "";
            SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String salt = sp.getString(KEY_SALT, null);
            if (salt == null) {
                salt = UUID.randomUUID().toString();
                sp.edit().putString(KEY_SALT, salt).apply();
            }
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] d = md.digest((salt + title).getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 6; i++) sb.append(String.format("%02x", d[i]));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private static void store(Context ctx, JSONObject e) {
        synchronized (LOCK) {
            try {
                SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
                JSONArray old = new JSONArray(sp.getString(KEY_BUFFER, "[]"));
                JSONArray out = new JSONArray();
                int start = Math.max(0, old.length() - (MAX_EVENTS - 1));
                for (int i = start; i < old.length(); i++) out.put(old.get(i));
                out.put(e);
                sp.edit().putString(KEY_BUFFER, out.toString()).apply();
            } catch (Exception ignored) { }
        }
        LiveCallback cb = liveCallback;
        if (cb != null) cb.onEvent(e);
    }

    /** Returns buffered events with timeMs >= sinceMs (works even if the app was closed). */
    public static JSONArray drain(Context ctx, long sinceMs) {
        JSONArray result = new JSONArray();
        synchronized (LOCK) {
            try {
                SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
                JSONArray all = new JSONArray(sp.getString(KEY_BUFFER, "[]"));
                for (int i = 0; i < all.length(); i++) {
                    JSONObject o = all.getJSONObject(i);
                    if (o.optLong("timeMs", 0) >= sinceMs) result.put(o);
                }
            } catch (Exception ignored) { }
        }
        return result;
    }

    public static void clear(Context ctx) {
        synchronized (LOCK) {
            ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY_BUFFER).apply();
        }
    }
}

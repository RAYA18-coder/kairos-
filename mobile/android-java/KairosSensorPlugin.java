package com.shrii.kairos;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Process;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "KairosSensor")
public class KairosSensorPlugin extends Plugin {

    // UsageEvents.Event constants (literals so we compile on any SDK)
    private static final int ACTIVITY_RESUMED = 1;
    private static final int ACTIVITY_PAUSED = 2;
    private static final int SCREEN_INTERACTIVE = 15;
    private static final int SCREEN_NON_INTERACTIVE = 16;

    @Override
    public void load() {
        KairosNotificationListener.liveCallback = event -> {
            try {
                notifyListeners("notification", new JSObject(event.toString()));
            } catch (Exception ignored) { }
        };
    }

    @Override
    protected void handleOnDestroy() {
        KairosNotificationListener.liveCallback = null;
    }

    @PluginMethod
    public void getPermissionState(PluginCall call) {
        Context ctx = getContext();
        String flat = Settings.Secure.getString(ctx.getContentResolver(), "enabled_notification_listeners");
        boolean notif = flat != null && flat.contains(ctx.getPackageName());
        AppOpsManager ops = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
        int mode = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(), ctx.getPackageName());
        JSObject r = new JSObject();
        r.put("notificationAccess", notif);
        r.put("usageAccess", mode == AppOpsManager.MODE_ALLOWED);
        call.resolve(r);
    }

    @PluginMethod
    public void openNotificationAccessSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void drainNotifications(PluginCall call) {
        long since = call.getLong("sinceMs", 0L);
        try {
            JSObject r = new JSObject();
            r.put("events", new JSArray(KairosNotificationListener.drain(getContext(), since).toString()));
            call.resolve(r);
        } catch (Exception e) {
            call.reject("drain failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearBuffer(PluginCall call) {
        KairosNotificationListener.clear(getContext());
        call.resolve();
    }

    /** Foreground app sessions + screen-on sessions since `sinceMs`. */
    @PluginMethod
    public void getAppSessions(PluginCall call) {
        long since = call.getLong("sinceMs", System.currentTimeMillis() - 24L * 3600_000L);
        long now = System.currentTimeMillis();
        Context ctx = getContext();
        UsageStatsManager usm = (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
        UsageEvents events = usm.queryEvents(since, now);

        JSArray sessions = new JSArray();
        JSArray screen = new JSArray();
        Map<String, Long> open = new HashMap<>();
        long screenOn = -1;
        UsageEvents.Event ev = new UsageEvents.Event();

        while (events.hasNextEvent()) {
            events.getNextEvent(ev);
            String pkg = ev.getPackageName();
            long t = ev.getTimeStamp();
            int type = ev.getEventType();

            if (type == ACTIVITY_RESUMED) {
                open.put(pkg, t);
            } else if (type == ACTIVITY_PAUSED) {
                Long start = open.remove(pkg);
                if (start != null && t - start >= 2000 && !pkg.equals(ctx.getPackageName())) {
                    JSObject s = new JSObject();
                    s.put("pkg", pkg);
                    s.put("appLabel", AppCategory.label(ctx, pkg));
                    s.put("appCategory", AppCategory.of(ctx, pkg));
                    s.put("startMs", start);
                    s.put("endMs", t);
                    sessions.put(s);
                }
            } else if (type == SCREEN_INTERACTIVE) {
                screenOn = t;
            } else if (type == SCREEN_NON_INTERACTIVE && screenOn > 0) {
                JSObject s = new JSObject();
                s.put("startMs", screenOn);
                s.put("endMs", t);
                screen.put(s);
                screenOn = -1;
            }
        }
        JSObject r = new JSObject();
        r.put("sessions", sessions);
        r.put("screen", screen);
        call.resolve(r);
    }
}

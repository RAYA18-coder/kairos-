#!/usr/bin/env bash
# Runs in CI after `npx cap add android`. Installs the KAIROS native plugin into the generated project.
set -euo pipefail

PKG_DIR="android/app/src/main/java/com/shrii/kairos"
MANIFEST="android/app/src/main/AndroidManifest.xml"

echo ">> copying Java plugin files"
mkdir -p "$PKG_DIR"
cp mobile/android-java/*.java "$PKG_DIR/"

echo ">> raising minSdk to 26"
sed -i -E 's/minSdkVersion = [0-9]+/minSdkVersion = 26/' android/variables.gradle

echo ">> patching AndroidManifest.xml"
python3 - "$MANIFEST" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p, encoding="utf-8").read()

if "KairosNotificationListener" in s:
    print("manifest already patched"); sys.exit(0)

# 1) tools namespace
if "xmlns:tools" not in s:
    s = s.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android"',
                  '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools"', 1)

# 2) permissions + queries, placed right before <application
top = '''
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <queries>
        <intent>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent>
    </queries>

    '''
s, n = re.subn(r'(\s*)<application', top + '<application', s, count=1)
assert n == 1, "could not find <application"

# 3) listener service, placed right before </application>
svc = '''
        <service
            android:name=".KairosNotificationListener"
            android:exported="true"
            android:label="KAIROS Attention Twin"
            android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE">
            <intent-filter>
                <action android:name="android.service.notification.NotificationListenerService" />
            </intent-filter>
        </service>
    '''
s, n = re.subn(r'</application>', svc + '</application>', s, count=1)
assert n == 1, "could not find </application>"

open(p, "w", encoding="utf-8").write(s)
print("manifest patched")
PY

echo ">> done"

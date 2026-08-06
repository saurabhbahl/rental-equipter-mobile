#!/usr/bin/env bash
# Start Expo for a USB-connected Android device when phone and Mac are on different Wi‑Fi.
# Uses adb reverse so the device loads Metro via 127.0.0.1 instead of the Mac LAN IP.

set -euo pipefail

ADB="${ANDROID_HOME:+$ANDROID_HOME/platform-tools/adb}"
ADB="${ADB:-${ANDROID_SDK_ROOT:+$ANDROID_SDK_ROOT/platform-tools/adb}}"
ADB="${ADB:-$HOME/Library/Android/sdk/platform-tools/adb}"

if [[ ! -x "$ADB" ]]; then
  if command -v adb >/dev/null 2>&1; then
    ADB="$(command -v adb)"
  else
    echo "adb not found. Install Android platform-tools or set ANDROID_HOME." >&2
    exit 1
  fi
fi

if ! "$ADB" devices | awk 'NR>1 && $2=="device"{found=1} END{exit !found}'; then
  echo "No USB Android device detected. Enable USB debugging and reconnect." >&2
  exit 1
fi

"$ADB" reverse tcp:8081 tcp:8081
"$ADB" reverse tcp:8082 tcp:8082
echo "adb reverse set for 8081/8082 — Metro will use localhost on the device."

cd "$(dirname "$0")/.."
exec npx expo start --localhost "$@"

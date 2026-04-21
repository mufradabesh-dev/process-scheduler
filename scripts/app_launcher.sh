#!/bin/bash
# App Launcher - Tracks how long an app takes to open
# Usage: bash app_launcher.sh "notepad" "notepad.exe"
# or:    bash app_launcher.sh "chrome" "google-chrome"

APP_NAME=$1
APP_CMD=$2
LOG_FILE="../scripts/app_launch_log.json"

if [ -z "$APP_NAME" ] || [ -z "$APP_CMD" ]; then
  echo "Usage: bash app_launcher.sh <app_name> <app_command>"
  exit 1
fi

START_TIME=$(date +%s%3N)
START_DISPLAY=$(date '+%H:%M:%S')

echo "Launching $APP_NAME..."

# Launch app in background
$APP_CMD &>/dev/null &
APP_PID=$!

# Wait for app window (max 15 seconds)
ELAPSED=0
while [ $ELAPSED -lt 15000 ]; do
  sleep 0.1
  ELAPSED=$((ELAPSED + 100))
  # Check if process is still running
  if ! kill -0 $APP_PID 2>/dev/null; then
    break
  fi
  # Check for window (works on Linux with wmctrl)
  if command -v wmctrl &>/dev/null; then
    if wmctrl -l | grep -qi "$APP_NAME" 2>/dev/null; then
      break
    fi
  else
    # Fallback: just wait 500ms
    if [ $ELAPSED -ge 500 ]; then
      break
    fi
  fi
done

END_TIME=$(date +%s%3N)
LAUNCH_TIME=$((END_TIME - START_TIME))

echo ""
echo "============================="
echo "App: $APP_NAME"
echo "Launch Time: ${LAUNCH_TIME}ms"
echo "Started at: $START_DISPLAY"
echo "============================="

# Save to log file
ENTRY="{\"app\": \"$APP_NAME\", \"launch_time_ms\": $LAUNCH_TIME, \"started_at\": \"$START_DISPLAY\", \"date\": \"$(date '+%Y-%m-%d')\"}"

# Append to log
if [ -f "$LOG_FILE" ]; then
  python3 -c "
import json, sys
with open('$LOG_FILE', 'r') as f:
    data = json.load(f)
data.append($ENTRY)
with open('$LOG_FILE', 'w') as f:
    json.dump(data, f)
" 2>/dev/null || echo "[$ENTRY]" > "$LOG_FILE"
else
  echo "[$ENTRY]" > "$LOG_FILE"
fi

echo "Result saved to app_launch_log.json"
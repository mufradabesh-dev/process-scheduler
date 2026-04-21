#!/bin/bash
# System Monitor - Outputs JSON for backend

CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 2>/dev/null)
if [ -z "$CPU" ]; then
  CPU=$(top -bn1 | grep "Cpu(s)" | sed 's/.*, *\([0-9.]*\)%* id.*/\1/' | awk '{print 100 - $1}' 2>/dev/null)
fi
if [ -z "$CPU" ]; then CPU="0"; fi

TOTAL_RAM=$(free -m | awk 'NR==2{print $2}')
USED_RAM=$(free -m | awk 'NR==2{print $3}')
FREE_RAM=$(free -m | awk 'NR==2{print $4}')
RAM_PERCENT=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')

DISK_TOTAL=$(df -h / | awk 'NR==2{print $2}')
DISK_USED=$(df -h / | awk 'NR==2{print $3}')
DISK_PERCENT=$(df / | awk 'NR==2{print $5}' | tr -d '%')

UPTIME=$(uptime -p 2>/dev/null || echo "running")
PROC_COUNT=$(ps aux | wc -l)

echo "{
  \"cpu\": $CPU,
  \"ram\": {
    \"total\": $TOTAL_RAM,
    \"used\":  $USED_RAM,
    \"free\": $FREE_RAM,
    \"percent\": $RAM_PERCENT
  },
  \"disk\": {
    \"total\": \"$DISK_TOTAL\",
    \"used\": \"$DISK_USED\",
    \"percent\": $DISK_PERCENT
  },
  \"uptime\": \"$UPTIME\",
  \"processes\": $PROC_COUNT,
  \"timestamp\": \"$(date '+%H:%M:%S')\"
}"
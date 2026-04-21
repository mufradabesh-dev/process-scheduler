#!/bin/bash
echo "================================"
echo "  Round Robin Scheduling        "
echo "================================"

read -p "Enter number of processes: " n
read -p "Enter Time Quantum: " quantum

declare -a pid
declare -a arrival
declare -a burst
declare -a remaining
declare -a finish
declare -a turnaround
declare -a waiting

for ((i=0; i<n; i++)); do
  read -p "Enter Process ID: " pid[$i]
  read -p "Enter Arrival Time for ${pid[$i]}: " arrival[$i]
  read -p "Enter Burst Time for ${pid[$i]}: " burst[$i]
  remaining[$i]=${burst[$i]}
done

time=0
completed=0
total_waiting=0
total_turnaround=0

echo ""
echo "Gantt Chart:"
echo -n "| "

while [ $completed -lt $n ]; do
  did_something=0
  for ((i=0; i<n; i++)); do
    if [ ${remaining[$i]} -gt 0 ] && [ ${arrival[$i]} -le $time ]; then
      did_something=1
      if [ ${remaining[$i]} -gt $quantum ]; then
        echo -n "${pid[$i]}($time-$((time+quantum))) | "
        time=$((time+quantum))
        remaining[$i]=$((remaining[$i]-quantum))
      else
        echo -n "${pid[$i]}($time-$((time+remaining[$i]))) | "
        time=$((time+remaining[$i]))
        finish[$i]=$time
        turnaround[$i]=$((finish[$i]-arrival[$i]))
        waiting[$i]=$((turnaround[$i]-burst[$i]))
        remaining[$i]=0
        completed=$((completed+1))
        total_waiting=$((total_waiting+waiting[$i]))
        total_turnaround=$((total_turnaround+turnaround[$i]))
      fi
    fi
  done
  if [ $did_something -eq 0 ]; then
    time=$((time+1))
  fi
done

echo ""
echo ""
echo "-------------------------------------------------------------"
printf "%-10s %-10s %-10s %-10s %-12s %-10s\n" "Process" "Arrival" "Burst" "Finish" "Turnaround" "Waiting"
echo "-------------------------------------------------------------"
for ((i=0; i<n; i++)); do
  printf "%-10s %-10s %-10s %-10s %-12s %-10s\n" "${pid[$i]}" "${arrival[$i]}" "${burst[$i]}" "${finish[$i]}" "${turnaround[$i]}" "${waiting[$i]}"
done
echo "-------------------------------------------------------------"
echo "Average Waiting Time   : $(echo "scale=2; $total_waiting/$n" | bc)"
echo "Average Turnaround Time: $(echo "scale=2; $total_turnaround/$n" | bc)"

echo "RoundRobin Result - $(date)" >> scheduler_log.txt
for ((i=0; i<n; i++)); do
  echo "${pid[$i]} | AT:${arrival[$i]} | BT:${burst[$i]} | FT:${finish[$i]} | TAT:${turnaround[$i]} | WT:${waiting[$i]}" >> scheduler_log.txt
done
echo "---" >> scheduler_log.txt
echo "✅ Result saved to scheduler_log.txt"
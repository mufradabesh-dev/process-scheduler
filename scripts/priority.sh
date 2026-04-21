#!/bin/bash
echo "================================"
echo "  Priority Scheduling Algorithm "
echo "================================"

read -p "Enter number of processes: " n

declare -a pid
declare -a arrival
declare -a burst
declare -a priority
declare -a finish
declare -a turnaround
declare -a waiting
declare -a done_flag

for ((i=0; i<n; i++)); do
  read -p "Enter Process ID: " pid[$i]
  read -p "Enter Arrival Time for ${pid[$i]}: " arrival[$i]
  read -p "Enter Burst Time for ${pid[$i]}: " burst[$i]
  read -p "Enter Priority for ${pid[$i]} (lower=higher priority): " priority[$i]
  done_flag[$i]=0
done

time=0
completed=0
total_waiting=0
total_turnaround=0

while [ $completed -lt $n ]; do
  min_priority=99999
  selected=-1

  for ((i=0; i<n; i++)); do
    if [ ${done_flag[$i]} -eq 0 ] && [ ${arrival[$i]} -le $time ]; then
      if [ ${priority[$i]} -lt $min_priority ]; then
        min_priority=${priority[$i]}
        selected=$i
      fi
    fi
  done

  if [ $selected -eq -1 ]; then
    time=$((time+1))
    continue
  fi

  finish[$selected]=$((time+burst[$selected]))
  turnaround[$selected]=$((finish[$selected]-arrival[$selected]))
  waiting[$selected]=$((turnaround[$selected]-burst[$selected]))
  time=${finish[$selected]}
  done_flag[$selected]=1
  completed=$((completed+1))
  total_waiting=$((total_waiting+waiting[$selected]))
  total_turnaround=$((total_turnaround+turnaround[$selected]))
done

echo ""
echo "-------------------------------------------------------------"
printf "%-10s %-10s %-10s %-8s %-10s %-12s %-10s\n" "Process" "Arrival" "Burst" "Priority" "Finish" "Turnaround" "Waiting"
echo "-------------------------------------------------------------"
for ((i=0; i<n; i++)); do
  printf "%-10s %-10s %-10s %-8s %-10s %-12s %-10s\n" "${pid[$i]}" "${arrival[$i]}" "${burst[$i]}" "${priority[$i]}" "${finish[$i]}" "${turnaround[$i]}" "${waiting[$i]}"
done
echo "-------------------------------------------------------------"
echo "Average Waiting Time   : $(echo "scale=2; $total_waiting/$n" | bc)"
echo "Average Turnaround Time: $(echo "scale=2; $total_turnaround/$n" | bc)"

echo "Priority Result - $(date)" >> scheduler_log.txt
for ((i=0; i<n; i++)); do
  echo "${pid[$i]} | AT:${arrival[$i]} | BT:${burst[$i]} | PR:${priority[$i]} | FT:${finish[$i]} | TAT:${turnaround[$i]} | WT:${waiting[$i]}" >> scheduler_log.txt
done
echo "---" >> scheduler_log.txt
echo "✅ Result saved to scheduler_log.txt"
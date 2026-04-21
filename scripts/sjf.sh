#!/bin/bash
echo "============================="
echo "   SJF Scheduling Algorithm   "
echo "============================="

read -p "Enter number of processes: " n

declare -a pid
declare -a arrival
declare -a burst
declare -a finish
declare -a turnaround
declare -a waiting
declare -a done_flag

for ((i=0; i<n; i++)); do
  read -p "Enter Process ID: " pid[$i]
  read -p "Enter Arrival Time for ${pid[$i]}: " arrival[$i]
  read -p "Enter Burst Time for ${pid[$i]}: " burst[$i]
  done_flag[$i]=0
done

time=0
completed=0
total_waiting=0
total_turnaround=0

declare -a order_pid
declare -a order_arrival
declare -a order_burst
declare -a order_finish
declare -a order_turnaround
declare -a order_waiting
idx=0

while [ $completed -lt $n ]; do
  min_burst=99999
  selected=-1

  for ((i=0; i<n; i++)); do
    if [ ${done_flag[$i]} -eq 0 ] && [ ${arrival[$i]} -le $time ]; then
      if [ ${burst[$i]} -lt $min_burst ]; then
        min_burst=${burst[$i]}
        selected=$i
      fi
    fi
  done

  if [ $selected -eq -1 ]; then
    time=$((time+1))
    continue
  fi

  finish[$selected]=$((time + burst[$selected]))
  turnaround[$selected]=$((finish[$selected] - arrival[$selected]))
  waiting[$selected]=$((turnaround[$selected] - burst[$selected]))
  time=${finish[$selected]}
  done_flag[$selected]=1
  completed=$((completed+1))
  total_waiting=$((total_waiting + waiting[$selected]))
  total_turnaround=$((total_turnaround + turnaround[$selected]))

  order_pid[$idx]=${pid[$selected]}
  order_arrival[$idx]=${arrival[$selected]}
  order_burst[$idx]=${burst[$selected]}
  order_finish[$idx]=${finish[$selected]}
  order_turnaround[$idx]=${turnaround[$selected]}
  order_waiting[$idx]=${waiting[$selected]}
  idx=$((idx+1))
done

echo ""
echo "-------------------------------------------------------------"
printf "%-10s %-10s %-10s %-10s %-12s %-10s\n" "Process" "Arrival" "Burst" "Finish" "Turnaround" "Waiting"
echo "-------------------------------------------------------------"
for ((i=0; i<n; i++)); do
  printf "%-10s %-10s %-10s %-10s %-12s %-10s\n" "${order_pid[$i]}" "${order_arrival[$i]}" "${order_burst[$i]}" "${order_finish[$i]}" "${order_turnaround[$i]}" "${order_waiting[$i]}"
done
echo "-------------------------------------------------------------"
echo "Average Waiting Time   : $(echo "scale=2; $total_waiting/$n" | bc)"
echo "Average Turnaround Time: $(echo "scale=2; $total_turnaround/$n" | bc)"

echo "SJF Result - $(date)" >> scheduler_log.txt
for ((i=0; i<n; i++)); do
  echo "${order_pid[$i]} | AT:${order_arrival[$i]} | BT:${order_burst[$i]} | FT:${order_finish[$i]} | TAT:${order_turnaround[$i]} | WT:${order_waiting[$i]}" >> scheduler_log.txt
done
echo "---" >> scheduler_log.txt
echo "Result saved to scheduler_log.txt"
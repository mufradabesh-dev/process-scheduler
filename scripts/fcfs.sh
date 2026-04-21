#!/bin/bash
echo "============================="
echo "   FCFS Scheduling Algorithm  "
echo "============================="

read -p "Enter number of processes: " n

declare -a pid
declare -a arrival
declare -a burst
declare -a finish
declare -a turnaround
declare -a waiting

for ((i=0; i<n; i++)); do
  read -p "Enter Process ID (e.g P$((i+1))): " pid[$i]
  read -p "Enter Arrival Time for ${pid[$i]}: " arrival[$i]
  read -p "Enter Burst Time for ${pid[$i]}: " burst[$i]
done

# Sort by arrival time (bubble sort)
for ((i=0; i<n-1; i++)); do
  for ((j=0; j<n-i-1; j++)); do
    if [ ${arrival[$j]} -gt ${arrival[$((j+1))]} ]; then
      tmp=${pid[$j]}; pid[$j]=${pid[$((j+1))]}; pid[$((j+1))]=$tmp
      tmp=${arrival[$j]}; arrival[$j]=${arrival[$((j+1))]}; arrival[$((j+1))]=$tmp
      tmp=${burst[$j]}; burst[$j]=${burst[$((j+1))]}; burst[$((j+1))]=$tmp
    fi
  done
done

time=0
total_waiting=0
total_turnaround=0

for ((i=0; i<n; i++)); do
  if [ $time -lt ${arrival[$i]} ]; then
    time=${arrival[$i]}
  fi
  finish[$i]=$((time + burst[$i]))
  turnaround[$i]=$((finish[$i] - arrival[$i]))
  waiting[$i]=$((turnaround[$i] - burst[$i]))
  time=${finish[$i]}
  total_waiting=$((total_waiting + waiting[$i]))
  total_turnaround=$((total_turnaround + turnaround[$i]))
done

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

# Save to log
echo "FCFS Result - $(date)" >> scheduler_log.txt
for ((i=0; i<n; i++)); do
  echo "${pid[$i]} | AT:${arrival[$i]} | BT:${burst[$i]} | FT:${finish[$i]} | TAT:${turnaround[$i]} | WT:${waiting[$i]}" >> scheduler_log.txt
done
echo "---" >> scheduler_log.txt
echo ""
echo "Result saved to scheduler_log.txt"
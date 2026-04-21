#!/bin/bash
echo "================================"
echo "  Banker's Algorithm            "
echo "  (Deadlock Avoidance)          "
echo "================================"

read -p "Enter number of processes: " n
read -p "Enter number of resource types: " m

declare -a available
declare -a max
declare -a allocation
declare -a need
declare -a finish
declare -a safe_seq

echo ""
echo "Enter Available Resources:"
for ((j=0; j<m; j++)); do
  read -p "  Resource R$j: " available[$j]
done

echo ""
echo "Enter MAX Matrix:"
for ((i=0; i<n; i++)); do
  for ((j=0; j<m; j++)); do
    read -p "  Max[P$i][R$j]: " max[$((i*m+j))]
  done
done

echo ""
echo "Enter ALLOCATION Matrix:"
for ((i=0; i<n; i++)); do
  for ((j=0; j<m; j++)); do
    read -p "  Alloc[P$i][R$j]: " allocation[$((i*m+j))]
  done
done

# Calculate Need
for ((i=0; i<n; i++)); do
  for ((j=0; j<m; j++)); do
    need[$((i*m+j))]=$((max[$((i*m+j))] - allocation[$((i*m+j))]))
  done
done

declare -a work
for ((j=0; j<m; j++)); do
  work[$j]=${available[$j]}
done

for ((i=0; i<n; i++)); do
  finish[$i]=0
done

count=0
safe_idx=0

while [ $count -lt $n ]; do
  found=0
  for ((i=0; i<n; i++)); do
    if [ ${finish[$i]} -eq 0 ]; then
      can=1
      for ((j=0; j<m; j++)); do
        if [ ${need[$((i*m+j))]} -gt ${work[$j]} ]; then
          can=0
          break
        fi
      done
      if [ $can -eq 1 ]; then
        for ((j=0; j<m; j++)); do
          work[$j]=$((work[$j] + allocation[$((i*m+j))]))
        done
        finish[$i]=1
        safe_seq[$safe_idx]="P$i"
        safe_idx=$((safe_idx+1))
        count=$((count+1))
        found=1
      fi
    fi
  done
  if [ $found -eq 0 ]; then
    break
  fi
done

echo ""
if [ $count -eq $n ]; then
  echo "✅ System is in SAFE State!"
  echo -n "Safe Sequence: "
  for ((i=0; i<n; i++)); do
    echo -n "${safe_seq[$i]}"
    if [ $i -lt $((n-1)) ]; then echo -n " → "; fi
  done
  echo ""

  echo "Banker's Result - $(date)" >> scheduler_log.txt
  echo -n "Safe Sequence: " >> scheduler_log.txt
  for ((i=0; i<n; i++)); do
    echo -n "${safe_seq[$i]} → " >> scheduler_log.txt
  done
  echo "" >> scheduler_log.txt
  echo "---" >> scheduler_log.txt
  echo ""
  echo "✅ Result saved to scheduler_log.txt"
else
  echo "❌ System is in UNSAFE State! Deadlock may occur!"
fi
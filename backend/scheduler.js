// =====================
// FCFS Algorithm
// =====================
function fcfs(processes) {
  let time = 0;
  return [...processes]
    .sort((a, b) => a.arrivalTime - b.arrivalTime)
    .map(p => {
      if (time < p.arrivalTime) time = p.arrivalTime;
      const start = time;
      const finish = time + p.burstTime;
      const turnaround = finish - p.arrivalTime;
      const waiting = turnaround - p.burstTime;
      time = finish;
      return { ...p, start, finish, turnaround, waiting };
    });
}

// =====================
// SJF Algorithm (Non-Preemptive)
// =====================
function sjf(processes) {
  let time = 0;
  let done = [];
  let remaining = [...processes];

  while (remaining.length > 0) {
    const available = remaining.filter(p => p.arrivalTime <= time);
    if (available.length === 0) {
      time = Math.min(...remaining.map(p => p.arrivalTime));
      continue;
    }
    available.sort((a, b) => a.burstTime - b.burstTime);
    const p = available[0];
    remaining = remaining.filter(x => x.id !== p.id);
    const start = time;
    const finish = time + p.burstTime;
    const turnaround = finish - p.arrivalTime;
    const waiting = turnaround - p.burstTime;
    time = finish;
    done.push({ ...p, start, finish, turnaround, waiting });
  }
  return done;
}

// =====================
// Round Robin Algorithm
// =====================
function roundRobin(processes, quantum) {
  let time = 0;
  let done = [];
  let gantt = [];
  let remaining = processes.map(p => ({ ...p, remainingTime: p.burstTime }));
  remaining.sort((a, b) => a.arrivalTime - b.arrivalTime);

  let queue = [];
  let arrived = [];

  queue.push(remaining.shift());

  while (queue.length > 0) {
    const p = queue.shift();
    const execTime = Math.min(p.remainingTime, quantum);
    gantt.push({ id: p.id, start: time, finish: time + execTime });
    time += execTime;
    p.remainingTime -= execTime;

    // Add newly arrived processes
    remaining.filter(x => x.arrivalTime <= time && !arrived.includes(x.id)).forEach(x => {
      arrived.push(x.id);
      queue.push(x);
      remaining = remaining.filter(r => r.id !== x.id);
    });

    if (p.remainingTime > 0) {
      queue.push(p);
    } else {
      const finish = time;
      const turnaround = finish - p.arrivalTime;
      const waiting = turnaround - p.burstTime;
      done.push({ ...p, start: gantt.find(g => g.id === p.id).start, finish, turnaround, waiting });
    }
  }
  return { done, gantt };
}

// =====================
// Priority Scheduling (Non-Preemptive)
// =====================
function priority(processes) {
  let time = 0;
  let done = [];
  let remaining = [...processes];

  while (remaining.length > 0) {
    const available = remaining.filter(p => p.arrivalTime <= time);
    if (available.length === 0) {
      time = Math.min(...remaining.map(p => p.arrivalTime));
      continue;
    }
    available.sort((a, b) => a.priority - b.priority);
    const p = available[0];
    remaining = remaining.filter(x => x.id !== p.id);
    const start = time;
    const finish = time + p.burstTime;
    const turnaround = finish - p.arrivalTime;
    const waiting = turnaround - p.burstTime;
    time = finish;
    done.push({ ...p, start, finish, turnaround, waiting });
  }
  return done;
}

// =====================
// Banker's Algorithm (Deadlock Avoidance)
// =====================
function bankers(processes, available, max, allocation) {
  const n = processes.length;
  const m = available.length;

  let need = [];
  for (let i = 0; i < n; i++) {
    need[i] = [];
    for (let j = 0; j < m; j++) {
      need[i][j] = max[i][j] - allocation[i][j];
    }
  }

  let work = [...available];
  let finish = new Array(n).fill(false);
  let safeSequence = [];

  let iterations = 0;
  while (safeSequence.length < n && iterations < n * n) {
    iterations++;
    let found = false;
    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        let canAllocate = true;
        for (let j = 0; j < m; j++) {
          if (need[i][j] > work[j]) {
            canAllocate = false;
            break;
          }
        }
        if (canAllocate) {
          for (let j = 0; j < m; j++) work[j] += allocation[i][j];
          finish[i] = true;
          safeSequence.push(processes[i]);
          found = true;
        }
      }
    }
    if (!found) break;
  }

  return safeSequence.length === n
    ? { safe: true, safeSequence, need }
    : { safe: false, safeSequence: [], need };
}

module.exports = { fcfs, sjf, roundRobin, priority, bankers };
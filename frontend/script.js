const API = "https://freefall-handoff-growl.ngrok-free.dev/api";
let processes = [];
let selectedAlgo = "FCFS";

// SERVER STATUS CHECK
async function checkServer() {
  try {
    const res = await fetch("https://freefall-handoff-growl.ngrok-free.dev/", {
      headers: { "ngrok-skip-browser-warning": "true" }
    });
    if (res.ok) {
      document.getElementById("serverStatus").textContent = "● Server Online";
      document.getElementById("serverStatus").className = "status-dot online";
      document.getElementById("dbStatus").textContent = "● DB Connected";
      document.getElementById("dbStatus").className = "status-dot online";
    }
  } catch {
    document.getElementById("serverStatus").textContent = "● Server Offline";
    document.getElementById("serverStatus").className = "status-dot offline";
    document.getElementById("dbStatus").textContent = "● DB Offline";
    document.getElementById("dbStatus").className = "status-dot offline";
  }
}

// TAB SWITCHING
function showTab(name, e) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  e.target.classList.add("active");
  if (name === "history") loadHistory();
  if (name === "bankers") generateBankersInputs();
}

// ALGORITHM SELECTION
function selectAlgo(algo, btn) {
  selectedAlgo = algo;
  document.getElementById("algorithm").value = algo;
  document.querySelectorAll(".algo-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("quantumDiv").style.display = algo === "RoundRobin" ? "block" : "none";
  document.getElementById("priorityGroup").style.display = algo === "Priority" ? "block" : "none";
}

// ADD PROCESS
function addProcess() {
  const id = document.getElementById("processId").value.trim();
  const arrivalTime = parseInt(document.getElementById("arrivalTime").value);
  const burstTime = parseInt(document.getElementById("burstTime").value);
  const priority = parseInt(document.getElementById("priorityInput").value) || 0;

  if (!id) { alert("Please enter a Process ID!"); return; }
  if (isNaN(arrivalTime) || arrivalTime < 0) { alert("Please enter a valid Arrival Time!"); return; }
  if (isNaN(burstTime) || burstTime < 1) { alert("Please enter a valid Burst Time!"); return; }
  if (processes.find(p => p.id === id)) {
    alert("This Process ID already exists!");
    document.getElementById("processId").value = "";
    document.getElementById("processId").focus();
    return;
  }

  processes.push({ id, arrivalTime, burstTime, priority });
  renderProcessTable();
  clearInputs();
  document.getElementById("processId").focus();
}

// RENDER PROCESS TABLE
function renderProcessTable() {
  const tbody = document.getElementById("processBody");
  document.getElementById("processCount").textContent = processes.length;

  if (processes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No processes added yet</td></tr>`;
    return;
  }

  tbody.innerHTML = processes.map((p, i) => `
    <tr>
      <td>${p.id}</td>
      <td>${p.arrivalTime}</td>
      <td>${p.burstTime}</td>
      <td>${p.priority}</td>
      <td><button class="delete-btn" onclick="deleteProcess(${i})">✕</button></td>
    </tr>`).join("");
}

function deleteProcess(index) {
  processes.splice(index, 1);
  renderProcessTable();
}

function clearInputs() {
  ["processId", "arrivalTime", "burstTime", "priorityInput"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

// CLEAR ALL
function clearAll() {
  processes = [];
  renderProcessTable();
  document.getElementById("resultCard").style.display = "none";
  document.getElementById("ganttCard").style.display = "none";
  document.getElementById("resultBody").innerHTML = "";
  document.getElementById("averages").innerHTML = "";
  document.getElementById("ganttChart").innerHTML = "";
}

// RUN SCHEDULER
async function runScheduler() {
  if (processes.length === 0) {
    alert("Please add at least one process!");
    return;
  }

  const algorithm = document.getElementById("algorithm").value;
  const quantum = parseInt(document.getElementById("quantum").value) || 2;

  const btn = document.querySelector(".btn-run");
  btn.textContent = "Running...";
  btn.disabled = true;

  try {
    const response = await fetch(`${API}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ processes, algorithm, quantum }),
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById("resultAlgo").textContent = algorithm;
      renderResult(data.result);
      renderGantt(data.result, data.gantt);
    } else {
      alert("Error: " + data.error);
    }
  } catch (err) {
    alert("Server offline! Please make sure XAMPP and node server.js are running.");
  } finally {
    btn.textContent = "▶ Run Scheduler";
    btn.disabled = false;
  }
}

// RENDER RESULTS
function renderResult(result) {
  const tbody = document.getElementById("resultBody");
  let totalWaiting = 0, totalTurnaround = 0;

  tbody.innerHTML = result.map(p => {
    totalWaiting += p.waiting;
    totalTurnaround += p.turnaround;
    return `<tr>
      <td>${p.id}</td>
      <td>${p.arrivalTime}</td>
      <td>${p.burstTime}</td>
      <td>${p.start ?? "-"}</td>
      <td>${p.finish}</td>
      <td>${p.turnaround}</td>
      <td>${p.waiting}</td>
    </tr>`;
  }).join("");

  const n = result.length;
  document.getElementById("averages").innerHTML = `
    <span>Avg Waiting Time: <b>${(totalWaiting / n).toFixed(2)}</b></span>
    <span>Avg Turnaround Time: <b>${(totalTurnaround / n).toFixed(2)}</b></span>
    <span>Total Processes: <b>${n}</b></span>
  `;

  document.getElementById("resultCard").style.display = "block";
}

// RENDER GANTT CHART
function renderGantt(result, gantt) {
  const wrap = document.getElementById("ganttChart");

  const items = (gantt && gantt.length > 0) ? gantt : result.map(p => ({
    id: p.id, start: p.start ?? 0, finish: p.finish
  }));

  const colors = [
    "#7c3aed", "#00f5ff", "#ff2d78", "#ffaa00",
    "#00ff88", "#f0f", "#3b82f6", "#f97316"
  ];

  let html = `<div style="display:flex; flex-wrap:wrap; gap:0; margin-bottom:8px;">`;

  items.forEach((p, i) => {
    const width = Math.max((p.finish - p.start) * 50, 60);
    const color = colors[i % colors.length];
    html += `
      <div style="display:flex; flex-direction:column; align-items:center; min-width:${width}px;">
        <div style="background:${color}; color:#fff; width:100%; padding:12px 6px; text-align:center; font-family:var(--mono); font-size:0.9rem; font-weight:bold; border:2px solid rgba(255,255,255,0.1); border-radius:4px;">${p.id}</div>
        <div style="display:flex; justify-content:space-between; width:100%; font-family:var(--mono); font-size:0.72rem; color:var(--text-dim); margin-top:4px; padding:0 2px;">
          <span>${p.start}</span><span>${p.finish}</span>
        </div>
      </div>`;
  });

  html += `</div>`;

  const totalTime = items[items.length - 1].finish - items[0].start;
  html += `
    <div style="margin-top:10px; font-family:var(--mono); font-size:0.8rem; color:var(--text-dim); padding:8px 12px; background:rgba(0,245,255,0.04); border-radius:6px; border-left:3px solid var(--accent);">
      Total Execution Time: <b style="color:var(--accent)">${totalTime}</b> units
      &nbsp;|&nbsp; Total Processes: <b style="color:var(--accent)">${result.length}</b>
    </div>`;

  wrap.innerHTML = html;
  document.getElementById("ganttCard").style.display = "block";
}

// BANKER'S ALGORITHM
function generateBankersInputs() {
  const n = parseInt(document.getElementById("bProcessCount").value) || 3;
  const m = parseInt(document.getElementById("bResourceCount").value) || 3;
  const area = document.getElementById("bankersInputArea");

  let html = `<div class="banker-matrix">
    <label>Available Resources (${m} resources)</label>
    <div class="matrix-row">`;
  for (let j = 0; j < m; j++) {
    html += `<input type="number" id="avail_${j}" value="0" min="0" placeholder="R${j}" />`;
  }
  html += `</div></div>`;

  html += `<div class="banker-matrix"><label>MAX Matrix (${n} processes x ${m} resources)</label>`;
  for (let i = 0; i < n; i++) {
    html += `<div class="matrix-row"><span>P${i}</span>`;
    for (let j = 0; j < m; j++) {
      html += `<input type="number" id="max_${i}_${j}" value="0" min="0" />`;
    }
    html += `</div>`;
  }
  html += `</div>`;

  html += `<div class="banker-matrix"><label>ALLOCATION Matrix (${n} processes x ${m} resources)</label>`;
  for (let i = 0; i < n; i++) {
    html += `<div class="matrix-row"><span>P${i}</span>`;
    for (let j = 0; j < m; j++) {
      html += `<input type="number" id="alloc_${i}_${j}" value="0" min="0" />`;
    }
    html += `</div>`;
  }
  html += `</div>`;

  area.innerHTML = html;
}

async function runBankers() {
  const n = parseInt(document.getElementById("bProcessCount").value);
  const m = parseInt(document.getElementById("bResourceCount").value);

  const available = [];
  for (let j = 0; j < m; j++) {
    available.push(parseInt(document.getElementById(`avail_${j}`).value) || 0);
  }

  const max = [];
  for (let i = 0; i < n; i++) {
    max[i] = [];
    for (let j = 0; j < m; j++) {
      max[i][j] = parseInt(document.getElementById(`max_${i}_${j}`).value) || 0;
    }
  }

  const allocation = [];
  for (let i = 0; i < n; i++) {
    allocation[i] = [];
    for (let j = 0; j < m; j++) {
      allocation[i][j] = parseInt(document.getElementById(`alloc_${i}_${j}`).value) || 0;
    }
  }

  const processList = Array.from({ length: n }, (_, i) => `P${i}`);

  try {
    const response = await fetch(`${API}/bankers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ processes: processList, available, max, allocation })
    });

    const data = await response.json();
    const resultDiv = document.getElementById("bankersResult");

    if (data.safe) {
      resultDiv.innerHTML = `
        <div class="banker-safe">
          <div style="font-size:1.1rem;">✅ <b>System is in SAFE State!</b></div>
          <div class="safe-seq">Safe Sequence: <b>${data.safeSequence.join(" → ")}</b></div>
          ${data.need ? renderNeedMatrix(data.need, n, m) : ""}
        </div>`;
    } else {
      resultDiv.innerHTML = `
        <div class="banker-unsafe">
          <div style="font-size:1.1rem;">❌ <b>System is in UNSAFE State!</b></div>
          <div style="margin-top:8px;">Deadlock may occur! Please re-allocate resources.</div>
        </div>`;
    }
  } catch (err) {
    alert("Server offline!");
  }
}

function renderNeedMatrix(need, n, m) {
  let html = `<div style="margin-top:15px;"><b>NEED Matrix:</b><div style="overflow-x:auto;"><table style="margin-top:8px; border-collapse:collapse;"><tr><th style="padding:8px 12px; border:1px solid #ffffff22;">Process</th>`;
  for (let j = 0; j < m; j++) html += `<th style="padding:8px 12px; border:1px solid #ffffff22;">R${j}</th>`;
  html += `</tr>`;
  for (let i = 0; i < n; i++) {
    html += `<tr><td style="padding:8px 12px; border:1px solid #ffffff22; text-align:center;">P${i}</td>`;
    for (let j = 0; j < m; j++) html += `<td style="padding:8px 12px; border:1px solid #ffffff22; text-align:center;">${need[i][j]}</td>`;
    html += `</tr>`;
  }
  html += `</table></div></div>`;
  return html;
}

// HISTORY
async function loadHistory() {
  try {
    const response = await fetch(`${API}/history`, {
      headers: { "ngrok-skip-browser-warning": "true" }
    });
    const data = await response.json();
    const tbody = document.getElementById("historyBody");

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-msg">No history found</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td>${p.process_name}</td>
        <td><span style="color:var(--accent)">${p.algorithm}</span></td>
        <td>${p.arrival_time}</td>
        <td>${p.burst_time}</td>
        <td>${p.waiting_time}</td>
        <td>${p.turnaround_time}</td>
        <td>${p.finish_time}</td>
        <td style="font-size:0.75rem; color:var(--text-dim);">${new Date(p.created_at).toLocaleString()}</td>
      </tr>`).join("");
  } catch (err) {
    alert("Failed to load history!");
  }
}

async function clearHistory() {
  if (!confirm("Are you sure you want to clear history?")) return;
  try {
    await fetch(`${API}/history`, {
      method: "DELETE",
      headers: { "ngrok-skip-browser-warning": "true" }
    });
    document.getElementById("historyBody").innerHTML =
      `<tr><td colspan="8" class="empty-msg">History cleared!</td></tr>`;
  } catch (err) {
    alert("Error clearing history!");
  }
}

// COMPARE ALL
let cmpProcesses = [];

function addCmpProcess() {
  const id = document.getElementById("cmpProcessId").value.trim();
  const arrivalTime = parseInt(document.getElementById("cmpArrival").value);
  const burstTime = parseInt(document.getElementById("cmpBurst").value);
  const priority = parseInt(document.getElementById("cmpPriority").value) || 1;

  if (!id) { alert("Please enter a Process ID!"); return; }
  if (isNaN(arrivalTime) || arrivalTime < 0) { alert("Please enter a valid Arrival Time!"); return; }
  if (isNaN(burstTime) || burstTime < 1) { alert("Please enter a valid Burst Time!"); return; }
  if (cmpProcesses.find(p => p.id === id)) {
    alert("This Process ID already exists!");
    document.getElementById("cmpProcessId").value = "";
    return;
  }

  cmpProcesses.push({ id, arrivalTime, burstTime, priority });
  renderCmpTable();

  document.getElementById("cmpProcessId").value = "";
  document.getElementById("cmpArrival").value = "";
  document.getElementById("cmpBurst").value = "";
  document.getElementById("cmpPriority").value = "";
  document.getElementById("cmpProcessId").focus();
}

function renderCmpTable() {
  const tbody = document.getElementById("cmpProcessBody");

  if (cmpProcesses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No processes added yet</td></tr>`;
    return;
  }

  tbody.innerHTML = cmpProcesses.map((p, i) => `
    <tr>
      <td>${p.id}</td>
      <td>${p.arrivalTime}</td>
      <td>${p.burstTime}</td>
      <td>${p.priority}</td>
      <td><button class="delete-btn" onclick="deleteCmpProcess(${i})">✕</button></td>
    </tr>`).join("");
}

function deleteCmpProcess(index) {
  cmpProcesses.splice(index, 1);
  renderCmpTable();
}

function clearCmp() {
  cmpProcesses = [];
  renderCmpTable();
  document.getElementById("winnerBanner").style.display = "none";
  document.getElementById("summaryCard").style.display = "none";
  document.getElementById("processOrderCard").style.display = "none";
  document.getElementById("allAlgoResults").innerHTML = "";
}

async function runComparison() {
  if (cmpProcesses.length === 0) {
    alert("Please add at least one process!");
    return;
  }

  const quantum = parseInt(document.getElementById("cmpQuantum").value) || 2;
  const btn = document.querySelector("#tab-compare .btn-run");
  btn.textContent = "Running...";
  btn.disabled = true;

  try {
    const response = await fetch(`${API}/compare`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ processes: cmpProcesses, quantum })
    });

    const data = await response.json();

    if (data.success) {
      renderWinner(data.best, data.compare);
      renderSummary(data.compare, data.best);
      renderProcessOrder(data.processOrder, data.compare);
      renderAllAlgoResults(data.compare);
    } else {
      alert("Error: " + data.error);
    }
  } catch {
    alert("Server offline!");
  } finally {
    btn.textContent = "⚡ Run Comparison";
    btn.disabled = false;
  }
}

function renderWinner(best, compare) {
  const winner = compare.find(c => c.algorithm === best);
  const descriptions = {
    FCFS: "Simple and fair — best when all processes arrive at similar times.",
    SJF: "Minimizes waiting time — best when burst times vary significantly.",
    RoundRobin: "Fair time-sharing — best for interactive and time-sensitive systems.",
    Priority: "Important tasks first — best when processes have different urgency levels."
  };

  document.getElementById("winnerContent").innerHTML = `
    <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
      <div class="winner-badge">🏆</div>
      <div>
        <div style="font-family:var(--mono); font-size:1.4rem; color:#fff; font-weight:900; letter-spacing:3px;">${winner.fullName}</div>
        <div style="font-family:var(--mono); font-size:0.8rem; color:var(--accent4); margin-top:6px;">Avg Waiting: <b>${winner.avgWaiting}</b> | Avg Turnaround: <b>${winner.avgTurnaround}</b></div>
        <div style="font-family:var(--sans); font-size:0.9rem; color:var(--text-dim); margin-top:8px;">${descriptions[best] || ""}</div>
      </div>
    </div>`;

  document.getElementById("winnerBanner").style.display = "block";
}

function renderSummary(compare, best) {
  const sorted = [...compare].sort((a, b) => a.avgWaiting - b.avgWaiting);
  const ranks = ["🥇 1st", "🥈 2nd", "🥉 3rd", "4th"];
  const bestFor = {
    FCFS: "Simple workloads",
    SJF: "Minimum waiting",
    RoundRobin: "Time sharing",
    Priority: "Urgent tasks"
  };

  document.getElementById("summaryBody").innerHTML = sorted.map((c, i) => `
    <tr style="${c.algorithm === best ? 'background:rgba(0,255,136,0.06);' : ''}">
      <td><span style="font-family:var(--mono); color:${c.algorithm === best ? 'var(--accent4)' : 'var(--accent)'}; font-weight:bold;">${c.algorithm === best ? '✅ ' : ''}${c.fullName}</span></td>
      <td style="color:${c.algorithm === best ? 'var(--accent4)' : 'var(--text)'}; font-weight:${c.algorithm === best ? 'bold' : 'normal'};">${c.avgWaiting}</td>
      <td>${c.avgTurnaround}</td>
      <td style="color:var(--text-dim); font-size:0.8rem;">${bestFor[c.algorithm] || "-"}</td>
      <td>${ranks[i]}</td>
    </tr>`).join("");

  document.getElementById("summaryCard").style.display = "block";
}

function renderProcessOrder(processOrder, compare) {
  const algos = compare.map(c => c.algorithm);
  const pids = Object.keys(processOrder);

  let headHTML = `<tr><th>Process</th>`;
  algos.forEach(a => { headHTML += `<th>${a}</th>`; });
  headHTML += `</tr>`;
  document.getElementById("processOrderHead").innerHTML = headHTML;

  let bodyHTML = pids.map(pid => {
    const times = processOrder[pid];
    const minStart = Math.min(...algos.map(a => times[a]?.start ?? 999));

    let row = `<tr><td style="font-family:var(--mono); color:var(--accent); font-weight:bold;">${pid}</td>`;
    algos.forEach(a => {
      const t = times[a];
      if (t) {
        const isFirst = t.start === minStart;
        row += `<td style="${isFirst ? 'background:rgba(0,255,136,0.08); color:var(--accent4);' : ''}">
          <div style="font-family:var(--mono); font-size:0.82rem;">${isFirst ? '⚡ ' : ''}Start: <b>${t.start}</b></div>
          <div style="font-family:var(--mono); font-size:0.75rem; color:var(--text-dim);">Wait: ${t.waiting} | TAT: ${t.turnaround}</div>
        </td>`;
      } else {
        row += `<td style="color:var(--text-dim);">-</td>`;
      }
    });
    row += `</tr>`;
    return row;
  }).join("");

  document.getElementById("processOrderBody").innerHTML = bodyHTML;
  document.getElementById("processOrderCard").style.display = "block";
}

function renderAllAlgoResults(compare) {
  const colors = ["#7c3aed", "#00f5ff", "#ff2d78", "#ffaa00"];
  const container = document.getElementById("allAlgoResults");

  container.innerHTML = compare.map((c, idx) => {
    const rows = c.result.map(p => `
      <tr>
        <td>${p.id}</td><td>${p.arrivalTime}</td><td>${p.burstTime}</td>
        <td>${p.start ?? "-"}</td><td>${p.finish}</td><td>${p.turnaround}</td><td>${p.waiting}</td>
      </tr>`).join("");

    const ganttBars = c.gantt.map((g, i) => {
      const width = Math.max((g.finish - g.start) * 45, 55);
      return `
        <div style="display:flex; flex-direction:column; align-items:center; min-width:${width}px;">
          <div style="background:${colors[idx % colors.length]}; color:#fff; width:100%; padding:10px 5px; text-align:center; font-family:var(--mono); font-size:0.82rem; font-weight:bold; border-radius:4px; border:1px solid rgba(255,255,255,0.1);">${g.id}</div>
          <div style="display:flex; justify-content:space-between; width:100%; font-family:var(--mono); font-size:0.68rem; color:var(--text-dim); margin-top:3px; padding:0 2px;"><span>${g.start}</span><span>${g.finish}</span></div>
        </div>`;
    }).join("");

    return `
      <div class="card" style="border-color:${colors[idx % colors.length]}33;">
        <div class="card-title" style="color:${colors[idx % colors.length]};">
          ${idx === 0 ? '🟣' : idx === 1 ? '🔵' : idx === 2 ? '🔴' : '🟡'} ${c.fullName}
          <span style="margin-left:auto; font-size:0.75rem; color:var(--text-dim);">Avg Wait: <b style="color:${colors[idx % colors.length]}">${c.avgWaiting}</b> | Avg TAT: <b style="color:${colors[idx % colors.length]}">${c.avgTurnaround}</b></span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Process</th><th>Arrival</th><th>Burst</th><th>Start</th><th>Finish</th><th>Turnaround</th><th>Waiting</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="margin-top:15px;">
          <div style="font-family:var(--mono); font-size:0.72rem; color:var(--text-dim); letter-spacing:2px; margin-bottom:8px;">GANTT CHART</div>
          <div style="display:flex; flex-wrap:wrap; overflow-x:auto; padding-bottom:8px;">${ganttBars}</div>
        </div>
      </div>`;
  }).join("");
}

// INIT
window.onload = () => {
  checkServer();
  setInterval(checkServer, 10000);
  generateBankersInputs();
  document.getElementById("priorityGroup").style.display = "none";
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement.closest(".input-row")) {
    addProcess();
  }
});
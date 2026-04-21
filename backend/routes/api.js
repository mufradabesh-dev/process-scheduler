const express = require("express");
const router = express.Router();
const db = require("../db");
const { fcfs, sjf, roundRobin, priority, bankers } = require("../scheduler");

// POST /api/schedule
router.post("/schedule", (req, res) => {
  const { processes, algorithm, quantum } = req.body;

  if (!processes || processes.length === 0) {
    return res.status(400).json({ error: "Process list is empty!" });
  }

  let result;
  let gantt = [];

  try {
    if (algorithm === "FCFS") {
      result = fcfs(processes);
    } else if (algorithm === "SJF") {
      result = sjf(processes);
    } else if (algorithm === "RoundRobin") {
      const rrResult = roundRobin(processes, quantum || 2);
      result = rrResult.done;
      gantt = rrResult.gantt;
    } else if (algorithm === "Priority") {
      result = priority(processes);
    } else {
      return res.status(400).json({ error: "Invalid algorithm!" });
    }

    result.forEach(p => {
      const sql = `INSERT INTO processes 
        (process_name, arrival_time, burst_time, priority_val, algorithm, waiting_time, turnaround_time, finish_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      db.query(sql, [
        p.id, p.arrivalTime, p.burstTime,
        p.priority || 0, algorithm,
        p.waiting, p.turnaround, p.finish
      ], (err) => {
        if (err) console.error("DB Insert Error:", err.message);
      });
    });

    res.json({ success: true, result, gantt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compare - Run ALL 5 algorithms and compare
router.post("/compare", (req, res) => {
  const { processes, quantum } = req.body;

  if (!processes || processes.length === 0) {
    return res.status(400).json({ error: "Process list is empty!" });
  }

  try {
    const fcfsResult = fcfs(processes);
    const sjfResult = sjf(processes);
    const rrResult = roundRobin(processes, quantum || 2);
    const priorityResult = priority(processes);

    const calcAvg = (arr, key) => {
      const sum = arr.reduce((a, b) => a + b[key], 0);
      return parseFloat((sum / arr.length).toFixed(2));
    };

    const compare = [
      {
        algorithm: "FCFS",
        fullName: "First Come First Served",
        result: fcfsResult,
        gantt: fcfsResult.map(p => ({ id: p.id, start: p.start, finish: p.finish })),
        avgWaiting: calcAvg(fcfsResult, "waiting"),
        avgTurnaround: calcAvg(fcfsResult, "turnaround"),
      },
      {
        algorithm: "SJF",
        fullName: "Shortest Job First",
        result: sjfResult,
        gantt: sjfResult.map(p => ({ id: p.id, start: p.start, finish: p.finish })),
        avgWaiting: calcAvg(sjfResult, "waiting"),
        avgTurnaround: calcAvg(sjfResult, "turnaround"),
      },
      {
        algorithm: "RoundRobin",
        fullName: "Round Robin (Q=" + (quantum || 2) + ")",
        result: rrResult.done,
        gantt: rrResult.gantt,
        avgWaiting: calcAvg(rrResult.done, "waiting"),
        avgTurnaround: calcAvg(rrResult.done, "turnaround"),
      },
      {
        algorithm: "Priority",
        fullName: "Priority Scheduling",
        result: priorityResult,
        gantt: priorityResult.map(p => ({ id: p.id, start: p.start, finish: p.finish })),
        avgWaiting: calcAvg(priorityResult, "waiting"),
        avgTurnaround: calcAvg(priorityResult, "turnaround"),
      },
    ];

    // Find best algorithm (lowest avg waiting time)
    const best = compare.reduce((a, b) => a.avgWaiting < b.avgWaiting ? a : b);

    // Find execution order per process per algorithm
    const processOrder = {};
    processes.forEach(p => {
      processOrder[p.id] = {};
      compare.forEach(c => {
        const found = c.result.find(r => r.id === p.id);
        if (found) {
          processOrder[p.id][c.algorithm] = {
            start: found.start ?? 0,
            finish: found.finish,
            waiting: found.waiting,
            turnaround: found.turnaround
          };
        }
      });
    });

    res.json({ success: true, compare, best: best.algorithm, processOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bankers
router.post("/bankers", (req, res) => {
  const { processes, available, max, allocation } = req.body;

  if (!processes || !available || !max || !allocation) {
    return res.status(400).json({ error: "All data is required!" });
  }

  try {
    const result = bankers(processes, available, max, allocation);

    const sql = `INSERT INTO bankers_results (processes_count, resources_count, is_safe, safe_sequence)
                 VALUES (?, ?, ?, ?)`;
    db.query(sql, [
      processes.length,
      available.length,
      result.safe ? 1 : 0,
      result.safeSequence.join(" -> ")
    ], (err) => {
      if (err) console.error("Banker DB Error:", err.message);
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history
router.get("/history", (req, res) => {
  db.query(
    "SELECT * FROM processes ORDER BY created_at DESC LIMIT 100",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET /api/bankers/history
router.get("/bankers/history", (req, res) => {
  db.query(
    "SELECT * FROM bankers_results ORDER BY created_at DESC LIMIT 50",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// DELETE /api/history
router.delete("/history", (req, res) => {
  db.query("DELETE FROM processes", (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: "History cleared!" });
  });
});

module.exports = router;
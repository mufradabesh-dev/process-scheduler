const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const db = require("../db");

const SCRIPTS_DIR = path.join(__dirname, "../../scripts");

// GET /api/dashboard/system
// Run system_monitor.sh and return JSON
router.get("/system", (req, res) => {
  const scriptPath = path.join(SCRIPTS_DIR, "system_monitor.sh");

  exec(`bash "${scriptPath}"`, (err, stdout, stderr) => {
    if (err) {
      // Windows fallback - simulate data
      const simulated = {
        cpu: Math.floor(Math.random() * 40 + 10),
        ram: {
          total: 8192,
          used: Math.floor(Math.random() * 3000 + 2000),
          free: Math.floor(Math.random() * 3000 + 1000),
          percent: (Math.random() * 40 + 30).toFixed(1)
        },
        disk: {
          total: "500G",
          used: "120G",
          percent: 24
        },
        uptime: "up 2 hours",
        processes: Math.floor(Math.random() * 50 + 100),
        timestamp: new Date().toLocaleTimeString(),
        simulated: true
      };
      return res.json(simulated);
    }

    try {
      const data = JSON.parse(stdout.trim());
      res.json(data);
    } catch {
      res.status(500).json({ error: "Failed to parse system data" });
    }
  });
});

// GET /api/dashboard/app-launches
// Get app launch history from log file
router.get("/app-launches", (req, res) => {
  const logFile = path.join(SCRIPTS_DIR, "app_launch_log.json");

  if (!fs.existsSync(logFile)) {
    return res.json([]);
  }

  try {
    const data = JSON.parse(fs.readFileSync(logFile, "utf8"));
    res.json(data.slice(-20).reverse()); // Last 20 entries
  } catch {
    res.json([]);
  }
});

// POST /api/dashboard/launch-app
// Launch an app and track time
router.post("/launch-app", (req, res) => {
  const { appName, appCmd } = req.body;

  if (!appName || !appCmd) {
    return res.status(400).json({ error: "App name and command required!" });
  }

  const scriptPath = path.join(SCRIPTS_DIR, "app_launcher.sh");
  const start = Date.now();

  exec(`bash "${scriptPath}" "${appName}" "${appCmd}"`, { timeout: 20000 }, (err, stdout) => {
    const elapsed = Date.now() - start;

    // Save to DB
    const sql = `INSERT INTO app_launches (app_name, launch_time_ms, launched_at) VALUES (?, ?, NOW())`;
    db.query(sql, [appName, elapsed], () => {});

    if (err) {
      return res.json({
        success: false,
        appName,
        launchTimeMs: elapsed,
        message: "App may have launched but tracking failed"
      });
    }

    res.json({
      success: true,
      appName,
      launchTimeMs: elapsed,
      output: stdout
    });
  });
});

// GET /api/dashboard/analytics
// Get scheduling analytics from DB
router.get("/analytics", (req, res) => {
  const queries = {
    totalRuns: "SELECT COUNT(*) as count FROM processes",
    byAlgorithm: "SELECT algorithm, COUNT(*) as count, AVG(waiting_time) as avgWait, AVG(turnaround_time) as avgTAT FROM processes GROUP BY algorithm",
    recentRuns: "SELECT algorithm, waiting_time, turnaround_time, created_at FROM processes ORDER BY created_at DESC LIMIT 10",
    appLaunches: "SELECT app_name, AVG(launch_time_ms) as avgTime, COUNT(*) as count FROM app_launches GROUP BY app_name ORDER BY avgTime ASC"
  };

  const results = {};
  let pending = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, sql]) => {
    db.query(sql, (err, rows) => {
      results[key] = err ? [] : rows;
      pending--;
      if (pending === 0) res.json(results);
    });
  });
});

module.exports = router;
const API = "https://freefall-handoff-growl.ngrok-free.dev/api/auth";

if (localStorage.getItem("token")) {
  window.location.href = "dashboard.html";
}

function switchTab(tab) {
  document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
  document.getElementById(tab + "Tab").classList.add("active");
  document.getElementById(tab + "Form").classList.add("active");
  document.getElementById("loginError").textContent = "";
  document.getElementById("registerError").textContent = "";
}

function togglePass(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorDiv = document.getElementById("loginError");
  const btn = document.querySelector("#loginForm .submit-btn");

  errorDiv.textContent = "";

  if (!email || !password) {
    errorDiv.textContent = "Please enter email and password!";
    return;
  }

  btn.textContent = "Logging in...";
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      showToast("Login successful! Redirecting...", "success");
      setTimeout(() => window.location.href = "dashboard.html", 1200);
    } else {
      errorDiv.textContent = data.error;
      btn.textContent = "LOGIN";
      btn.disabled = false;
    }
  } catch {
    errorDiv.textContent = "Server offline! Please start node server.js and ngrok";
    btn.textContent = "LOGIN";
    btn.disabled = false;
  }
}

async function handleRegister() {
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;
  const errorDiv = document.getElementById("registerError");
  const btn = document.querySelector("#registerForm .submit-btn");

  errorDiv.textContent = "";

  if (!username || !email || !password || !confirm) {
    errorDiv.textContent = "All fields are required!";
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = "Password must be at least 6 characters!";
    return;
  }

  if (password !== confirm) {
    errorDiv.textContent = "Passwords do not match!";
    return;
  }

  btn.textContent = "Creating account...";
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      showToast("Account created successfully!", "success");
      setTimeout(() => window.location.href = "dashboard.html", 1200);
    } else {
      errorDiv.textContent = data.error;
      btn.textContent = "CREATE ACCOUNT";
      btn.disabled = false;
    }
  } catch {
    errorDiv.textContent = "Server offline!";
    btn.textContent = "CREATE ACCOUNT";
    btn.disabled = false;
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const loginActive = document.getElementById("loginForm").classList.contains("active");
    if (loginActive) handleLogin();
    else handleRegister();
  }
});
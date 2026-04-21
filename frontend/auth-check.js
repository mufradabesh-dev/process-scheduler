const token = localStorage.getItem("token");
const userStr = localStorage.getItem("user");

if (!token || !userStr) {
  window.location.href = "login.html";
}

const currentUser = JSON.parse(userStr || "{}");

window.addEventListener("DOMContentLoaded", () => {
  const userDisplay = document.getElementById("userDisplay");
  if (userDisplay && currentUser.username) {
    userDisplay.textContent = "👤 " + currentUser.username;
  }
});

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }
}
// =========================
// DARK MODE TOGGLE
// =========================
function toggleTheme() {
    const body = document.body;

    body.classList.toggle("dark");

    // Save preference
    const isDark = body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

// =========================
// LOAD SAVED THEME
// =========================
function loadTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }
}

// =========================
// FOOTER YEAR
// =========================
function setYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = `© ${new Date().getFullYear()} Srivasu`;
    }
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    setYear();
});
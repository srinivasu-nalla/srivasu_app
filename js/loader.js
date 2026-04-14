document.addEventListener("DOMContentLoaded", () => {

    const config = CONFIGS[window.PAGE_TYPE];

    if (!config) {
        showError("Invalid page config");
        return;
    }

    // ✅ SAFETY: Ensure TableEngine exists
    if (typeof TableEngine === "undefined") {
        console.error("❌ TableEngine not loaded");
        showError("App failed to load");
        return;
    }

    buildTableHeaders(config.columns);
    buildColumnToggle(config.columns);

    // ✅ INIT ENGINE
    new TableEngine({
        ...config,
        enableTypeFilter: true
    });
});


// =========================
// HEADER BUILDER
// =========================
function buildTableHeaders(columns) {
    const headRow = document.getElementById("tableHeadRow");
    const filterRow = document.getElementById("columnFiltersRow");

    if (!headRow || !filterRow) {
        console.error("❌ Table header elements missing");
        return;
    }

    headRow.innerHTML = "";
    filterRow.innerHTML = "";

    columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col + " ⬍";
        th.dataset.sort = col;
        headRow.appendChild(th);

        const fth = document.createElement("th");

        if (col !== "Link") {
            const input = document.createElement("input");
            input.dataset.col = col;
            input.placeholder = "Filter " + col;
            fth.appendChild(input);
        }

        filterRow.appendChild(fth);
    });
}


// =========================
// COLUMN TOGGLE
// =========================
function buildColumnToggle(columns) {
    const container = document.getElementById("columnToggle");

    if (!container) return;

    // ✅ FIX: clear previous
    container.innerHTML = "";

    columns.forEach((col, index) => {
        const label = document.createElement("label");

        label.style.marginRight = "10px";

        label.innerHTML = `
            <input type="checkbox" checked data-index="${index}">
            ${col}
        `;

        container.appendChild(label);
    });
}


// =========================
// ERROR UI
// =========================
function showError(msg) {
    const el = document.getElementById("loading");

    if (el) {
        el.style.display = "block";
        el.innerText = "❌ " + msg;
    }
}
document.addEventListener("DOMContentLoaded", () => {

    const config = CONFIGS[window.PAGE_TYPE];

    if (!config) {
        showError("Invalid page config");
        return;
    }

    buildTableHeaders(config.columns);
    buildColumnToggle(config.columns);

    if (typeof TableEngine === "undefined") {
        showError("TableEngine not loaded");
        return;
    }

    new TableEngine({
        ...config,
        enableTypeFilter: true
    });
});

function buildTableHeaders(columns) {
    const headRow = document.getElementById("tableHeadRow");
    const filterRow = document.getElementById("columnFiltersRow");

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
            input.placeholder = "Filter " + col;
            input.dataset.col = col;
            fth.appendChild(input);
        }

        filterRow.appendChild(fth);
    });
}

function buildColumnToggle(columns) {
    const container = document.getElementById("columnToggle");
    if (!container) return;

    container.innerHTML = "";

    columns.forEach((col, index) => {
        const label = document.createElement("label");

        label.innerHTML = `
            <input type="checkbox" checked data-index="${index}">
            ${col}
        `;

        container.appendChild(label);
    });
}

function showError(msg) {
    document.getElementById("loading").innerText = "❌ " + msg;
}
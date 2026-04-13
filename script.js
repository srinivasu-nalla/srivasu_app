const SHEET_ID = "1vhnLcKes6ltHJZI5uPTcMfHRX9xjSdpckrR37FMtOgo";
const SHEET_NAME = "DE_INFO";
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

let sheetData = [];
let currentPage = 1;
let pageSize = 10;
let sortState = { key: null, asc: true };

// FETCH
async function fetchData() {
    const res = await fetch(URL);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));

    sheetData = json.table.rows.map(r => ({
        Type: r.c?.[0]?.v || "",
        Link: r.c?.[1]?.v || "",
        Comments: r.c?.[2]?.v || ""
    }));

    init();
}

function init() {
    document.getElementById("loading").style.display = "none";
    document.getElementById("dataTable").hidden = false;

    populateFilter();
    attachEvents();
    render();
}

// FILTER DROPDOWN
function populateFilter() {
    const types = [...new Set(sheetData.map(d => d.Type))];
    const filter = document.getElementById("typeFilter");

    types.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        filter.appendChild(opt);
    });
}

// EVENTS
function attachEvents() {
    document.getElementById("typeFilter").onchange = render;
    document.getElementById("globalSearch").oninput = render;

    document.getElementById("pageSize").onchange = (e) => {
        pageSize = Number(e.target.value);
        currentPage = 1;
        render();
    };

    document.getElementById("prevBtn").onclick = () => {
        currentPage--;
        render();
    };

    document.getElementById("nextBtn").onclick = () => {
        currentPage++;
        render();
    };

    document.querySelectorAll("th[data-sort]").forEach(th => {
        th.onclick = () => {
            const key = th.dataset.sort;
            sortState.asc = sortState.key === key ? !sortState.asc : true;
            sortState.key = key;
            render();
        };
    });
}

// FILTER + SORT
function processData() {
    const typeVal = document.getElementById("typeFilter").value;
    const search = document.getElementById("globalSearch").value.toLowerCase();

    let data = sheetData.filter(d =>
        (typeVal === "all" || d.Type === typeVal) &&
        (d.Type.toLowerCase().includes(search) ||
            d.Comments.toLowerCase().includes(search))
    );

    if (sortState.key) {
        data.sort((a, b) =>
            sortState.asc
                ? a[sortState.key].localeCompare(b[sortState.key])
                : b[sortState.key].localeCompare(a[sortState.key])
        );
    }

    return data;
}

// RENDER
function render() {
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";

    const data = processData();

    const total = data.length;
    const start = (currentPage - 1) * pageSize;
    const paginated = data.slice(start, start + pageSize);

    paginated.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.Type}</td>
            <td><a href="${row.Link}" target="_blank">Open →</a></td>
            <td>${row.Comments}</td>
        `;
        tbody.appendChild(tr);
    });

    // STATS
    document.getElementById("stats").textContent = `${total} records`;

    // PAGINATION INFO
    document.getElementById("pageInfo").textContent =
        `Page ${currentPage} of ${Math.ceil(total / pageSize)}`;

    // DISABLE BUTTONS
    document.getElementById("prevBtn").disabled = currentPage === 1;
    document.getElementById("nextBtn").disabled = start + pageSize >= total;
}

// INIT
document.addEventListener("DOMContentLoaded", fetchData);

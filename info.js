// =========================
// CONFIG
// =========================
const SHEET_ID = "1vhnLcKes6ltHJZI5uPTcMfHRX9xjSdpckrR37FMtOgo";
const SHEET_NAME = "GENERAL";

const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

let sheetData = [];
let sortState = { key: null, asc: true };

// =========================
// FETCH DATA
// =========================
async function fetchData() {
    try {
        const res = await fetch(URL);
        const text = await res.text();

        const json = JSON.parse(text.substring(47).slice(0, -2));
        const rows = json.table.rows;

        sheetData = rows.map(r => {
            const type = r.c?.[0]?.v || "";
            const link = r.c?.[1]?.v || "";
            const comments = r.c?.[2]?.v || "";

            return {
                Type: type,
                Link: link,
                Comments: comments,
                Source: detectSource(link),
                ContentType: detectContentType(link)
            };
        });

        init();

    } catch (err) {
        document.getElementById("loading").innerText = "❌ Failed to load data";
        console.error(err);
    }
}

// =========================
// DETECTION LOGIC
// =========================
function detectSource(url) {
    if (!url) return "Unknown";

    url = url.toLowerCase().trim();

    if (/youtube\.com|youtu\.be/.test(url)) return "YouTube";
    if (/instagram\.com/.test(url)) return "Instagram";
    if (/twitter\.com|x\.com/.test(url)) return "Twitter/X";
    if (/linkedin\.com/.test(url)) return "LinkedIn";
    if (/medium\.com/.test(url)) return "Medium";

    return "Other";
}

function detectContentType(url) {
    if (!url) return "Unknown";

    url = url.toLowerCase().trim();

    if (/youtube\.com|youtu\.be/.test(url)) return "Video";
    if (/instagram\.com\/(reel|p|tv)/.test(url)) return "Image/Video";
    if (/\.(jpg|jpeg|png|gif|webp)$/.test(url)) return "Image";
    if (/blog|article|news/.test(url)) return "Article";

    return "Link";
}

// =========================
// INIT
// =========================
function init() {
    document.getElementById("loading").style.display = "none";
    document.getElementById("dataTable").hidden = false;

    attachEvents();
    render();
}

// =========================
// EVENTS
// =========================
function attachEvents() {
    document.getElementById("globalSearch").addEventListener("input", render);

    document.querySelectorAll("th[data-sort]").forEach(th => {
        th.addEventListener("click", () => {
            const key = th.dataset.sort;

            if (sortState.key === key) {
                sortState.asc = !sortState.asc;
            } else {
                sortState.key = key;
                sortState.asc = true;
            }

            render();
        });
    });
}

// =========================
// FILTER + SORT
// =========================
function processData() {
    const search = document.getElementById("globalSearch").value.toLowerCase();

    let data = sheetData.filter(item =>
        item.Type.toLowerCase().includes(search) ||
        item.Source.toLowerCase().includes(search) ||
        item.ContentType.toLowerCase().includes(search) ||
        item.Comments.toLowerCase().includes(search)
    );

    if (sortState.key) {
        data.sort((a, b) => {
            const A = (a[sortState.key] || "").toLowerCase();
            const B = (b[sortState.key] || "").toLowerCase();

            return sortState.asc
                ? A.localeCompare(B)
                : B.localeCompare(A);
        });
    }

    return data;
}

// =========================
// RENDER
// =========================
function render() {
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    const data = processData();

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">No data found</td></tr>`;
        return;
    }

    data.forEach(row => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row.Type}</td>

            <td>
                <a href="${row.Link}" target="_blank">
                    ${row.Source === "YouTube" ? "▶ Watch" : "Open →"}
                </a>
            </td>

            <td>${row.Comments}</td>
            <td>${row.Source}</td>
            <td>${row.ContentType}</td>
        `;

        tbody.appendChild(tr);
    });

    document.getElementById("stats").textContent =
        `${data.length} records`;
}

// =========================
// START
// =========================
document.addEventListener("DOMContentLoaded", fetchData);

const API_URL = "https://script.google.com/macros/s/AKfycbyNK0gh6xLYxHCCm5EaNE8o_7BD-zbmf8kMkVDgIv4oxPtRlqxLopsF3BrNGaJ1rpAy4g/exec";

// ===== PASSWORD =====
const HASH = "954716ed1a7b6426ecc2cc2f0d17deb5";

function md5(str) {
    return CryptoJS.MD5(str).toString();
}

if (sessionStorage.getItem("auth") !== "ok") {
    const input = prompt("Enter Password:");
    if (!input || md5(input) !== HASH) {
        document.body.innerHTML =
            "<h2 style='color:white;text-align:center;margin-top:20%'>Access Denied</h2>";
        throw new Error("Unauthorized");
    }
    sessionStorage.setItem("auth", "ok");
}

// ===== MAIN =====
document.addEventListener("DOMContentLoaded", async () => {

    const GROUPS = [
        { id: 'g1', label: '01 — Foundations', cls: 'g1', topics: ['Python', 'SQL', 'Git'] },
        { id: 'g2', label: '02 — Data Engineering Core', cls: 'g2', topics: ['DE Concepts & Terminology', 'PySpark', 'Databricks', 'Cloud (Azure & AWS)', 'Data Engineering Projects'] },
        { id: 'g3', label: '03 — DE Tools', cls: 'g3', topics: ['Snowflake', 'DBT', 'Apache Kafka', 'Airflow'] },
        { id: 'g4', label: '04 — Senior DE', cls: 'g4', topics: ['Advanced Data Modeling', 'System Design & Architecture', 'Cost & Performance Optimization'] },
        { id: 'g5', label: '05 — Final: Get Hired', cls: 'g5', topics: ['Improve & Learn', 'Build Portfolio', 'Optimize LinkedIn', 'Build Resume', 'Job Applications'] }
    ];

    const SCORE_COLS = ['lc', 'hp', 'it', 'mp'];

    let state = {};

    // ===== LOAD CACHE FIRST (FAST) =====
    const cached = localStorage.getItem("de_cache");
    if (cached) {
        state = JSON.parse(cached);
    }

    // ===== LOAD FROM GOOGLE SHEET (ASYNC) =====
    async function loadData() {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();

            data.forEach(row => {
                state[row.key] = {
                    lc: Number(row.lc) || 0,
                    hp: Number(row.hp) || 0,
                    it: Number(row.it) || 0,
                    mp: Number(row.mp) || 0,
                    duration: row.duration || '',
                    notes: row.notes || ''
                };
            });

            localStorage.setItem("de_cache", JSON.stringify(state));

            refreshUI(); // update after load
        } catch (e) {
            console.log("Sheet load failed, using cache");
        }
    }

    function getRow(gid, topic) {
        const key = `${gid}||${topic}`;
        if (!state[key]) state[key] = { lc: 0, hp: 0, it: 0, mp: 0, duration: '', notes: '' };
        return state[key];
    }

    // ===== SAVE =====
    async function saveRow(key, row) {
        localStorage.setItem("de_cache", JSON.stringify(state)); // instant save

        fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ key, ...row })
        });

        document.getElementById('last-saved').textContent =
            new Date().toLocaleTimeString();

        const t = document.getElementById('save-toast');
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 1500);
    }

    function starWidget(gid, topic, col, init) {
        const wrap = document.createElement('div');
        wrap.className = 'star-select';

        for (let i = 1; i <= 5; i++) {
            const s = document.createElement('span');
            s.className = 'star' + (i <= init ? ' on' : '');
            s.textContent = '★';

            s.onclick = () => {
                const row = getRow(gid, topic);
                row[col] = (i === row[col]) ? 0 : i;

                wrap.querySelectorAll('.star').forEach((el, idx) => {
                    el.classList.toggle('on', idx < row[col]);
                });

                saveRow(`${gid}||${topic}`, row);
                updateGroupProgress(gid);
                updateGlobalStats();
            };

            wrap.appendChild(s);
        }

        return wrap;
    }

    function groupAvg(gid) {
        const g = GROUPS.find(x => x.id === gid);
        let tot = 0, cnt = 0;

        g.topics.forEach(t => {
            const r = getRow(gid, t);
            SCORE_COLS.forEach(c => { tot += r[c]; cnt++; });
        });

        return cnt ? tot / cnt : 0;
    }

    function updateGroupProgress(gid) {
        const pct = Math.round((groupAvg(gid) / 5) * 100);

        const fill = document.querySelector(`.gmb-${gid} .mini-bar-fill`);
        const pctEl = document.querySelector(`.gmb-${gid} .mini-pct`);

        if (fill) fill.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '%';
    }

    function updateGlobalStats() {
        let tot = 0, cnt = 0;

        GROUPS.forEach(g => g.topics.forEach(t => {
            const r = getRow(g.id, t);
            SCORE_COLS.forEach(c => { tot += r[c]; cnt++; });
        }));

        const pct = Math.round((tot / (cnt * 5)) * 100);

        document.getElementById('overall-fill').style.width = pct + '%';
        document.getElementById('overall-pct').textContent = pct + '%';

        const bar = document.getElementById('stats-bar');
        bar.innerHTML = '';

        GROUPS.forEach(g => {
            const gp = Math.round((groupAvg(g.id) / 5) * 100);

            const pill = document.createElement('div');
            pill.className = `stat-pill ${g.cls}`;
            pill.innerHTML = `<span class="dot"></span>${g.label} <strong>${gp}%</strong>`;

            bar.appendChild(pill);
        });
    }

    function buildGroup(g, delay) {
        const sec = document.createElement('div');
        sec.className = `group-section ${g.cls}`;
        sec.style.animationDelay = delay + 's';

        sec.innerHTML = `
        <div class="group-header">
          <div class="group-header-left">
            <span class="group-number">${g.label.split('—')[0]}</span>
            <span class="group-name">${g.label.split('—')[1]}</span>
          </div>
          <div class="group-mini-bar gmb-${g.id}">
            <div class="mini-bar-track">
              <div class="mini-bar-fill"></div>
            </div>
            <span class="mini-pct">0%</span>
            <span class="chevron">▾</span>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Topic</th>
                <th>LC</th><th>HP</th><th>IT</th><th>MP</th>
                <th>Duration</th><th>Notes</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>`;

        const tbody = sec.querySelector('tbody');

        g.topics.forEach((topic, i) => {
            const row = getRow(g.id, topic);
            const tr = document.createElement('tr');

            tr.innerHTML = `<td>${i + 1}</td><td class="topic-name">${topic}</td>`;

            SCORE_COLS.forEach(col => {
                const td = document.createElement('td');
                td.appendChild(starWidget(g.id, topic, col, row[col]));
                tr.appendChild(td);
            });

            const d = document.createElement('td');
            const inp = document.createElement('input');
            inp.className = 'editable';
            inp.value = row.duration;
            inp.onchange = () => saveRow(`${g.id}||${topic}`, row);
            d.appendChild(inp);

            const n = document.createElement('td');
            const ta = document.createElement('textarea');
            ta.className = 'editable';
            ta.value = row.notes;
            ta.onchange = () => saveRow(`${g.id}||${topic}`, row);
            n.appendChild(ta);

            tr.appendChild(d);
            tr.appendChild(n);
            tbody.appendChild(tr);
        });

        return sec;
    }

    function refreshUI() {
        GROUPS.forEach(g => updateGroupProgress(g.id));
        updateGlobalStats();
    }

    // ===== INITIAL RENDER (FAST) =====
    const container = document.getElementById('groups-container');

    GROUPS.forEach((g, i) => {
        const sec = buildGroup(g, i * 0.05);
        container.appendChild(sec);
    });

    refreshUI();     // instant UI
    loadData();      // async update
});

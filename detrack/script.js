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
document.addEventListener("DOMContentLoaded", () => {

    const GROUPS = [
        {
            id: 'g1', label: '01 — Foundations', cls: 'g1',
            topics: ['Python', 'SQL', 'Git']
        },
        {
            id: 'g2', label: '02 — Data Engineering Core', cls: 'g2',
            topics: ['DE Concepts & Terminology', 'PySpark', 'Databricks', 'Cloud (Azure & AWS)', 'Data Engineering Projects']
        },
        {
            id: 'g3', label: '03 — DE Tools', cls: 'g3',
            topics: ['Snowflake', 'DBT', 'Apache Kafka', 'Airflow']
        },
        {
            id: 'g4', label: '04 — Senior DE', cls: 'g4',
            topics: ['Advanced Data Modeling', 'System Design & Architecture', 'Cost & Performance Optimization']
        },
        {
            id: 'g5', label: '05 — Final: Get Hired', cls: 'g5',
            topics: ['Improve & Learn', 'Build Portfolio', 'Optimize LinkedIn', 'Build Resume', 'Job Applications']
        }
    ];

    const SCORE_COLS = ['lc', 'hp', 'it', 'mp'];

    let state = JSON.parse(localStorage.getItem('de_tracker_v2') || '{}');

    function getRow(gid, topic) {
        const key = `${gid}||${topic}`;
        if (!state[key]) state[key] = { lc: 0, hp: 0, it: 0, mp: 0, duration: '', notes: '' };
        return state[key];
    }

    function saveState() {
        localStorage.setItem('de_tracker_v2', JSON.stringify(state));

        document.getElementById('last-saved').textContent =
            new Date().toLocaleTimeString();

        const t = document.getElementById('save-toast');
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 1500);

        updateGlobalStats();
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

                saveState();
                updateGroupProgress(gid);
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
    </div>
  `;

        const header = sec.querySelector('.group-header');
        header.onclick = () => sec.classList.toggle('collapsed');

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
            inp.onchange = () => { row.duration = inp.value; saveState(); };
            d.appendChild(inp);

            const n = document.createElement('td');
            const ta = document.createElement('textarea');
            ta.className = 'editable';
            ta.value = row.notes;
            ta.onchange = () => { row.notes = ta.value; saveState(); };
            n.appendChild(ta);

            tr.appendChild(d);
            tr.appendChild(n);

            tbody.appendChild(tr);
        });

        return sec;
    }

    const container = document.getElementById('groups-container');

    GROUPS.forEach((g, i) => {
        const sec = buildGroup(g, i * 0.05);
        container.appendChild(sec);
        updateGroupProgress(g.id);
    });

    updateGlobalStats();

});
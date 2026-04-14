class TableEngine {
    constructor(config) {
        this.config = config;

        this.data = [];
        this.filteredData = [];

        this.currentPage = 1;
        this.pageSize = 10;

        this.sortState = { key: null, asc: true };

        this.init();
    }

    // =========================
    // INIT
    // =========================
    async init() {
        this.showLoading(true);

        await this.fetchData();

        this.showLoading(false);
        document.getElementById("dataTable").hidden = false;

        // Sync page size from dropdown
        const pageSizeEl = document.getElementById("pageSize");
        if (pageSizeEl) {
            this.pageSize = Number(pageSizeEl.value);
        }

        this.populateTypeFilter();
        this.attachEvents();
        this.render();
    }

    // =========================
    // LOADING UI
    // =========================
    showLoading(show) {
        const el = document.getElementById("loading");
        if (el) el.style.display = show ? "block" : "none";
    }

    showError(msg) {
        const el = document.getElementById("loading");
        if (el) {
            el.style.display = "block";
            el.innerText = "❌ " + msg;
        }
    }

    // =========================
    // FETCH + CACHE
    // =========================
    async fetchData() {
        try {
            const CACHE_KEY = "table_cache_" + window.PAGE_TYPE;
            const CACHE_TIME = 1000 * 60 * 60; // 1 hour

            const cached = localStorage.getItem(CACHE_KEY);

            if (cached) {
                const parsed = JSON.parse(cached);

                if (Date.now() - parsed.timestamp < CACHE_TIME) {
                    this.data = parsed.data;
                    console.log("⚡ Loaded from cache");
                    return;
                }
            }

            const res = await fetch(this.config.url);
            const text = await res.text();

            const json = JSON.parse(text.substring(47).slice(0, -2));

            this.data = json.table.rows.map(r => this.config.mapRow(r));

            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: this.data,
                timestamp: Date.now()
            }));

            console.log("✅ Fresh data fetched");

        } catch (err) {
            console.error("❌ Fetch error:", err);
            this.showError("Failed to load data");
        }
    }

    // =========================
    // TYPE FILTER
    // =========================
    populateTypeFilter() {
        const filter = document.getElementById("typeFilter");
        if (!filter) return;

        const types = [...new Set(this.data.map(d => d.Type))];

        types.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t;
            opt.textContent = t;
            filter.appendChild(opt);
        });
    }

    // =========================
    // EVENTS
    // =========================
    attachEvents() {
        const debounceRender = debounce(() => {
            this.currentPage = 1;
            this.render();
        }, 300);

        // Global search
        document.getElementById("globalSearch")
            ?.addEventListener("input", debounceRender);

        // Type filter
        document.getElementById("typeFilter")
            ?.addEventListener("change", debounceRender);

        // Column filters
        document.querySelectorAll(".column-filters input")
            .forEach(input => {
                input.addEventListener("input", debounceRender);
            });

        // Page size
        document.getElementById("pageSize")
            ?.addEventListener("change", (e) => {
                this.pageSize = Number(e.target.value);
                this.currentPage = 1;
                this.render();
            });

        // Pagination
        document.getElementById("prevBtn").onclick = () => {
            this.currentPage--;
            this.render();
        };

        document.getElementById("nextBtn").onclick = () => {
            this.currentPage++;
            this.render();
        };

        // Sorting
        document.querySelectorAll("th[data-sort]")
            .forEach(th => {
                th.onclick = () => {
                    const key = th.dataset.sort;

                    this.sortState.asc =
                        this.sortState.key === key ? !this.sortState.asc : true;

                    this.sortState.key = key;

                    this.render();
                };
            });

        // Column toggle
        document.querySelectorAll("#columnToggle input")
            .forEach(cb => {
                cb.addEventListener("change", () => {
                    const index = Number(cb.dataset.index);

                    document.querySelectorAll("#dataTable tr")
                        .forEach(row => {
                            const cell = row.children[index];
                            if (cell) {
                                cell.style.display = cb.checked ? "" : "none";
                            }
                        });
                });
            });
    }

    // =========================
    // FILTER + SORT
    // =========================
    filterData() {
        const search =
            document.getElementById("globalSearch")?.value.toLowerCase() || "";

        const typeVal =
            document.getElementById("typeFilter")?.value || "all";

        const colFilters = {};

        document.querySelectorAll(".column-filters input")
            .forEach(input => {
                colFilters[input.dataset.col] =
                    input.value.toLowerCase();
            });

        this.filteredData = this.data.filter(row => {

            const globalMatch = this.config.searchFields.some(field =>
                (row[field] || "")
                    .toLowerCase()
                    .includes(search)
            );

            const typeMatch =
                (typeVal === "all" || row.Type === typeVal);

            const columnMatch =
                Object.keys(colFilters).every(key => {
                    const val = colFilters[key];
                    return !val ||
                        (row[key] || "")
                            .toLowerCase()
                            .includes(val);
                });

            return globalMatch && typeMatch && columnMatch;
        });

        // Sorting
        if (this.sortState.key) {
            this.filteredData.sort((a, b) => {
                const A = (a[this.sortState.key] || "").toLowerCase();
                const B = (b[this.sortState.key] || "").toLowerCase();

                return this.sortState.asc
                    ? A.localeCompare(B)
                    : B.localeCompare(A);
            });
        }
    }

    // =========================
    // RENDER
    // =========================
    render() {
        this.filterData();

        const tbody = document.querySelector("#dataTable tbody");
        tbody.innerHTML = "";

        const total = this.filteredData.length;

        const totalPages = Math.max(1, Math.ceil(total / this.pageSize));

        if (this.currentPage > totalPages) {
            this.currentPage = totalPages;
        }

        const start = (this.currentPage - 1) * this.pageSize;
        const rows = this.filteredData.slice(start, start + this.pageSize);

        if (rows.length === 0) {
            tbody.innerHTML =
                `<tr><td colspan="${this.config.columns.length}">No data</td></tr>`;
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = this.config.renderRow(row);
            tbody.appendChild(tr);
        });

        // Stats
        document.getElementById("stats").innerText =
            `${total} records`;

        // Pagination
        document.getElementById("pageInfo").innerText =
            `Page ${this.currentPage} of ${totalPages}`;

        document.getElementById("prevBtn").disabled =
            this.currentPage === 1;

        document.getElementById("nextBtn").disabled =
            this.currentPage >= totalPages;
    }
}
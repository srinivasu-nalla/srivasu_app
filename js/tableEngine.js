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

    async init() {
        this.showLoading(true);

        await this.fetchData();

        this.showLoading(false);

        const table = document.getElementById("dataTable");
        if (table) table.hidden = false;

        this.populateTypeFilter();
        this.attachEvents();
        this.render();
    }

    showLoading(show) {
        const el = document.getElementById("loading");
        if (el) el.style.display = show ? "block" : "none";
    }

    async fetchData() {
        try {
            const CACHE_KEY = "data_" + window.PAGE_TYPE;

            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                this.data = JSON.parse(cached);
                console.log("⚡ Loaded from cache");
                return;
            }

            const res = await fetch(this.config.url);
            const text = await res.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));

            this.data = json.table.rows.map(r => this.config.mapRow(r));

            localStorage.setItem(CACHE_KEY, JSON.stringify(this.data));

            console.log("✅ Data fetched");

        } catch (err) {
            console.error("❌ Fetch error:", err);
            this.showError("Failed to load data");
        }
    }

    showError(msg) {
        const el = document.getElementById("loading");
        if (el) {
            el.style.display = "block";
            el.innerText = "❌ " + msg;
        }
    }

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

    attachEvents() {

        // GLOBAL SEARCH
        const search = document.getElementById("globalSearch");
        if (search) {
            search.addEventListener("input", debounce(() => {
                this.currentPage = 1;
                this.render();
            }, 300));
        }

        // COLUMN FILTER
        document.querySelectorAll(".column-filters input").forEach(input => {
            input.addEventListener("input", debounce(() => {
                this.currentPage = 1;
                this.render();
            }, 300));
        });

        // TYPE FILTER
        const typeFilter = document.getElementById("typeFilter");
        if (typeFilter) {
            typeFilter.addEventListener("change", () => {
                this.currentPage = 1;
                this.render();
            });
        }

        // PAGE SIZE
        const pageSize = document.getElementById("pageSize");
        if (pageSize) {
            pageSize.addEventListener("change", (e) => {
                this.pageSize = Number(e.target.value);
                this.currentPage = 1;
                this.render();
            });
        }

        // PAGINATION
        const prevBtn = document.getElementById("prevBtn");
        if (prevBtn) {
            prevBtn.onclick = () => {
                this.currentPage--;
                this.render();
            };
        }

        const nextBtn = document.getElementById("nextBtn");
        if (nextBtn) {
            nextBtn.onclick = () => {
                this.currentPage++;
                this.render();
            };
        }

        // SORT
        document.querySelectorAll("th[data-sort]").forEach(th => {
            th.addEventListener("click", () => {
                const key = th.dataset.sort;

                if (this.sortState.key === key) {
                    this.sortState.asc = !this.sortState.asc;
                } else {
                    this.sortState.key = key;
                    this.sortState.asc = true;
                }

                this.render();
            });
        });

        // COLUMN TOGGLE
        document.querySelectorAll("#columnToggle input").forEach(cb => {
            cb.addEventListener("change", () => {
                const index = Number(cb.dataset.index);

                document.querySelectorAll("#dataTable tr").forEach(row => {
                    const cell = row.children[index];
                    if (cell) {
                        cell.style.display = cb.checked ? "" : "none";
                    }
                });
            });
        });
    }

    filterData() {
        const search = document.getElementById("globalSearch")?.value.toLowerCase() || "";
        const typeVal = document.getElementById("typeFilter")?.value || "all";

        const colFilters = {};
        document.querySelectorAll(".column-filters input").forEach(input => {
            colFilters[input.dataset.col] = input.value.toLowerCase();
        });

        this.filteredData = this.data.filter(row => {

            const globalMatch = this.config.searchFields.some(field =>
                (row[field] || "").toLowerCase().includes(search)
            );

            const typeMatch = (typeVal === "all" || row.Type === typeVal);

            const columnMatch = Object.keys(colFilters).every(key => {
                const val = colFilters[key];
                return !val || (row[key] || "").toLowerCase().includes(val);
            });

            return globalMatch && typeMatch && columnMatch;
        });

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

    render() {
        this.filterData();

        const tbody = document.querySelector("#dataTable tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        const total = this.filteredData.length;

        const start = (this.currentPage - 1) * this.pageSize;
        const rows = this.filteredData.slice(start, start + this.pageSize);

        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${this.config.columns.length}">No data</td></tr>`;
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = this.config.renderRow(row);
            tbody.appendChild(tr);
        });

        document.getElementById("stats").innerText = `${total} records`;

        const totalPages = Math.ceil(total / this.pageSize);

        const pageInfo = document.getElementById("pageInfo");
        if (pageInfo) {
            pageInfo.innerText = `Page ${this.currentPage} of ${totalPages}`;
        }

        const prevBtn = document.getElementById("prevBtn");
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;

        const nextBtn = document.getElementById("nextBtn");
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }
}
class TableEngine {
    constructor(config) {
        this.config = config;
        this.data = [];
        this.currentPage = 1;
        this.pageSize = config.pageSize || 10;
        this.sortState = { key: null, asc: true };

        this.init();
    }

    async init() {
        await this.fetchData();
        this.setupUI();
        this.attachEvents();
        this.render();
    }

    async fetchData() {
        try {
            const res = await fetch(this.config.url);
            const text = await res.text();
            const json = JSON.parse(text.substring(47).slice(0, -2));

            this.data = json.table.rows.map(r => this.config.mapRow(r));

            console.log("✅ Data Loaded:", this.data);

        } catch (err) {
            console.error("❌ Fetch Error:", err);
        }
    }

    setupUI() {
        document.getElementById("loading").style.display = "none";
        document.getElementById("dataTable").hidden = false;

        if (this.config.enableTypeFilter) {
            this.populateTypeFilter();
        }
    }

    populateTypeFilter() {
        const types = [...new Set(this.data.map(d => d.Type))];
        const filter = document.getElementById("typeFilter");

        if (!filter) return;

        types.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t;
            opt.textContent = t;
            filter.appendChild(opt);
        });
    }

    attachEvents() {
        const el = id => document.getElementById(id);

        if (el("globalSearch")) {
            el("globalSearch").addEventListener("input", () => {
                this.currentPage = 1;
                this.render();
            });
        }

        if (el("typeFilter")) {
            el("typeFilter").addEventListener("change", () => {
                this.currentPage = 1;
                this.render();
            });
        }

        if (el("pageSize")) {
            el("pageSize").addEventListener("change", (e) => {
                this.pageSize = Number(e.target.value);
                this.currentPage = 1;
                this.render();
            });
        }

        if (el("prevBtn")) {
            el("prevBtn").onclick = () => {
                this.currentPage--;
                this.render();
            };
        }

        if (el("nextBtn")) {
            el("nextBtn").onclick = () => {
                this.currentPage++;
                this.render();
            };
        }

        document.querySelectorAll(".column-filters input").forEach(input => {
            input.addEventListener("input", () => {
                this.currentPage = 1;
                this.render();
            });
        });

        document.querySelectorAll("th[data-sort]").forEach(th => {
            th.addEventListener("click", () => {
                const key = th.dataset.sort;
                this.sortState.asc = this.sortState.key === key ? !this.sortState.asc : true;
                this.sortState.key = key;
                this.render();
            });
        });
    }

    getFilteredData() {
        const searchInput = document.getElementById("globalSearch");
        const typeInput = document.getElementById("typeFilter");

        const search = searchInput ? searchInput.value.toLowerCase() : "";
        const typeVal = typeInput ? typeInput.value : "all";

        const colFilters = {};
        document.querySelectorAll(".column-filters input").forEach(input => {
            colFilters[input.dataset.col] = input.value.toLowerCase();
        });

        let data = this.data.filter(item => {

            const globalMatch = this.config.searchFields.some(field =>
                (item[field] || "").toLowerCase().includes(search)
            );

            const typeMatch = (!this.config.enableTypeFilter || typeVal === "all" || item.Type === typeVal);

            const columnMatch = Object.keys(colFilters).every(key =>
                !colFilters[key] || (item[key] || "").toLowerCase().includes(colFilters[key])
            );

            return globalMatch && typeMatch && columnMatch;
        });

        if (this.sortState.key) {
            data.sort((a, b) => {
                const A = (a[this.sortState.key] || "").toLowerCase();
                const B = (b[this.sortState.key] || "").toLowerCase();

                return this.sortState.asc
                    ? A.localeCompare(B)
                    : B.localeCompare(A);
            });
        }

        return data;
    }

    render() {
        const tbody = document.querySelector("#dataTable tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        const data = this.getFilteredData();

        const total = data.length;
        const start = (this.currentPage - 1) * this.pageSize;
        const paginated = data.slice(start, start + this.pageSize);

        if (paginated.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${this.config.columns.length}">No data</td></tr>`;
        }

        paginated.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = this.config.renderRow(row);
            tbody.appendChild(tr);
        });

        if (document.getElementById("stats")) {
            document.getElementById("stats").textContent = `${total} records`;
        }

        const totalPages = Math.ceil(total / this.pageSize);

        if (document.getElementById("pageInfo")) {
            document.getElementById("pageInfo").textContent =
                `Page ${this.currentPage} of ${totalPages}`;
        }

        if (document.getElementById("prevBtn")) {
            document.getElementById("prevBtn").disabled = this.currentPage === 1;
        }

        if (document.getElementById("nextBtn")) {
            document.getElementById("nextBtn").disabled = this.currentPage >= totalPages;
        }
    }
}

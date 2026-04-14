document.addEventListener("DOMContentLoaded", () => {

    const configs = {

        de: {
            url: "https://docs.google.com/spreadsheets/d/1vhnLcKes6ltHJZI5uPTcMfHRX9xjSdpckrR37FMtOgo/gviz/tq?tqx=out:json&sheet=DE_INFO",
            columns: ["Type", "Link", "Comments"],
            searchFields: ["Type", "Comments"],

            mapRow: (r) => ({
                Type: r.c?.[0]?.v || "",
                Link: r.c?.[1]?.v || "",
                Comments: r.c?.[2]?.v || ""
            }),

            renderRow: (row) => `
                <td>${row.Type}</td>
                <td><a href="${row.Link}" target="_blank">Open →</a></td>
                <td>${row.Comments}</td>
            `
        },

        info: {
            url: "https://docs.google.com/spreadsheets/d/1vhnLcKes6ltHJZI5uPTcMfHRX9xjSdpckrR37FMtOgo/gviz/tq?tqx=out:json&sheet=GENERAL",
            columns: ["Type", "Link", "Comments", "Source", "ContentType"],
            searchFields: ["Type", "Comments", "Source", "ContentType"],

            mapRow: (r) => {
                const link = r.c?.[1]?.v || "";

                return {
                    Type: r.c?.[0]?.v || "",
                    Link: link,
                    Comments: r.c?.[2]?.v || "",
                    Source: detectSource(link),
                    ContentType: detectContentType(link)
                };
            },

            renderRow: (row) => `
                <td>${row.Type}</td>
                <td><a href="${row.Link}" target="_blank">Open →</a></td>
                <td>${row.Comments}</td>
                <td>${row.Source}</td>
                <td>${row.ContentType}</td>
            `
        }
    };

    const config = configs[window.PAGE_TYPE];

    buildTableHeaders(config.columns);

    new TableEngine({
        ...config,
        enableTypeFilter: true
    });
});

function buildTableHeaders(columns) {
    const headRow = document.getElementById("tableHeadRow");
    const filterRow = document.getElementById("columnFiltersRow");

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

function detectSource(url) {
    if (!url) return "Unknown";
    url = url.toLowerCase();

    if (/youtube|youtu/.test(url)) return "YouTube";
    if (/instagram/.test(url)) return "Instagram";
    if (/twitter|x/.test(url)) return "Twitter/X";
    if (/linkedin/.test(url)) return "LinkedIn";

    return "Other";
}

function detectContentType(url) {
    if (!url) return "Unknown";
    url = url.toLowerCase();

    if (/youtube|youtu/.test(url)) return "Video";
    if (/\.(jpg|png|gif)/.test(url)) return "Image";

    return "Link";
}
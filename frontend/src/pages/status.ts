const apiHost = `${window.location.hostname}`;

export function Status(): string {
    return `
        <div id="status-container">
        <div id="status-header">
            <h2>System Status</h2>
            <button id="status-refresh-btn">Refresh</button>
        </div>
            <table id="status-table">
                <thead>
                <tr>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Response Time (ms)</th>
                    <th>Uptime (s)</th>
                    <th>Version</th>
                    <th>Last Checked</th>
                </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;
}

export function refreshStatus() {
    loadHealthStatus();
    const refreshBtn = document.getElementById("status-refresh-btn");
    
    refreshBtn?.addEventListener("click", () => { loadHealthStatus();});
}

export async function loadHealthStatus() {
    const response = await fetch(`http://${apiHost}:8080/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json"},
    });

    const data = await response.json();
    const tbody = document.querySelector("#status-table tbody")!;
    tbody.innerHTML = "";

    const services = data.services as Record<string, any>;
    for (const [name, info] of Object.entries(services)) {
        const row = document.createElement("tr");

        const status = info?.status ?? "unknown";
        const statusColor = status === "ok" ? "#42F3FA" : "#FA4242";

        row.innerHTML = `
        <td>${name}</td>
        <td style="color:${statusColor}; font-weight:600;">${status}</td>
        <td>${info?.responseTime ?? "-"}</td>
        <td>${info?.uptime ?? "-"}</td>
        <td>${info?.version ?? "-"}</td>
        <td>${info?.timestamp ? new Date(info.timestamp).toLocaleTimeString() : "-"}</td>
        `;

        tbody.appendChild(row);
    }
}
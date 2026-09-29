import { useState } from "react";
import { useApi } from "../api.js";
import {
  formatBytes,
  formatDuration,
  formatPercent,
  formatRate,
  orNA,
} from "../format.js";
import Graph from "../components/Graph.jsx";
import Status, { Stale } from "../components/Status.jsx";

function ResourceItem({ title, subtitle, series, selected, onSelect }) {
  return (
    <button className={selected ? "resource selected" : "resource"} onClick={onSelect}>
      <div className="resource-graph">
        <Graph series={series} max={100} compact />
      </div>
      <div className="resource-text">
        <span className="resource-title">{title}</span>
        <span className="resource-sub">{subtitle}</span>
      </div>
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function Facts({ rows }) {
  return (
    <dl className="facts">
      {rows
        .filter((row) => row[1] !== null && row[1] !== undefined)
        .map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function Detail({ title, subtitle, children }) {
  return (
    <section className="detail">
      <div className="detail-head">
        <h2>{title}</h2>
        {subtitle && <span className="detail-sub">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

export default function Performance() {
  const { data, error } = useApi("/api/performance", 1000);
  const [selected, setSelected] = useState("cpu");

  if (!data) {
    return (
      <>
        <h1>Performance health</h1>
        <p className="subtitle">Live processor, memory and disk activity</p>
        <Status error={error} />
      </>
    );
  }

  const { cpu, memory, disk } = data;
  const diskTitle = "Disk (" + disk.drive + ")";

  return (
    <>
      <h1>Performance health</h1>
      <p className="subtitle">Live processor, memory and disk activity</p>
      <Stale error={error} />
      <div className="performance">
        <div className="resources">
          <ResourceItem
            title="CPU"
            subtitle={formatPercent(cpu.percent) + (cpu.speed_ghz ? "  " + cpu.speed_ghz.toFixed(2) + " GHz" : "")}
            series={[{ values: cpu.history, fill: true }]}
            selected={selected === "cpu"}
            onSelect={() => setSelected("cpu")}
          />
          <ResourceItem
            title="Memory"
            subtitle={formatBytes(memory.used) + "/" + formatBytes(memory.total) + " (" + formatPercent(memory.percent) + ")"}
            series={[{ values: memory.history, fill: true }]}
            selected={selected === "memory"}
            onSelect={() => setSelected("memory")}
          />
          <ResourceItem
            title={diskTitle}
            subtitle={(disk.type ? disk.type + "  " : "") + formatPercent(disk.active_percent)}
            series={[{ values: disk.active_history, fill: true }]}
            selected={selected === "disk"}
            onSelect={() => setSelected("disk")}
          />
        </div>

        {selected === "cpu" && (
          <Detail title="CPU" subtitle={cpu.name}>
            <p className="graph-title">% Utilization</p>
            <Graph series={[{ values: cpu.history, fill: true }]} max={100} maxLabel={() => "100%"} />
            <div className="detail-body">
              <div className="stats">
                <Stat label="Utilization" value={formatPercent(cpu.percent)} />
                <Stat label="Speed" value={cpu.speed_ghz ? cpu.speed_ghz.toFixed(2) + " GHz" : orNA(null)} />
                <Stat label="Processes" value={orNA(cpu.processes)} />
                <Stat label="Threads" value={orNA(cpu.threads)} />
                <Stat label="Up time" value={formatDuration(cpu.uptime_seconds)} />
              </div>
              <Facts
                rows={[
                  ["Cores", cpu.cores],
                  ["Logical processors", cpu.logical_processors],
                ]}
              />
            </div>
          </Detail>
        )}

        {selected === "memory" && (
          <Detail title="Memory" subtitle={formatBytes(memory.total)}>
            <p className="graph-title">Memory usage</p>
            <Graph series={[{ values: memory.history, fill: true }]} max={100} maxLabel={() => formatBytes(memory.total)} />
            <div className="detail-body">
              <div className="stats">
                <Stat label="In use" value={formatBytes(memory.used)} />
                <Stat label="Available" value={formatBytes(memory.available)} />
              </div>
              <Facts
                rows={[
                  ["Total", formatBytes(memory.total)],
                  ["Usage", formatPercent(memory.percent)],
                ]}
              />
            </div>
          </Detail>
        )}

        {selected === "disk" && (
          <Detail title={diskTitle} subtitle={disk.model}>
            <p className="graph-title">Active time</p>
            <Graph series={[{ values: disk.active_history, fill: true }]} max={100} maxLabel={() => "100%"} />
            <p className="graph-title spaced">Disk transfer rate</p>
            <Graph
              series={[
                { values: disk.read_history, fill: true },
                { values: disk.write_history, dashed: true },
              ]}
              maxLabel={(top) => formatRate(top)}
              short
            />
            <div className="detail-body">
              <div className="stats">
                <Stat label="Active time" value={formatPercent(disk.active_percent)} />
                <Stat label="Average response time" value={disk.response_ms.toFixed(1) + " ms"} />
                <Stat label="Read speed" value={formatRate(disk.read_bps)} />
                <Stat label="Write speed" value={formatRate(disk.write_bps)} />
              </div>
              <Facts
                rows={[
                  ["Capacity", formatBytes(disk.capacity)],
                  ["Type", disk.type],
                ]}
              />
            </div>
          </Detail>
        )}
      </div>
    </>
  );
}

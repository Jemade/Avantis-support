import { formatBits, formatBytes, formatPercent, orNA } from "../format.js";
import Status, { Stale } from "../components/Status.jsx";

function Tile({ label, value, caption, onClick }) {
  return (
    <button className="tile" onClick={onClick}>
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value}</span>
      <span className="tile-caption">{caption}</span>
    </button>
  );
}

export default function Assist({ onNavigate, data, error }) {
  return (
    <>
      <h1>Avantis Assist</h1>
      <p className="subtitle"><h2>{data?.device_name}</h2></p>
      {!data ? (
        <Status error={error} />
      ) : (
        <>
          <Stale error={error} />
          <div className="card device">
            <h2>{data.device_name}</h2>
            {data.model && <p>{data.model}</p>}
          </div>

          <div className="tiles">
            <Tile
              label="Processor"
              value={formatPercent(data.cpu_percent)}
              caption="in use"
              onClick={() => onNavigate("performance")}
            />
            <Tile
              label="Memory"
              value={formatPercent(data.memory_percent)}
              caption={formatBytes(data.memory_used) + " of " + formatBytes(data.memory_total)}
              onClick={() => onNavigate("performance")}
            />
            <Tile
              label="System drive"
              value={data.disk ? formatPercent(data.disk.percent_used) : orNA(null)}
              caption={data.disk ? formatBytes(data.disk.free) + " free" : ""}
              onClick={() => onNavigate("storage")}
            />
            <Tile
              label="Network"
              value={formatBits(data.net_recv_bps).value + " " + formatBits(data.net_recv_bps).unit}
              caption={"receiving, sending " + formatBits(data.net_send_bps).value + " " + formatBits(data.net_send_bps).unit}
              onClick={() => onNavigate("network")}
            />
          </div>

          <div className="card">
            <h3>Status</h3>
            {data.notes.length === 0 ? (
              <p className="ok-text">No issues found right now.</p>
            ) : (
              <ul className="notes">
                {data.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}

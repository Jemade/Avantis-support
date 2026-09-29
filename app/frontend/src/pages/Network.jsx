import { useApi } from "../api.js";
import { formatBits, orNA } from "../format.js";
import Graph from "../components/Graph.jsx";
import Status, { Stale } from "../components/Status.jsx";

function Speed({ label, dashed, bytesPerSecond }) {
  const { value, unit } = formatBits(bytesPerSecond);
  return (
    <div className="speed">
      <span className="speed-label">
        <i className={dashed ? "swatch dashed" : "swatch"} />
        {label}
      </span>
      <span className="speed-value">
        {value} <small>{unit}</small>
      </span>
    </div>
  );
}

function Row({ label, value, small }) {
  return (
    <div className="row">
      <span>{label}</span>
      <span className={small ? "small-value" : ""}>{value}</span>
    </div>
  );
}

export default function Network() {
  const { data, error } = useApi("/api/network", 1000);

  const heading = (
    <div className="page-head">
      <div>
        <h1>Network health</h1>
        <p className="subtitle">See live network status and speed</p>
      </div>
      {data && data.badge && <span className="badge">{data.badge}</span>}
    </div>
  );

  if (!data) {
    return (
      <>
        {heading}
        <Status error={error} />
      </>
    );
  }

  return (
    <>
      {heading}
      <Stale error={error} />
      {!data.connected && (
        <div className="card notice">
          <p>This computer is not connected to a network right now.</p>
        </div>
      )}
      <div className="two-columns">
        <div className="card">
          <h3>Real time speed</h3>
          <Graph
            series={[
              { values: data.recv_history, fill: true },
              { values: data.send_history, dashed: true },
            ]}
            maxLabel={(top) => {
              const f = formatBits(top);
              return f.value + " " + f.unit;
            }}
          />
          <div className="speeds">
            <Speed label="SEND" dashed bytesPerSecond={data.send_bps} />
            <Speed label="RECEIVE" bytesPerSecond={data.recv_bps} />
          </div>
        </div>

        <div className="card">
          <h3>Network details</h3>
          <Row label="Adapter name" value={orNA(data.adapter_name)} />
          <Row label="SSID" value={orNA(data.ssid)} />
          <Row label="DNS servers" value={data.dns_servers.length ? data.dns_servers.join(", ") : orNA(null)} />
          <Row label="Connection type" value={orNA(data.connection_type)} />
          <Row label="IPv4 address" value={orNA(data.ipv4)} />
          <Row label="IPv6 address" value={orNA(data.ipv6)} small />
        </div>
      </div>
    </>
  );
}

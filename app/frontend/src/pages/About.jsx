import { useApi } from "../api.js";
import { formatBytes, orNA } from "../format.js";
import Status, { Stale } from "../components/Status.jsx";

export default function About() {
  const { data, error } = useApi("/api/about", 5000);

  const rows = data
    ? [
        ["App version", data.app_version],
        ["Device name", data.device_name],
        ["Manufacturer", orNA(data.manufacturer)],
        ["Model", orNA(data.model)],
        ["Serial number", orNA(data.serial_number)],
        ["Operating system", data.os],
        ["Processor", orNA(data.processor)],
        ["Installed memory", formatBytes(data.memory_total)],
      ]
    : [];

  return (
    <>
      <h1>About</h1>
      <p className="subtitle">Details about this computer and this app</p>
      {!data ? (
        <Status error={error} />
      ) : (
        <>
          <Stale error={error} />
          <div className="card">
            {rows.map(([label, value]) => (
              <div className="row" key={label}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

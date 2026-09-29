import { useState } from "react";
import { useApi } from "../api.js";
import { formatBytes } from "../format.js";
import Status, { Stale } from "../components/Status.jsx";

export default function Storage() {
  const { data, error } = useApi("/api/storage", 10000);
  const [driveId, setDriveId] = useState(null);

  const drives = data ? data.drives : [];
  const drive = drives.find((d) => d.id === driveId) || drives[0];

  return (
    <>
      <h1>Storage health</h1>
      <p className="subtitle">See how much space is used on your drives</p>
      {!data ? (
        <Status error={error} />
      ) : !drive ? (
        <div className="card notice">
          <p>No drives were found on this computer.</p>
        </div>
      ) : (
        <>
          <Stale error={error} />
          <div className="card">
            <div className="drive-top">
              <select
                value={drive.id}
                onChange={(event) => setDriveId(event.target.value)}
                aria-label="Drive"
              >
                {drives.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <span className={drive.status === "ok" ? "pill ok" : "pill low"}>
                {drive.status === "ok" ? "Healthy" : "Low space"}
              </span>
            </div>
            <div
              className="bar"
              role="progressbar"
              aria-label={`${drive.name} storage used`}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={drive.percent_used}
            >
              <div
                className={drive.status === "ok" ? "bar-fill" : "bar-fill low"}
                style={{ width: drive.percent_used + "%" }}
              />
              <span className={`bar-label${drive.percent_used >= 30 ? " on-fill" : ""}`}>
                {formatBytes(drive.used)} used
              </span>
            </div>
            <div className="bar-labels">
              <span>
                {formatBytes(drive.free)} free of {formatBytes(drive.total)}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

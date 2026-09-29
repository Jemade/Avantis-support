// Shown while waiting for the first reading, or when the backend is not running.
export default function Status({ error }) {
  if (error) {
    return (
      <div className="card notice">
        <h3>Cannot reach the PC Assist backend</h3>
        <p>
          Open the backend folder and run <b>run.bat</b> (Windows) or <b>run.sh</b> (Mac and Linux), and
          leave that window open. This page reconnects by itself.
        </p>
      </div>
    );
  }
  return (
    <div className="card notice">
      <p>Reading this computer...</p>
    </div>
  );
}

// Small banner shown if the connection drops after data has already loaded.
export function Stale({ error }) {
  if (!error) return null;
  return <div className="stale">Connection to the backend was lost. Showing the last reading.</div>;
}

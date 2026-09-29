const WIDTH = 600;
const HEIGHT = 200;
const POINTS = 60;

function niceMax(value) {
  if (value <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / power;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * power;
}

function toPoints(values, max) {
  const offset = POINTS - values.length;
  return values.map((v, i) => [
    ((offset + i) / (POINTS - 1)) * WIDTH,
    HEIGHT - Math.min(v / max, 1) * HEIGHT,
  ]);
}

// A 60 second line graph. `series` is a list of { values, dashed, fill }.
// Values are real readings from the backend, newest on the right.
export default function Graph({ series, max, maxLabel, compact, short }) {
  const all = series.flatMap((s) => s.values.slice(-POINTS));
  const top = max || niceMax(Math.max(0, ...all));

  const grid = [];
  if (!compact) {
    for (let i = 1; i < 10; i += 1) {
      const x = (i / 10) * WIDTH;
      grid.push(<line key={"v" + i} x1={x} x2={x} y1={0} y2={HEIGHT} className="g-grid" />);
    }
    for (let i = 1; i < 4; i += 1) {
      const y = (i / 4) * HEIGHT;
      grid.push(<line key={"h" + i} x1={0} x2={WIDTH} y1={y} y2={y} className="g-grid" />);
    }
  }

  return (
    <div className={compact ? "graph compact" : short ? "graph short" : "graph"}>
      {!compact && maxLabel && <span className="graph-max">{maxLabel(top)}</span>}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" role="img" aria-label="Last 60 seconds">
        {grid}
        {series.map((s, index) => {
          const points = toPoints(s.values.slice(-POINTS), top);
          if (points.length < 2) return null;
          const line = points.map((p) => p.join(",")).join(" ");
          const first = points[0];
          const last = points[points.length - 1];
          const area = `${first[0]},${HEIGHT} ${line} ${last[0]},${HEIGHT}`;
          return (
            <g key={index}>
              {s.fill && <polygon points={area} className="g-fill" />}
              <polyline points={line} className={s.dashed ? "g-line dashed" : "g-line"} />
            </g>
          );
        })}
      </svg>
      {!compact && (
        <div className="graph-axis">
          <span>60 seconds</span>
          <span>0</span>
        </div>
      )}
    </div>
  );
}

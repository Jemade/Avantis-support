export const NA = "Not available";

export function orNA(value) {
  return value === null || value === undefined || value === "" ? NA : value;
}

// Binary units (1 GB = 1024 MB) so numbers match Windows Explorer and Task Manager.
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return NA;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return value.toFixed(digits) + " " + units[unit];
}

export function formatRate(bytesPerSecond) {
  return formatBytes(bytesPerSecond) + "/s";
}

// Network speeds are shown in bits per second, like Task Manager.
export function formatBits(bytesPerSecond) {
  const bits = bytesPerSecond * 8;
  if (bits >= 1e6) return { value: (bits / 1e6).toFixed(1), unit: "Mb/s" };
  return { value: (bits / 1e3).toFixed(1), unit: "Kb/s" };
}

export function formatDuration(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const two = (n) => String(n).padStart(2, "0");
  return days + ":" + two(hours) + ":" + two(minutes) + ":" + two(seconds);
}

export function formatPercent(value) {
  return Math.round(value) + "%";
}

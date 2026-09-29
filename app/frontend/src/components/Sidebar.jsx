import logo from "../assets/avantis-logo.png";

const icons = {
  assist: (
    <svg viewBox="0 0 20 20"><rect x="2.5" y="3.5" width="15" height="10" rx="1.5" /><path d="M7 17h6M10 13.5V17" /></svg>
  ),
  performance: (
    <svg viewBox="0 0 20 20"><path d="M4 16V9M8 16V4M12 16v-6M16 16V7" /></svg>
  ),
  storage: (
    <svg viewBox="0 0 20 20"><rect x="2.5" y="5" width="15" height="10" rx="2" /><circle cx="14" cy="10" r="1" /><path d="M5.5 10h4" /></svg>
  ),
  network: (
    <svg viewBox="0 0 20 20"><path d="M2.5 8a10 10 0 0 1 15 0M5 11a6.5 6.5 0 0 1 10 0M7.6 14a3 3 0 0 1 4.8 0" /><circle cx="10" cy="16.5" r="0.9" className="fill" /></svg>
  ),
  about: (
    <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" /><path d="M10 9v5" /><circle cx="10" cy="6.4" r="0.9" className="fill" /></svg>
  ),
};

const main = [
  { id: "assist", label: "Assist" },
  { id: "performance", label: "Performance health" },
  { id: "storage", label: "Storage health" },
  { id: "network", label: "Network health" },
];

export default function Sidebar({ page, onNavigate }) {
  return (
    <nav className="sidebar">
      <img className="logo" src={logo} alt="Avantis" />
      <div className="nav-group">
        {main.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? "nav-item active" : "nav-item"}
            onClick={() => onNavigate(item.id)}
          >
            {icons[item.id]}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="nav-group bottom">
        <button className={page === "about" ? "nav-item active" : "nav-item"} onClick={() => onNavigate("about")}>
          {icons.about}
          <span>About</span>
        </button>
      </div>
    </nav>
  );
}

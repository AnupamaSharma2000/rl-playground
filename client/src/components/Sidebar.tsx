import { useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

const sections = [
  {
    label: "Getting Started",
    items: [
      { path: "/", label: "Introduction", icon: "📖", desc: "What is RL?" },
    ],
  },
  {
    label: "Core Concepts",
    items: [
      { path: "/mdp", label: "MDP Visualizer", icon: "🔷", desc: "States, actions, rewards" },
      { path: "/gridworld", label: "Value & Policy Iteration", icon: "🔢", desc: "Bellman equations live" },
    ],
  },
];

export default function Sidebar() {
  const [location, navigate] = useHashLocation();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg aria-label="RL Playground logo" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--color-primary)"/>
            <circle cx="10" cy="16" r="4" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="22" cy="10" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="22" cy="22" r="3" fill="none" stroke="white" strokeWidth="1.5"/>
            <line x1="14" y1="14" x2="19.5" y2="11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="14" y1="18" x2="19.5" y2="20.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="22" cy="10" r="1.2" fill="white"/>
            <circle cx="22" cy="22" r="1.2" fill="white"/>
          </svg>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem", color: "var(--color-text)", lineHeight: 1.2 }}>RL Playground</div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", lineHeight: 1 }}>Learn by doing</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 0", flex: 1 }}>
        {sections.map((section) => (
          <div key={section.label} style={{ marginBottom: "8px" }}>
            <div style={{
              fontSize: "0.65rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--color-text-faint)",
              padding: "6px 20px 4px",
            }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = location === item.path || (item.path === "/" && location === "");
              return (
                <button
                  key={item.path}
                  className={`nav-item${isActive ? " active" : ""}`}
                  onClick={() => navigate(item.path)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  style={{ width: "calc(100% - 16px)", textAlign: "left" }}
                >
                  <span style={{ fontSize: "1rem", lineHeight: 1 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: "0.7rem", color: isActive ? "var(--color-primary)" : "var(--color-text-faint)", opacity: 0.85 }}>{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid var(--color-border)",
        fontSize: "0.7rem",
        color: "var(--color-text-faint)",
        lineHeight: 1.5,
      }}>
        <div style={{ fontWeight: 500, color: "var(--color-text-muted)", marginBottom: "2px" }}>A learning resource</div>
        <div>Built for RL beginners</div>
      </div>
    </aside>
  );
}

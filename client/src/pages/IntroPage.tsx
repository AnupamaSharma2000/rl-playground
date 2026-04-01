import { useHashLocation } from "wouter/use-hash-location";

// KaTeX render helper - renders a string as inline LaTeX after mount
function Latex({ children }: { children: string }) {
  return <span dangerouslySetInnerHTML={{ __html: children }} />;
}

const NOTATION = [
  ["s, s'", "Current and next state"],
  ["a", "Action taken by the agent"],
  ["r, R(s,a)", "Reward received"],
  ["&#947;", "Discount factor (0 &le; &gamma; < 1)"],
  ["&pi;(a|s)", "Policy &mdash; prob. of action a in state s"],
  ["V<sup>&pi;</sup>(s)", "State value under policy &pi;"],
  ["Q<sup>&pi;</sup>(s,a)", "Action-value (Q-value) under policy &pi;"],
  ["P(s'|s,a)", "Transition probability"],
];

export default function IntroPage() {
  const [, navigate] = useHashLocation();

  return (
    <div style={{ maxWidth: "820px", margin: "0 auto", padding: "48px 40px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: "48px" }}>
        <span className="badge badge-blue" style={{ marginBottom: "16px" }}>Interactive Learning Resource</span>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
          fontWeight: 700,
          color: "var(--color-text)",
          lineHeight: 1.15,
          marginBottom: "16px",
        }}>
          Reinforcement Learning,<br />
          <span style={{ color: "var(--color-primary)" }}>from first principles.</span>
        </h1>
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", maxWidth: "60ch", lineHeight: 1.7 }}>
          This dashboard is a hands-on companion for understanding the mathematics behind Reinforcement Learning.
          Interact with live simulations — not just read equations.
        </p>
      </div>

      {/* What is RL section */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 600, marginBottom: "12px", color: "var(--color-text)" }}>
          What is Reinforcement Learning?
        </h2>
        <p style={{ color: "var(--color-text-muted)", lineHeight: 1.75, marginBottom: "16px" }}>
          Reinforcement Learning (RL) is a framework where an <strong>agent</strong> learns to make decisions
          by interacting with an <strong>environment</strong>. Unlike supervised learning, there are no labeled
          examples &mdash; the agent discovers what to do by trial and error, guided by a <strong>reward signal</strong>.
        </p>
        <div style={{
          background: "var(--color-math-bg)",
          border: "1px solid var(--color-border)",
          borderLeft: "3px solid var(--color-primary)",
          borderRadius: "6px",
          padding: "16px 20px",
          marginBottom: "16px",
          fontSize: "0.88rem",
          lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 600, color: "var(--color-primary)", marginBottom: "8px", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>THE CORE LOOP</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {[
              { text: "Agent", isLabel: true },
              { text: "→  takes action aₜ", isLabel: false },
              { text: "Environment", isLabel: true },
              { text: "→  returns sₜ₊₁, reward rₜ", isLabel: false },
              { text: "Agent", isLabel: true },
            ].map((step, i) => (
              <span key={i} style={{
                padding: step.isLabel ? "4px 12px" : "0",
                background: step.isLabel ? "var(--color-primary-light)" : "transparent",
                color: step.isLabel ? "var(--color-primary)" : "var(--color-text-muted)",
                borderRadius: "4px",
                fontWeight: step.isLabel ? 600 : 400,
                fontSize: "0.82rem",
              }}>{step.text}</span>
            ))}
          </div>
        </div>
        <p style={{ color: "var(--color-text-muted)", lineHeight: 1.75, fontSize: "0.9rem" }}>
          The agent's goal is to maximize its <strong>cumulative discounted return</strong>:{" "}
          <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", background: "var(--color-math-bg)", padding: "2px 6px", borderRadius: "4px" }}>
            G<sub>t</sub> = r<sub>t</sub> + &gamma;r<sub>t+1</sub> + &gamma;&sup2;r<sub>t+2</sub> + &hellip;
          </code>
          , where <strong>&gamma; &isin; [0,1)</strong> is the <strong>discount factor</strong>.
        </p>
      </div>

      {/* Key concepts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
        {[
          {
            icon: "🔷",
            title: "Markov Decision Process",
            body: "The formal mathematical framework for RL. A tuple (S, A, P, R, γ) — states, actions, transition probabilities, rewards, and discount.",
            badge: "badge-blue",
            badgeText: "Module 1",
            path: "/mdp",
          },
          {
            icon: "🔢",
            title: "Value & Policy Iteration",
            body: "Dynamic programming algorithms that solve MDPs exactly. Watch the Bellman equations converge on a gridworld in real time — step by step.",
            badge: "badge-green",
            badgeText: "Module 2",
            path: "/gridworld",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="card"
            style={{
              cursor: "pointer",
              transition: "box-shadow var(--transition), transform var(--transition)",
              border: "1px solid var(--color-border)",
            }}
            onClick={() => navigate(card.path)}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              (e.currentTarget as HTMLDivElement).style.transform = "";
            }}
          >
            <div style={{ fontSize: "1.6rem", marginBottom: "10px" }}>{card.icon}</div>
            <span className={`badge ${card.badge}`} style={{ marginBottom: "8px" }}>{card.badgeText}</span>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, marginBottom: "8px", color: "var(--color-text)" }}>
              {card.title}
            </h3>
            <p style={{ fontSize: "0.83rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{card.body}</p>
            <div style={{ marginTop: "14px", fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: 500 }}>
              Open module →
            </div>
          </div>
        ))}
      </div>

      {/* Notation reference */}
      <div className="card">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>Notation Reference</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {NOTATION.map(([sym, desc]) => (
            <div key={sym} style={{
              display: "flex",
              gap: "12px",
              padding: "8px 12px",
              background: "var(--color-math-bg)",
              borderRadius: "6px",
              alignItems: "flex-start",
            }}>
              <span
                style={{ minWidth: "90px", fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--color-primary)" }}
                dangerouslySetInnerHTML={{ __html: sym }}
              />
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }} dangerouslySetInnerHTML={{ __html: desc }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";

interface MDPState {
  id: string;
  label: string;
  x: number;
  y: number;
  isTerminal?: boolean;
  isStart?: boolean;
  description: string;
  value?: number;
}

interface MDPTransition {
  from: string;
  to: string;
  action: string;
  prob: number;
  reward: number;
}

const INITIAL_STATES: MDPState[] = [
  { id: "s0", label: "S\u2080", x: 120, y: 220, isStart: true, description: "Starting state. The agent begins here.", value: 0 },
  { id: "s1", label: "S\u2081", x: 340, y: 120, description: "Intermediate state A. Reached by taking action 'Left'.", value: 0 },
  { id: "s2", label: "S\u2082", x: 340, y: 320, description: "Intermediate state B. Reached by taking action 'Right'.", value: 0 },
  { id: "s3", label: "S\u2083", x: 560, y: 120, isTerminal: true, description: "Terminal state \u2014 Goal. Reward: +10.", value: 10 },
  { id: "s4", label: "S\u2084", x: 560, y: 320, isTerminal: true, description: "Terminal state \u2014 Trap. Reward: \u22125.", value: -5 },
];

const TRANSITIONS: MDPTransition[] = [
  { from: "s0", to: "s1", action: "Left", prob: 0.8, reward: -1 },
  { from: "s0", to: "s2", action: "Left", prob: 0.2, reward: -1 },
  { from: "s0", to: "s2", action: "Right", prob: 0.8, reward: -1 },
  { from: "s0", to: "s1", action: "Right", prob: 0.2, reward: -1 },
  { from: "s1", to: "s3", action: "Forward", prob: 0.9, reward: 10 },
  { from: "s1", to: "s4", action: "Forward", prob: 0.1, reward: -5 },
  { from: "s1", to: "s1", action: "Wait", prob: 1.0, reward: -0.1 },
  { from: "s2", to: "s4", action: "Forward", prob: 0.7, reward: -5 },
  { from: "s2", to: "s3", action: "Forward", prob: 0.3, reward: 10 },
  { from: "s2", to: "s2", action: "Wait", prob: 1.0, reward: -0.1 },
];

const GAMMA = 0.9;

function computeBellman(stateId: string, action: string, states: MDPState[]): { expected: number; terms: Array<{ toLabel: string; prob: number; reward: number; vNext: number; contribution: number }> } {
  const stateValues: Record<string, number> = {};
  const stateLabels: Record<string, string> = {};
  states.forEach(s => { stateValues[s.id] = s.value ?? 0; stateLabels[s.id] = s.label; });

  const relevant = TRANSITIONS.filter(t => t.from === stateId && t.action === action);
  let sum = 0;
  const terms = relevant.map(t => {
    const contribution = t.prob * (t.reward + GAMMA * stateValues[t.to]);
    sum += contribution;
    return { toLabel: stateLabels[t.to], prob: t.prob, reward: t.reward, vNext: stateValues[t.to], contribution };
  });
  return { expected: sum, terms };
}

export default function MDPPage() {
  const [selectedState, setSelectedState] = useState<MDPState | null>(INITIAL_STATES[0]);
  const [selectedAction, setSelectedAction] = useState<string>("Left");
  const [bellmanResult, setBellmanResult] = useState<ReturnType<typeof computeBellman> | null>(null);
  const [highlightedTransitions, setHighlightedTransitions] = useState<MDPTransition[]>([]);

  const actionsForState = selectedState
    ? [...new Set(TRANSITIONS.filter(t => t.from === selectedState.id).map(t => t.action))]
    : [];

  useEffect(() => {
    if (actionsForState.length > 0 && !actionsForState.includes(selectedAction)) {
      setSelectedAction(actionsForState[0]);
    }
  }, [selectedState?.id]);

  useEffect(() => {
    if (!selectedState) return;
    const result = computeBellman(selectedState.id, selectedAction, INITIAL_STATES);
    setBellmanResult(result);
    setHighlightedTransitions(TRANSITIONS.filter(t => t.from === selectedState.id && t.action === selectedAction));
  }, [selectedState?.id, selectedAction]);

  // SVG dimensions
  const W = 700, H = 460;

  return (
    <div style={{ padding: "40px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <span className="badge badge-blue" style={{ marginBottom: "10px" }}>Module 1</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 700, marginBottom: "8px" }}>
          Markov Decision Process
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", maxWidth: "65ch", lineHeight: 1.65 }}>
          An MDP formalizes the RL problem as a tuple <strong>(S, A, P, R, &gamma;)</strong>.
          Click a state node to explore its transitions and compute the Bellman equation live.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>
        {/* Left: SVG diagram */}
        <div>
          <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>MDP Graph</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Click a state node</span>
            </div>
            <div style={{ padding: "8px" }}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
                    <polygon points="0 0, 8 3.5, 0 7" fill="var(--color-text-faint)" />
                  </marker>
                  <marker id="arrowhead-active" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
                    <polygon points="0 0, 8 3.5, 0 7" fill="var(--color-primary)" />
                  </marker>
                  <marker id="arrowhead-neg" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
                    <polygon points="0 0, 8 3.5, 0 7" fill="#c25b1a" />
                  </marker>
                </defs>

                {/* Draw transitions */}
                {TRANSITIONS.filter(t => t.from !== t.to).map((t, i) => {
                  const from = INITIAL_STATES.find(s => s.id === t.from)!;
                  const to = INITIAL_STATES.find(s => s.id === t.to)!;
                  const isHighlighted = highlightedTransitions.some(ht => ht.from === t.from && ht.to === t.to && ht.action === t.action);

                  const dx = to.x - from.x;
                  const dy = to.y - from.y;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const ux = dx / len, uy = dy / len;
                  const R = 30;

                  const dupes = TRANSITIONS.filter(t2 => t2.from === t.from && t2.to === t.to);
                  const dupeIdx = dupes.findIndex(t2 => t2.action === t.action);
                  const perp = dupes.length > 1 ? (dupeIdx === 0 ? -14 : 14) : 0;
                  const nx = -uy, ny = ux;

                  const x1 = from.x + ux * R + nx * perp;
                  const y1 = from.y + uy * R + ny * perp;
                  const x2 = to.x - ux * R + nx * perp;
                  const y2 = to.y - uy * R + ny * perp;
                  const mx = (x1 + x2) / 2 + nx * 12;
                  const my = (y1 + y2) / 2 + ny * 12;

                  const color = isHighlighted ? "var(--color-primary)" : t.reward < 0 ? "#c25b1a55" : "var(--color-text-faint)";
                  const markerId = isHighlighted ? "url(#arrowhead-active)" : t.reward < 0 ? "url(#arrowhead-neg)" : "url(#arrowhead)";
                  const strokeW = isHighlighted ? 2.5 : 1.2;

                  return (
                    <g key={`${t.from}-${t.to}-${t.action}-${i}`}>
                      <path
                        d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeW}
                        markerEnd={markerId}
                        opacity={isHighlighted ? 1 : 0.6}
                      />
                      {isHighlighted && (
                        <text x={mx} y={my - 10} textAnchor="middle" fontSize="11" fill="var(--color-primary)" fontWeight="600">
                          {t.action} (p={t.prob})
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* State nodes */}
                {INITIAL_STATES.map((state) => {
                  const isSelected = selectedState?.id === state.id;
                  const isTerminalGoal = state.isTerminal && (state.value ?? 0) > 0;
                  const isTerminalBad = state.isTerminal && (state.value ?? 0) < 0;

                  let fillColor = "#ffffff";
                  let strokeColor = "var(--color-border)";
                  let strokeWidth = 1.5;

                  if (isSelected) { fillColor = "#e8edf8"; strokeColor = "var(--color-primary)"; strokeWidth = 2.5; }
                  else if (isTerminalGoal) { fillColor = "#e8f5e9"; strokeColor = "#1a6640"; }
                  else if (isTerminalBad) { fillColor = "#fdf0e8"; strokeColor = "#c25b1a"; }
                  else if (state.isStart) { fillColor = "#f0f5ff"; strokeColor = "var(--color-primary)"; }

                  return (
                    <g key={state.id} onClick={() => setSelectedState(state)} style={{ cursor: "pointer" }} data-testid={`state-node-${state.id}`}>
                      <circle cx={state.x} cy={state.y} r={30} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
                      {state.isTerminal && (
                        <circle cx={state.x} cy={state.y} r={26} fill="none" stroke={strokeColor} strokeWidth={1} opacity={0.4} />
                      )}
                      <text x={state.x} y={state.y - 3} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700" fill={isSelected ? "#1e3a7a" : "#141926"}>
                        {state.label}
                      </text>
                      <text x={state.x} y={state.y + 14} textAnchor="middle" fontSize="10" fill={isSelected ? "#1e3a7a" : "#5a6075"}>
                        {state.isTerminal ? (isTerminalGoal ? "+10" : "\u22125") : (state.isStart ? "start" : "")}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "0.75rem", color: "var(--color-text-muted)", flexWrap: "wrap" }}>
            {[
              { color: "#1a6640", label: "Start / Goal state" },
              { color: "#c25b1a", label: "Trap (negative reward)" },
              { color: "var(--color-primary)", label: "Selected + active transitions" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: l.color }} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* MDP tuple */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "10px" }}>MDP Tuple</div>
            <div style={{ background: "var(--color-math-bg)", borderRadius: "6px", padding: "12px 14px", fontSize: "0.82rem", fontFamily: "var(--font-mono)", lineHeight: 2, color: "var(--color-text-muted)" }}>
              <div><span style={{ color: "var(--color-primary)", fontWeight: 700 }}>S</span> = &#123;S&#8320;&ndash;S&#8324;&#125;</div>
              <div><span style={{ color: "var(--color-primary)", fontWeight: 700 }}>A</span> = &#123;Left, Right, Forward, Wait&#125;</div>
              <div><span style={{ color: "var(--color-primary)", fontWeight: 700 }}>P</span>(s&prime;|s,a) = stochastic transitions</div>
              <div><span style={{ color: "var(--color-primary)", fontWeight: 700 }}>R</span> &isin; &#123;&minus;5, &minus;1, &minus;0.1, +10&#125;</div>
              <div><span style={{ color: "var(--color-primary)", fontWeight: 700 }}>&gamma;</span> = {GAMMA}</div>
            </div>
          </div>

          {/* Selected state info */}
          {selectedState && (
            <div className="card fade-in">
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                <span>Selected: <span style={{ color: "var(--color-primary)" }}>{selectedState.label}</span></span>
                {selectedState.isTerminal && <span className="badge badge-orange">Terminal</span>}
                {selectedState.isStart && <span className="badge badge-green">Start</span>}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "12px" }}>
                {selectedState.description}
              </p>

              {!selectedState.isTerminal && actionsForState.length > 0 && (
                <>
                  <div style={{ fontWeight: 600, fontSize: "0.75rem", color: "var(--color-text-faint)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Choose Action</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                    {actionsForState.map(a => (
                      <button
                        key={a}
                        className={`btn ${selectedAction === a ? "btn-primary" : "btn-secondary"}`}
                        style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                        onClick={() => setSelectedAction(a)}
                        data-testid={`action-btn-${a}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>

                  {/* Bellman equation */}
                  <div style={{ fontWeight: 600, fontSize: "0.75rem", color: "var(--color-text-faint)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Bellman Equation</div>
                  <div style={{ background: "var(--color-math-bg)", border: "1px solid var(--color-border)", borderLeft: "3px solid var(--color-primary)", borderRadius: "6px", padding: "10px 14px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>
                      Q(s,a) = &Sigma;<sub>s&prime;</sub> P(s&prime;|s,a) [R(s,a,s&prime;) + &gamma;&middot;V(s&prime;)]
                    </div>
                    <div style={{ height: "1px", background: "var(--color-border)", margin: "8px 0" }} />
                    {/* Step-by-step expansion */}
                    {bellmanResult && bellmanResult.terms.map((t, i) => (
                      <div key={i} style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", lineHeight: 1.8 }}>
                        {i === 0 ? "= " : "+ "}
                        <span style={{ color: "var(--color-text)" }}>{t.prob}</span>
                        &nbsp;&times;&nbsp;({t.reward > 0 ? "+" : ""}{t.reward}&nbsp;+&nbsp;{GAMMA}&nbsp;&times;&nbsp;
                        <span style={{ color: "var(--color-primary)" }}>{t.vNext.toFixed(2)}</span>)
                        &nbsp;=&nbsp;
                        <span style={{ color: t.contribution >= 0 ? "var(--color-success)" : "#c25b1a", fontWeight: 600 }}>{t.contribution.toFixed(4)}</span>
                      </div>
                    ))}
                    {bellmanResult && (
                      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>Q-value =</span>
                        <span style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          fontSize: "1.15rem",
                          color: bellmanResult.expected >= 0 ? "var(--color-success)" : "#c25b1a",
                        }} className="tabular">
                          {bellmanResult.expected.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Transition table */}
                  <div style={{ fontWeight: 600, fontSize: "0.75rem", color: "var(--color-text-faint)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Transitions</div>
                  <div style={{ border: "1px solid var(--color-border)", borderRadius: "6px", overflow: "hidden" }}>
                    <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--color-math-bg)" }}>
                          {["s\u2032", "P(s\u2032|s,a)", "R", "\u03b3\u00b7V(s\u2032)"].map(h => (
                            <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {highlightedTransitions.map((t, i) => {
                          const toState = INITIAL_STATES.find(s => s.id === t.to)!;
                          return (
                            <tr key={i} style={{ borderBottom: i < highlightedTransitions.length - 1 ? "1px solid var(--color-divider)" : "none" }}>
                              <td style={{ padding: "6px 8px", fontWeight: 600, color: "var(--color-primary)" }}>{toState.label}</td>
                              <td style={{ padding: "6px 8px", fontFamily: "var(--font-mono)" }} className="tabular">{t.prob}</td>
                              <td style={{ padding: "6px 8px", fontFamily: "var(--font-mono)", color: t.reward < 0 ? "#c25b1a" : "var(--color-success)" }} className="tabular">
                                {t.reward > 0 ? `+${t.reward}` : t.reward}
                              </td>
                              <td style={{ padding: "6px 8px", fontFamily: "var(--font-mono)" }} className="tabular">
                                {(GAMMA * (toState.value ?? 0)).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {selectedState.isTerminal && (
                <div style={{ background: "var(--color-math-bg)", borderRadius: "6px", padding: "12px", fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.65 }}>
                  Terminal states have no outgoing transitions.<br />
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>V(s<sub>terminal</sub>) = R<sub>terminal</sub></code>
                  &nbsp;&mdash; value equals the final reward.
                </div>
              )}
            </div>
          )}

          {/* Markov property */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px" }}>The Markov Property</div>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.65, marginBottom: "8px" }}>
              The future depends only on the <strong>current state</strong>, not the history:
            </p>
            <div className="math-block" style={{ fontSize: "0.8rem", lineHeight: 1.8 }}>
              P(s<sub>t+1</sub> | s<sub>t</sub>, a<sub>t</sub>, s<sub>t-1</sub>, &hellip;) = P(s<sub>t+1</sub> | s<sub>t</sub>, a<sub>t</sub>)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

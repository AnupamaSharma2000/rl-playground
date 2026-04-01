// Policy Iteration: alternates policy evaluation + greedy improvement
import { useState, useEffect, useRef, useCallback } from "react";

// Grid config
const ROWS = 4;
const COLS = 5;
const GOAL_POS = { r: 0, c: 4 };
const TRAP_POS = { r: 1, c: 4 };
const WALL_CELLS = [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 1, c: 3 }];

type Action = "↑" | "↓" | "←" | "→";
const ACTIONS: Action[] = ["↑", "↓", "←", "→"];
const ACTION_DELTAS: Record<Action, [number, number]> = {
  "↑": [-1, 0], "↓": [1, 0], "←": [0, -1], "→": [0, 1],
};
const ACTION_LABELS: Record<Action, string> = {
  "↑": "Up", "↓": "Down", "←": "Left", "→": "Right",
};

type CellType = "normal" | "goal" | "trap" | "wall" | "start";

function getCellType(r: number, c: number): CellType {
  if (r === GOAL_POS.r && c === GOAL_POS.c) return "goal";
  if (r === TRAP_POS.r && c === TRAP_POS.c) return "trap";
  if (WALL_CELLS.some(w => w.r === r && w.c === c)) return "wall";
  if (r === ROWS - 1 && c === 0) return "start";
  return "normal";
}

function isWall(r: number, c: number) {
  return WALL_CELLS.some(w => w.r === r && w.c === c);
}

function isTerminal(r: number, c: number) {
  return (r === GOAL_POS.r && c === GOAL_POS.c) || (r === TRAP_POS.r && c === TRAP_POS.c);
}

function getReward(r: number, c: number): number {
  if (r === GOAL_POS.r && c === GOAL_POS.c) return 1.0;
  if (r === TRAP_POS.r && c === TRAP_POS.c) return -1.0;
  return 0.0;
}

function tryMove(r: number, c: number, dr: number, dc: number): [number, number] {
  const nr = r + dr, nc = c + dc;
  if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || isWall(nr, nc)) return [r, c];
  return [nr, nc];
}

// Stochastic transitions: intended direction 0.8, perpendicular 0.1 each
function getTransitions(r: number, c: number, action: Action): Array<{ r: number; c: number; prob: number }> {
  const [dr, dc] = ACTION_DELTAS[action];
  const perps: Action[] = action === "↑" || action === "↓" ? ["←", "→"] : ["↑", "↓"];
  const [pdr0, pdc0] = ACTION_DELTAS[perps[0]];
  const [pdr1, pdc1] = ACTION_DELTAS[perps[1]];
  const main = tryMove(r, c, dr, dc);
  const p0 = tryMove(r, c, pdr0, pdc0);
  const p1 = tryMove(r, c, pdr1, pdc1);
  return [
    { r: main[0], c: main[1], prob: 0.8 },
    { r: p0[0], c: p0[1], prob: 0.1 },
    { r: p1[0], c: p1[1], prob: 0.1 },
  ];
}

function initValues(): number[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if (r === GOAL_POS.r && c === GOAL_POS.c) return 1.0;
      if (r === TRAP_POS.r && c === TRAP_POS.c) return -1.0;
      if (isWall(r, c)) return 0;
      return 0;
    })
  );
}

function initPolicy(): Action[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if (isTerminal(r, c) || isWall(r, c)) return "→" as Action;
      if (c < GOAL_POS.c) return "→" as Action;
      return "↑" as Action;
    })
  );
}

function valueIteration(values: number[][], gamma: number): { newValues: number[][]; maxDelta: number } {
  const newValues = values.map(row => [...row]);
  let maxDelta = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isTerminal(r, c) || isWall(r, c)) continue;
      let best = -Infinity;
      for (const a of ACTIONS) {
        const transitions = getTransitions(r, c, a);
        const qval = transitions.reduce((sum, t) => {
          return sum + t.prob * (getReward(t.r, t.c) + gamma * values[t.r][t.c]);
        }, 0);
        if (qval > best) best = qval;
      }
      const delta = Math.abs(best - values[r][c]);
      if (delta > maxDelta) maxDelta = delta;
      newValues[r][c] = best;
    }
  }
  return { newValues, maxDelta };
}

function policyEvaluation(policy: Action[][], values: number[][], gamma: number): { newValues: number[][]; maxDelta: number } {
  const newValues = values.map(row => [...row]);
  let maxDelta = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isTerminal(r, c) || isWall(r, c)) continue;
      const a = policy[r][c];
      const transitions = getTransitions(r, c, a);
      const newV = transitions.reduce((sum, t) => {
        return sum + t.prob * (getReward(t.r, t.c) + gamma * values[t.r][t.c]);
      }, 0);
      const delta = Math.abs(newV - values[r][c]);
      if (delta > maxDelta) maxDelta = delta;
      newValues[r][c] = newV;
    }
  }
  return { newValues, maxDelta };
}

function extractPolicy(values: number[][]): Action[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if (isTerminal(r, c) || isWall(r, c)) return "→" as Action;
      let best: Action = "↑";
      let bestQ = -Infinity;
      for (const a of ACTIONS) {
        const transitions = getTransitions(r, c, a);
        const qval = transitions.reduce((sum, t) => sum + t.prob * values[t.r][t.c], 0);
        if (qval > bestQ) { bestQ = qval; best = a; }
      }
      return best;
    })
  );
}

// Value → color
function valueToColor(v: number): string {
  if (v > 0) {
    const t = Math.min(1, v);
    const r = Math.round(230 - t * 70);
    const g = Math.round(245 - t * 10);
    const b = Math.round(230 - t * 100);
    return `rgb(${r},${g},${b})`;
  } else if (v < 0) {
    const t = Math.min(1, -v);
    const r = Math.round(253 - t * 10);
    const g = Math.round(240 - t * 120);
    const b = Math.round(232 - t * 100);
    return `rgb(${r},${g},${b})`;
  }
  return "#fafaf7";
}

type Mode = "value-iteration" | "policy-iteration";

export default function GridworldPage() {
  const [mode, setMode] = useState<Mode>("value-iteration");
  const [gamma, setGamma] = useState(0.9);
  const [values, setValues] = useState<number[][]>(initValues());
  const [policy, setPolicy] = useState<Action[][]>(initPolicy());
  const [iteration, setIteration] = useState(0);
  const [maxDelta, setMaxDelta] = useState(0);
  const [converged, setConverged] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>({ r: ROWS - 1, c: 0 });
  const [piPhase, setPiPhase] = useState<"eval" | "improve">("eval");
  const [piEvalSteps, setPiEvalSteps] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mathRef = useRef<HTMLDivElement>(null);

  const rerenderMath = useCallback(() => {
    if (mathRef.current && typeof (window as any).renderMathInElement === "function") {
      setTimeout(() => {
        (window as any).renderMathInElement(mathRef.current!, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
        });
      }, 50);
    }
  }, []);

  useEffect(() => { rerenderMath(); }, [values, policy, selectedCell]);

  function reset() {
    setValues(initValues());
    setPolicy(initPolicy());
    setIteration(0);
    setMaxDelta(0);
    setConverged(false);
    setHistory([]);
    setPiPhase("eval");
    setPiEvalSteps(0);
    if (intervalRef.current) { clearInterval(intervalRef.current); setIsRunning(false); }
  }

  function step() {
    if (converged) return;

    if (mode === "value-iteration") {
      setValues(prev => {
        const { newValues, maxDelta: d } = valueIteration(prev, gamma);
        setMaxDelta(d);
        setHistory(h => [...h, d]);
        if (d < 1e-6) setConverged(true);
        setIteration(i => i + 1);
        setPolicy(extractPolicy(newValues));
        return newValues;
      });
    } else {
      // Policy iteration: alternate eval / improve
      if (piPhase === "eval") {
        setValues(prev => {
          const { newValues, maxDelta: d } = policyEvaluation(policy, prev, gamma);
          setMaxDelta(d);
          setHistory(h => [...h, d]);
          setPiEvalSteps(s => {
            const next = s + 1;
            if (d < 1e-3 || next >= 20) {
              setPiPhase("improve");
              setPiEvalSteps(0);
            }
            return next;
          });
          setIteration(i => i + 1);
          return newValues;
        });
      } else {
        // Policy improvement
        const newPol = extractPolicy(values);
        // Check if policy changed
        let changed = false;
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (newPol[r][c] !== policy[r][c]) { changed = true; break; }
          }
          if (changed) break;
        }
        setPolicy(newPol);
        if (!changed) {
          setConverged(true);
        } else {
          setPiPhase("eval");
        }
        setIteration(i => i + 1);
        setMaxDelta(0);
        setHistory(h => [...h, 0]);
      }
    }
  }

  function toggleAuto() {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
    } else {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        if (converged) { clearInterval(intervalRef.current!); setIsRunning(false); return; }
        step();
      }, 350);
    }
  }

  useEffect(() => {
    if (converged && intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
    }
  }, [converged]);

  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  useEffect(() => { reset(); }, [mode, gamma]);

  const CELL_SIZE = 80;
  const gridWidth = COLS * CELL_SIZE;
  const gridHeight = ROWS * CELL_SIZE;

  function getQValues(r: number, c: number): Record<Action, number> {
    const result: Record<Action, number> = { "↑": 0, "↓": 0, "←": 0, "→": 0 };
    for (const a of ACTIONS) {
      result[a] = getTransitions(r, c, a).reduce((sum, t) => sum + t.prob * (getReward(t.r, t.c) + gamma * values[t.r][t.c]), 0);
    }
    return result;
  }

  const sel = selectedCell;
  const selType = sel ? getCellType(sel.r, sel.c) : null;
  const selValue = sel ? values[sel.r][sel.c] : null;
  const selPolicy = sel && !isTerminal(sel.r, sel.c) && !isWall(sel.r, sel.c) ? policy[sel.r][sel.c] : null;
  const selQValues = sel && !isTerminal(sel.r, sel.c) && !isWall(sel.r, sel.c) ? getQValues(sel.r, sel.c) : null;

  return (
    <div style={{ padding: "40px", maxWidth: "1140px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <span className="badge badge-green" style={{ marginBottom: "10px" }}>Module 2</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 700, marginBottom: "8px" }}>
          Value & Policy Iteration
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", maxWidth: "70ch", lineHeight: 1.65 }}>
          Dynamic programming methods that solve MDPs exactly. The <strong>Bellman optimality equation</strong> is applied
          iteratively until the value function V(s) converges. Click any cell to inspect Q-values.
        </p>
      </div>

      {/* Mode + Controls */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "24px" }}>
        {/* Mode toggle */}
        <div style={{ display: "flex", border: "1px solid var(--color-border)", borderRadius: "8px", overflow: "hidden", background: "var(--color-surface-2)" }}>
          {(["value-iteration", "policy-iteration"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              data-testid={`mode-${m}`}
              style={{
                padding: "6px 14px",
                fontSize: "0.8rem",
                fontWeight: 600,
                background: mode === m ? "var(--color-primary)" : "transparent",
                color: mode === m ? "white" : "var(--color-text-muted)",
                border: "none",
                cursor: "pointer",
                transition: "all 180ms ease",
              }}
            >
              {m === "value-iteration" ? "Value Iteration" : "Policy Iteration"}
            </button>
          ))}
        </div>

        {/* Gamma slider */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "6px 12px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>γ = <strong style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>{gamma.toFixed(2)}</strong></span>
          <input
            type="range" min="0.5" max="0.99" step="0.01"
            value={gamma}
            onChange={e => setGamma(parseFloat(e.target.value))}
            style={{ width: "90px" }}
            data-testid="gamma-slider"
          />
        </div>

        {/* Action buttons */}
        <button className="btn btn-secondary" onClick={step} disabled={converged} data-testid="btn-step">
          Step →
        </button>
        <button className={`btn ${isRunning ? "btn-ghost" : "btn-primary"}`} onClick={toggleAuto} disabled={converged} data-testid="btn-auto">
          {isRunning ? "⏸ Pause" : "▶ Auto"}
        </button>
        <button className="btn btn-ghost" onClick={reset} data-testid="btn-reset">
          ↺ Reset
        </button>

        {/* Status */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            Iteration: <strong style={{ color: "var(--color-text)" }}>{iteration}</strong>
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            Δ: <strong style={{ color: maxDelta < 0.001 ? "var(--color-success)" : "var(--color-accent)" }}>{maxDelta.toFixed(5)}</strong>
          </span>
          {converged && (
            <span className="badge badge-green fade-in">✓ Converged</span>
          )}
          {mode === "policy-iteration" && !converged && (
            <span className="badge badge-blue" style={{ fontSize: "0.68rem" }}>
              {piPhase === "eval" ? `Eval (step ${piEvalSteps})` : "Improve"}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px", alignItems: "start" }}>
        {/* Gridworld */}
        <div>
          <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Gridworld (4×5)</span>
              <div style={{ display: "flex", gap: "12px", fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", background: "rgb(160,235,170)", borderRadius: "2px", display: "inline-block" }} />High V(s)</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", background: "rgb(253,120,80)", borderRadius: "2px", display: "inline-block" }} />Low V(s)</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", background: "#555", borderRadius: "2px", display: "inline-block" }} />Wall</span>
              </div>
            </div>
            <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
                gap: "3px",
                background: "var(--color-border)",
                padding: "3px",
                borderRadius: "8px",
              }}>
                {Array.from({ length: ROWS }, (_, r) =>
                  Array.from({ length: COLS }, (_, c) => {
                    const type = getCellType(r, c);
                    const v = values[r][c];
                    const pol = policy[r][c];
                    const isSelected = sel?.r === r && sel?.c === c;

                    let bg = valueToColor(v);
                    if (type === "wall") bg = "#4a4a55";
                    if (type === "goal") bg = "#d4edda";
                    if (type === "trap") bg = "#fde8d8";

                    return (
                      <div
                        key={`${r}-${c}`}
                        className="gridworld-cell"
                        onClick={() => setSelectedCell({ r, c })}
                        data-testid={`cell-${r}-${c}`}
                        style={{
                          background: bg,
                          outline: isSelected ? "2.5px solid var(--color-primary)" : "none",
                          outlineOffset: "-2px",
                          borderRadius: "5px",
                          cursor: type === "wall" ? "default" : "pointer",
                        }}
                      >
                        {type === "wall" ? (
                          <span style={{ color: "#aaa", fontSize: "1rem" }}>▪</span>
                        ) : type === "goal" ? (
                          <>
                            <span style={{ fontSize: "1.1rem" }}>🏆</span>
                            <span className="value-text" style={{ color: "var(--color-success)", fontWeight: 600 }}>+1</span>
                          </>
                        ) : type === "trap" ? (
                          <>
                            <span style={{ fontSize: "1.1rem" }}>⚡</span>
                            <span className="value-text" style={{ color: "#c25b1a", fontWeight: 600 }}>−1</span>
                          </>
                        ) : (
                          <>
                            <span className="policy-arrow" style={{ fontSize: "1.3rem", lineHeight: 1 }}>{pol}</span>
                            <span className="value-text tabular" style={{ color: v >= 0 ? "var(--color-success)" : "#c25b1a" }}>
                              {v.toFixed(3)}
                            </span>
                            {type === "start" && (
                              <span style={{ fontSize: "0.6rem", color: "var(--color-primary)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>START</span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Convergence chart */}
          {history.length > 1 && (
            <div className="card" style={{ marginTop: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "0.82rem", marginBottom: "10px", color: "var(--color-text-muted)" }}>
                MAX |ΔV| PER ITERATION — convergence trace
              </div>
              <div style={{ position: "relative", height: "70px" }}>
                <svg viewBox={`0 0 ${Math.max(history.length * 6, 300)} 70`} style={{ width: "100%", height: "70px", overflow: "visible" }}>
                  {(() => {
                    const maxH = Math.max(...history, 0.001);
                    const pts = history.map((d, i) => {
                      const x = (i / (history.length - 1)) * (Math.max(history.length * 6, 300) - 20) + 10;
                      const y = 65 - (d / maxH) * 55;
                      return `${x},${y}`;
                    }).join(" ");
                    return (
                      <>
                        <polyline points={pts} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                        {converged && (
                          <line x1={((history.length - 1) / (history.length - 1)) * (Math.max(history.length * 6, 300) - 20) + 10}
                            y1="0" x2={((history.length - 1) / (history.length - 1)) * (Math.max(history.length * 6, 300) - 20) + 10}
                            y2="70" stroke="var(--color-success)" strokeWidth="1" strokeDasharray="3 3" />
                        )}
                        <line x1="10" y1="60" x2={Math.max(history.length * 6, 300) - 10} y2="60" stroke="var(--color-border)" strokeWidth="1" />
                      </>
                    );
                  })()}
                </svg>
                <div style={{ position: "absolute", right: 0, top: 0, fontSize: "0.65rem", color: "var(--color-text-faint)", fontFamily: "var(--font-mono)" }}>
                  iter {iteration}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Algorithm explanation */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px" }}>
              {mode === "value-iteration" ? "Value Iteration" : "Policy Iteration"} — How it works
            </div>
            <div ref={mathRef}>
              {mode === "value-iteration" ? (
                <>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.7, marginBottom: "10px" }}>
                    Apply the <strong>Bellman optimality update</strong> to every state simultaneously, each iteration:
                  </p>
                  <div className="math-block" style={{ marginBottom: "10px", fontFamily: "var(--font-mono)", fontSize: "0.82rem", lineHeight: 1.8 }}>
                    V<sub>k+1</sub>(s) &larr; max<sub>a</sub> &Sigma;<sub>s&prime;</sub> P(s&prime;|s,a) [R(s,a,s&prime;) + &gamma;&middot;V<sub>k</sub>(s&prime;)]
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.65 }}>
                    The <code style={{fontFamily:"var(--font-mono)",fontSize:"0.8rem"}}>max</code> selects the best action. Repeat until convergence: &Delta;V &lt; &epsilon;.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: 1.7, marginBottom: "10px" }}>
                    Alternates between <strong>policy evaluation</strong> and <strong>policy improvement</strong>:
                  </p>
                  <div className="math-block" style={{ marginBottom: "6px", fontFamily: "var(--font-mono)", fontSize: "0.82rem", lineHeight: 1.8 }}>
                    V<sup>&pi;</sup>(s) &larr; &Sigma;<sub>s&prime;</sub> P(s&prime;|s,&pi;(s)) [R + &gamma;&middot;V<sup>&pi;</sup>(s&prime;)]
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-faint)", marginBottom: "8px", fontStyle: "italic" }}>Step 1: Evaluate current policy until convergence</div>
                  <div className="math-block" style={{ marginBottom: "6px", fontFamily: "var(--font-mono)", fontSize: "0.82rem", lineHeight: 1.8 }}>
                    &pi;&prime;(s) &larr; arg max<sub>a</sub> &Sigma;<sub>s&prime;</sub> P(s&prime;|s,a) [R + &gamma;&middot;V<sup>&pi;</sup>(s&prime;)]
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-faint)", fontStyle: "italic" }}>Step 2: Improve &mdash; greedy w.r.t. current values</div>
                  <div style={{ marginTop: "8px", padding: "6px 10px", background: "var(--color-primary-light)", borderRadius: "6px", fontSize: "0.75rem", color: "var(--color-primary)" }}>
                    Current phase: <strong>{piPhase === "eval" ? "Evaluating policy" : "Improving policy"}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Selected cell inspector */}
          {sel && selType !== "wall" && (
            <div className="card fade-in">
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                Cell ({sel.r}, {sel.c})
                {selType === "goal" && <span className="badge badge-green">Goal</span>}
                {selType === "trap" && <span className="badge badge-orange">Trap</span>}
                {selType === "start" && <span className="badge badge-blue">Start</span>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                <div style={{ background: "var(--color-math-bg)", borderRadius: "6px", padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--color-text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>V(s)</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.15rem", color: (selValue ?? 0) >= 0 ? "var(--color-success)" : "#c25b1a" }} className="tabular">
                    {(selValue ?? 0).toFixed(4)}
                  </div>
                </div>
                <div style={{ background: "var(--color-math-bg)", borderRadius: "6px", padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--color-text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>π(s)</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-primary)" }}>
                    {selPolicy ?? "—"}
                  </div>
                </div>
              </div>

              {/* Q-values for all actions */}
              {selQValues && (
                <>
                  <div style={{ fontWeight: 600, fontSize: "0.78rem", color: "var(--color-text-muted)", marginBottom: "8px" }}>Q-VALUES FOR ALL ACTIONS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {ACTIONS.map(a => {
                      const q = selQValues[a];
                      const isOptimal = a === selPolicy;
                      const maxQ = Math.max(...Object.values(selQValues));
                      const barWidth = maxQ !== 0 ? Math.max(0, (q / Math.abs(maxQ)) * 100) : 0;
                      return (
                        <div key={a} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "5px 8px",
                          background: isOptimal ? "var(--color-primary-light)" : "var(--color-math-bg)",
                          borderRadius: "5px",
                          border: isOptimal ? "1px solid hsl(220 60% 75%)" : "1px solid transparent",
                        }}>
                          <span style={{ width: "20px", textAlign: "center", fontWeight: 700, fontSize: "1rem", color: "var(--color-primary)" }}>{a}</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", width: "40px" }}>{ACTION_LABELS[a]}</span>
                          <div style={{ flex: 1, height: "4px", background: "var(--color-border)", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{
                              width: `${Math.abs(barWidth)}%`,
                              height: "100%",
                              background: q >= 0 ? "var(--color-success)" : "#c25b1a",
                              borderRadius: "2px",
                              transition: "width 0.3s ease",
                            }} />
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", minWidth: "56px", textAlign: "right", color: q >= 0 ? "var(--color-success)" : "#c25b1a", fontWeight: isOptimal ? 700 : 400 }} className="tabular">
                            {q.toFixed(4)}
                          </span>
                          {isOptimal && <span style={{ fontSize: "0.65rem", color: "var(--color-primary)", fontWeight: 700 }}>★</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "0.72rem", color: "var(--color-text-faint)", fontStyle: "italic" }}>
                    &#9733; = greedy optimal action under current V<sub>k</sub>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Discount factor explanation */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: "0.82rem", marginBottom: "6px" }}>Why does γ matter?</div>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.65, marginBottom: "8px" }}>
              The discount factor <strong>&gamma;</strong> controls how much the agent cares about <strong>future rewards</strong> vs immediate ones.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <div style={{ background: "var(--color-math-bg)", borderRadius: "6px", padding: "8px 10px", fontSize: "0.75rem" }}>
                <div style={{ fontWeight: 600, color: "var(--color-primary)", marginBottom: "2px" }}>γ → 0</div>
                <div style={{ color: "var(--color-text-muted)" }}>Myopic — only immediate reward matters</div>
              </div>
              <div style={{ background: "var(--color-math-bg)", borderRadius: "6px", padding: "8px 10px", fontSize: "0.75rem" }}>
                <div style={{ fontWeight: 600, color: "var(--color-primary)", marginBottom: "2px" }}>γ → 1</div>
                <div style={{ color: "var(--color-text-muted)" }}>Far-sighted — all future rewards count equally</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

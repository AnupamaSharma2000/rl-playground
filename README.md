# RL Playground

An interactive dashboard for learning Reinforcement Learning from first principles.

## Modules

- **Introduction** — The RL loop, discounted return, notation reference
- **MDP Visualizer** — Interactive state graph; click any state to see the Bellman equation expand live
- **Value & Policy Iteration** — 4×5 gridworld; watch V(s) propagate, inspect Q-values per cell

## Tech

React + Vite + TypeScript + Tailwind CSS + shadcn/ui

## Run locally

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

```bash
npm run build
npm install -D gh-pages
# add "deploy": "gh-pages -d dist/public" to package.json
npm run deploy
```

import { useState } from "react";
import { Router, Switch, Route } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "./components/Sidebar";
import MDPPage from "./pages/MDPPage";
import GridworldPage from "./pages/GridworldPage";
import IntroPage from "./pages/IntroPage";

export default function App() {
  return (
    <Router hook={useHashLocation}>
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-area">
          <Switch>
            <Route path="/" component={IntroPage} />
            <Route path="/mdp" component={MDPPage} />
            <Route path="/gridworld" component={GridworldPage} />
            <Route component={IntroPage} />
          </Switch>
        </main>
      </div>
      <Toaster />
    </Router>
  );
}

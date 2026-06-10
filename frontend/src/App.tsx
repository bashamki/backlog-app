import React, { useState } from "react";
import { useAuth } from "./auth";
import Login from "./pages/Login";
import Backlog from "./pages/Backlog";
import Sprints from "./pages/Sprints";

export default function App() {
  const { token, role, email, logout } = useAuth();
  const [tab, setTab] = useState<"backlog" | "sprints">("backlog");
  if (!token) return <Login />;
  return (
    <div className="app">
      <header className="top">
        <span className="brand">ORDO</span>
        <nav>
          <button className={tab === "backlog" ? "on" : ""} onClick={() => setTab("backlog")}>Бэклог</button>
          <button className={tab === "sprints" ? "on" : ""} onClick={() => setTab("sprints")}>Спринты</button>
        </nav>
        <span className="who">{email} · {role === "pm_editor" ? "редактор" : "просмотр"}</span>
        <button className="logout" onClick={logout}>Выйти</button>
      </header>
      <main>{tab === "backlog" ? <Backlog /> : <Sprints />}</main>
    </div>
  );
}

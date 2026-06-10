import React, { useState } from "react";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("pm@demo.local");
  const [password, setPassword] = useState("password");
  const [err, setErr] = useState("");
  const submit = async () => {
    try { await login(email, password); } catch (e: any) { setErr(e.message); }
  };
  return (
    <div className="login">
      <div className="login-card">
        <span className="brand big">ORDO</span>
        <p className="muted">пульт бэклога</p>
        <label>E-mail<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Пароль<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {err && <p className="err">{err}</p>}
        <button className="primary" onClick={submit}>Войти</button>
        <p className="muted small">demo: pm@demo.local / viewer@demo.local · пароль: password</p>
      </div>
    </div>
  );
}

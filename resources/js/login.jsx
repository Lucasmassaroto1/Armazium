import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import '../css/login.css';

function Login(){
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e){
    e.preventDefault();
    setLoading(true);

    try{
      const res = await fetch("/login",{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content"),
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password: senha }),
      });

      const data = await res.json().catch(() => ({}));

      if(!res.ok){
        setErro(
          data?.message || "Falha no login, verifique suas credenciais."
        );
      }else{
        window.location.href = data?.redirect || "/";
      }
    }catch{
      setErro("Erro de rede, tente novamente.");
    }finally{
      setLoading(false);
    }
  }

  return(
    <div className="login-card">
      <h2>Login</h2>

      {erro && <div className="error">{erro}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
        </div>

        <div className="form-group">
          <label>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required/>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

        <p>
          Não tem conta? <a href="/register">Criar usuário</a>
        </p>
    </div>
  );
}

createRoot(document.getElementById("app")).render(<Login />);
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import '../css/login.css';

function isStrongPassword(password){
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

function Register(){
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e){
    e.preventDefault();
    setErro("");

    if(!isStrongPassword(senha)){
      setErro("A senha deve conter pelo menos 8 caracteres, incluindo 1 maiúscula, 1 número e 1 caractere especial.");
      return;
    }

    setLoading(true);
    try{
      const res = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
          Accept: "application/json",
        },
        body: JSON.stringify({ name, email, password: senha }),
      });

      const data = await res.json().catch(() => ({}));

      if(!res.ok){
        setErro(data?.message || "Erro ao criar usuário.");
      }else{
        window.location.href = data?.redirect || "/login";
      }
    }catch{
      setErro("Erro de rede, tente novamente.");
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <h2>Criar Conta</h2>

      {erro && <div className="error">{erro}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Registrar"}
        </button>
      </form>

      <p>
        Já tem conta? <a href="/login">Fazer login</a>
      </p>
    </div>
  );
}

createRoot(document.getElementById("app")).render(<Register />);

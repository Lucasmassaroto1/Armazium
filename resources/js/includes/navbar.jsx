import React from 'react';

export default function Navbar(){
  async function handleLogout(e) {
    e.preventDefault();

    try {
      await fetch("/logout", {
        method: "POST",
        credentials: "same-origin", // se front e back no mesmo domínio/porta
        headers: {
          "X-CSRF-TOKEN": document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") || "",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    } finally {
      window.location.href = "/login";
    }
  }
  return(
    <header className="topbar">
      <div className="brand">
        <span className="logo-dot" /> <strong>Armazium</strong>
      </div>
      <nav className="nav">
        <a href="/">Dashboad</a>
        <a href="/products">Produtos</a>
        <a href="/clients">Clientes</a>
        <a href="/sales">Vendas</a>
        <a href="/repairs">Manutenções</a>
        <a href="/logout" className="logout" onClick={handleLogout}>Sair</a>
      </nav>
    </header>
  )
}
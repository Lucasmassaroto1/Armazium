import React from 'react';
import '../../css/includes.css';
import { VscGraph, VscSignOut } from "react-icons/vsc";  // Dashboard && Logout
import { BsBoxSeam, BsCartCheck } from "react-icons/bs"; // Produtos && Vendas
import { FaUsers, FaTools } from "react-icons/fa";       // Clientes && Mautenções

export default function Navbar(){
  function normalize(path){
    if(!path) return '/';
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  }

  const currentPath = normalize(window.location.pathname);

  function isActive(linkPath){
    const p = normalize(linkPath);
    if(p === '/') return currentPath === '/';
    return currentPath === p || currentPath.startsWith(p + '/');
  }

  async function handleLogout(e) {
    e.preventDefault();

    try{
      await fetch("/logout", {
        method: "POST",
        credentials: "same-origin",
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
    }catch (err){
      console.error("Erro ao deslogar:", err);
    }finally{
      window.location.href = "/login";
    }
  }
  return(
    <header className="topbar">
      <div className="brand">
        <span className="logo-dot"/> <strong>Armazium</strong>
      </div>
      <nav className="nav">
        <li><a href="/" className={isActive('/') ? 'ativo' : ''}><VscGraph/> Dashboard</a></li>
        <li><a href="/products" className={isActive('/products') ? 'ativo' : ''}><BsBoxSeam/> Produtos</a></li>
        <li><a href="/clients" className={isActive('/clients') ? 'ativo' : ''}><FaUsers/> Clientes</a></li>
        <li><a href="/sales" className={isActive('/sales') ? 'ativo' : ''}><BsCartCheck/> Vendas</a></li>
        <li><a href="/repairs" className={isActive('/repairs') ? 'ativo' : ''}><FaTools/> Manutenções</a></li>
        <li><a href="/logout" className="logout" onClick={handleLogout}><VscSignOut/> Sair</a></li>
      </nav>
    </header>
  )
}
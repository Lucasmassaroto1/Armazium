import React, { useEffect, useState, useCallback } from 'react';
import '../../css/includes.css';
import { VscGraph, VscSignOut, VscMenu } from "react-icons/vsc";
import { BsBoxSeam, BsCartCheck } from "react-icons/bs";
import { FaUsers, FaTools } from "react-icons/fa";

export default function Navbar(){
  const [open, setOpen] = useState(false);

  const normalize = useCallback((path) => {
    if(!path) return '/';
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  }, []);

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
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
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

  // Fecha com ESC
  useEffect(() => {
    function onKey(e){
      if(e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Trava o scroll do body quando aberto
  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  // Fecha o menu quando a rota mudar (navegação por <a>)
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a');
      if(a && a.href && a.origin === window.location.origin){
        setOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return(
    <>
      <div className={`mobile-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} aria-hidden={!open}/>

      <aside className={`mobile-drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Menu">
        <div className="brand" style={{margin: '6px 6px 14px'}}>
          <span className="logo-dot" aria-hidden="true"/> <strong>Armazium</strong>
        </div>
        <nav className="nav" role="list" aria-label="Navegação principal (mobile)">
          <li><a href="/" className={isActive('/') ? 'ativo' : ''} aria-current={isActive('/') ? 'page' : undefined}><VscGraph/> <span>Dashboard</span></a></li>
          <li><a href="/products" className={isActive('/products') ? 'ativo' : ''}><BsBoxSeam/> <span>Produtos</span></a></li>
          <li><a href="/clients" className={isActive('/clients') ? 'ativo' : ''}><FaUsers/> <span>Clientes</span></a></li>
          <li><a href="/sales" className={isActive('/sales') ? 'ativo' : ''}><BsCartCheck/> <span>Vendas</span></a></li>
          <li><a href="/repairs" className={isActive('/repairs') ? 'ativo' : ''}><FaTools/> <span>Manutenções</span></a></li>
          <li><a href="/logout" className="logout" onClick={handleLogout}><VscSignOut/> <span>Sair</span></a></li>
        </nav>
      </aside>

      <header className="topbar">
        <div className="brand">
          <span className="logo-dot" aria-hidden="true"/> <strong>Armazium</strong>
        </div>

        <button className="hamburger-btn" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(v => !v)} title={open ? 'Fechar menu' : 'Abrir menu'}><VscMenu/></button>

        <nav className="nav" role="list" aria-label="Navegação principal (desktop)">
          <li><a href="/" className={isActive('/') ? 'ativo' : ''} aria-current={isActive('/') ? 'page' : undefined}><VscGraph/> <span>Dashboard</span></a></li>
          <li><a href="/products" className={isActive('/products') ? 'ativo' : ''}><BsBoxSeam/> <span>Produtos</span></a></li>
          <li><a href="/clients" className={isActive('/clients') ? 'ativo' : ''}><FaUsers/> <span>Clientes</span></a></li>
          <li><a href="/sales" className={isActive('/sales') ? 'ativo' : ''}><BsCartCheck/> <span>Vendas</span></a></li>
          <li><a href="/repairs" className={isActive('/repairs') ? 'ativo' : ''}><FaTools/> <span>Manutenções</span></a></li>
          <li><a href="/logout" className="logout" onClick={handleLogout}><VscSignOut/> <span>Sair</span></a></li>
        </nav>
      </header>
    </>
  );
}
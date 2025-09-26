import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import '../css/home.css';
import '../css/produtoModal.css';
import { VscEdit, VscTrash, VscSave } from "react-icons/vsc";

function formatPhoneBR(v){
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
}

function Clients(){
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name:"", email:"", phone:"", notes:"" });

  const qsString = useMemo(() => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    return qs.toString();
  }, [q]);

  async function load(next = {}) {
    const qParam = next.q ?? q;
    setLoading(true);

    const qs = new URLSearchParams();
    if (qParam) qs.set("q", qParam);

    const res = await fetch(`/clients/list${qs.toString() ? `?${qs}` : ""}`, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    setItems(Array.isArray(data?.data) ? data.data : []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  // helpers modal
  function startCreate(e){
    if(e) e.preventDefault();
    setMode("create");
    setEditingId(null);
    setForm({ name:"", email:"", phone:"", notes:"" });
    if (location.hash !== "#novo-cliente") location.hash = "#novo-cliente"; // abre modal
  }
  function startEdit(c, e){
    if(e) e.preventDefault();
    setMode("edit");
    setEditingId(c.id);
    setForm({
      name: c.name ?? "",
      email: c.email ?? "",
      phone: formatPhoneBR(c.phone ?? ""),
      notes: c.notes ?? "",
      is_system: !!c.is_system,
    });
    if (location.hash !== "#novo-cliente") location.hash = "#novo-cliente"; // abre modal
  }
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="home-wrap">
      <main className="container">
        <section className="panel" style={{marginTop:16}}>
          <div className="panel-head">
            <div className="title-row">
              <h1>Clientes</h1>
            </div>
          </div>

          {/* Toolbar de busca */}
          <div className="toolbar" aria-busy={loading}>
            <div className="toolbar__left">
              <input placeholder="Buscar por nome, e-mail ou telefone..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter' && load({ q })} style={{minWidth: 260}} aria-label="Buscar clientes"/>
              <button className="btn" onClick={() => load({ q })} disabled={loading}>Buscar</button>
              <button className="btn ghost" onClick={()=>{ setQ(""); load({ q:"" }); }} disabled={loading}>Limpar</button>
            </div>
            <div className="toolbar__right muted">
              <a href="#novo-cliente" className="btn primary" onClick={startCreate}>+ Cadastrar cliente</a>
              {/* {qsString && <span>Filtro: <code>{qsString}</code></span>} */}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Observações</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    <tr><td colSpan={6} className="muted">Carregando...</td></tr>
                    <tr><td colSpan={6} className="skeleton-row"></td></tr>
                    <tr><td colSpan={6} className="skeleton-row"></td></tr>
                  </>
                ) : items.length===0 ? (
                  <tr><td colSpan={6} className="muted">Nenhum registro.</td></tr>
                ) : items.map(c=>(
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td className="muted">{c.email || '-'}</td>
                    <td>{c.phone ? formatPhoneBR(c.phone) : '-'}</td>
                    <td>{c.notes || '-'}</td>
                    <td className="action">
                      <a className="link" href="#novo-cliente" onClick={(e) => startEdit(c, e)}>
                        <VscEdit style={{fontSize:20}}/> Editar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ======= Modal CSS-only (criar, editar e excluir) ======= */}
        <section id="novo-cliente" className="modal" aria-labelledby="titulo-modal" aria-modal="true" role="dialog">
          <a href="#" className="modal__overlay" aria-label="Fechar"></a>

          <div className="modal__panel">
            <a className="modal__close" href="#" aria-label="Fechar">✕</a>

            <h2 id="titulo-modal" className="modal__title">
              {mode === "edit" ? "Editar cliente" : "Adicionar cliente"}
            </h2>

            {/* Action dinâmica + method spoof quando editar */}
            <form method="post" action={mode === "edit" ? `/clients/${editingId}` : "/clients"}>
              <input type="hidden" name="_token" value={window.csrfToken}/>
              {mode === "edit" && <input type="hidden" name="_method" value="PUT" />}

              <div className="grid">
                <div className="field">
                  <label htmlFor="name">Nome</label>
                  <input id="name" name="name" type="text" placeholder="Ex.: Lucas Silva" required value={form.name} onChange={e=>setField("name", e.target.value)}/>
                </div>

                <div className="field half">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" placeholder="email@exemplo.com" value={form.email} onChange={e=>setField("email", e.target.value)}/>
                </div>

                <div className="field half">
                  <label htmlFor="phone">Telefone</label>
                  <input id="phone" name="phone" type="text" inputMode="tel" placeholder="(00) 00000-0000" value={form.phone} onChange={e=>setField("phone", formatPhoneBR(e.target.value))}/>
                </div>

                <div className="field">
                  <label htmlFor="notes">Observações</label>
                  <input id="notes" name="notes" type="text" placeholder="Anotações do cliente" value={form.notes} onChange={e=>setField("notes", e.target.value)}/>
                </div>
              </div>

              <div className="form__actions">
                {/* Form EXCLUIR aparece só em modo edição */}
                {mode === "edit" && !form.is_system && (
                  <button type="submit" className="btn danger" form="client-delete-form"
                          onClick={(e)=>{ if(!confirm("Tem certeza que deseja excluir este cliente?")) e.preventDefault(); }}>
                    <VscTrash style={{fontSize:20}}/> Excluir
                  </button>
                )}

                <a href="#" className="btn ghost">Cancelar</a>

                <button type="submit" className="btn primary">
                  <VscSave style={{fontSize:20}}/> {mode === "edit" ? "Salvar" : "Salvar"}
                </button>
              </div>
            </form>

            {/* FORM DE EXCLUSÃO */}
            {mode === "edit" && !form.is_system && (
              <form id="client-delete-form" method="post" action={`/clients/${editingId}`}>
                <input type="hidden" name="_token" value={window.csrfToken}/>
                <input type="hidden" name="_method" value="DELETE"/>
              </form>
            )}
          </div>
        </section>
        {/* ======= /Modal ======= */}
      </main>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<Clients />);
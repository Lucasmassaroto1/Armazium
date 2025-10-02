import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "../css/home.css";
import "../css/produtoModal.css";
import { VscEdit, VscTrash, VscSave } from "react-icons/vsc";

const cx = (...c) => c.filter(Boolean).join(" ");

function formatPhoneBR(v) {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

/* ---------- Componentes puros ---------- */
const Toolbar = React.memo(function Toolbar({ q, setQ, loading, onSearch, onClear, onCreate }) {
  const onKeyDown = useCallback((e) =>{
    if(e.key === "Enter") onSearch();
  }, [onSearch]);

  return (
    <div className="toolbar" aria-busy={loading}>
      <div className="toolbar__left">
        <input placeholder="Buscar por nome, e-mail ou telefone..." value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown} style={{ minWidth: 260 }} aria-label="Buscar clientes"/>
        <button className="btn" onClick={onSearch} disabled={loading}>Buscar</button>
        <button className="btn ghost" onClick={onClear} disabled={loading}>Limpar</button>
      </div>
      <div className="toolbar__right muted">
        <a href="#novo-cliente" className="btn primary" onClick={onCreate}>+ Cadastrar cliente</a>
      </div>
    </div>
  );
});

const Row = React.memo(function Row({ c, onEdit }) {
  return (
    <tr>
      <td>{c.id}</td>
      <td>{c.name}</td>
      <td className="muted">{c.email || "-"}</td>
      <td>{c.phone ? formatPhoneBR(c.phone) : "-"}</td>
      <td>{c.notes || "-"}</td>
      <td className="action"><a className="link" href="#novo-cliente" onClick={(e) => onEdit(c, e)}><VscEdit size={20}/> Editar</a></td>
    </tr>
  );
});

const Table = React.memo(function Table({ loading, items, onEdit }) {
  return (
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
          ) : items.length === 0 ? (
            <tr><td colSpan={6} className="muted">Nenhum registro.</td></tr>
          ) : (
            items.map((c) => <Row key={c.id} c={c} onEdit={onEdit} />)
          )}
        </tbody>
      </table>
    </div>
  );
});

/* ---------- Página ---------- */
function Clients() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  // cache simples por chave q
  const cacheRef = useRef(new Map());
  // controller para abortar busca anterior
  const ctrlRef = useRef(null);

  const qsString = useMemo(() => {
    const qs = new URLSearchParams();
    if(q) qs.set("q", q);
    return qs.toString();
  }, [q]);

  const fetchList = useCallback(async (params = {}) => {
    const qParam = params.q ?? q;
    const key = qParam || ""; // chave de cache

    // cache hit
    if(cacheRef.current.has(key)){
      setItems(cacheRef.current.get(key));
      return;
    }

    // aborta requisição anterior, se houver
    if(ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setLoading(true);
    try{
      const qs = new URLSearchParams();
      if(qParam) qs.set("q", qParam);

      const res = await fetch(`/clients/list${qs.toString() ? `?${qs}` : ""}`, {
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : [];
      cacheRef.current.set(key, list);
      setItems(list);
    }catch(err){
      if(err?.name !== "AbortError"){
        console.log("Clients load error:", err);
        setItems([]);
      }
    }finally{
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // helpers modal
  const startCreate = useCallback((e) => {
    if(e) e.preventDefault();
    setMode("create");
    setEditingId(null);
    setForm({ name: "", email: "", phone: "", notes: "" });
    if(location.hash !== "#novo-cliente") location.hash = "#novo-cliente";
  }, []);

  const startEdit = useCallback((c, e) => {
    if (e) e.preventDefault();
    setMode("edit");
    setEditingId(c.id);
    setForm({
      name: c.name ?? "",
      email: c.email ?? "",
      phone: formatPhoneBR(c.phone ?? ""),
      notes: c.notes ?? "",
      is_system: !!c.is_system,
    });
    if(location.hash !== "#novo-cliente") location.hash = "#novo-cliente";
  }, []);

  const setField = useCallback((k, v) => setForm((prev) => ({ ...prev, [k]: v })), []);
  const onFieldChange = useCallback((k) => (e) => setField(k, e.target.value), [setField]);

  const onSearch = useCallback(() => { fetchList({ q }); }, [fetchList, q]);
  const onClear = useCallback(() => { setQ(""); fetchList({ q: "" }); }, [fetchList]);

  return (
    <div className="home-wrap">
      <main className="container">
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-head">
            <div className="title-row">
              <h1>Clientes</h1>
            </div>
          </div>

          <Toolbar q={q} setQ={setQ} loading={loading} onSearch={onSearch} onClear={onClear} onCreate={startCreate}/>

          {/* {qsString && <span>Filtro: <code>{qsString}</code></span>} */}

          <Table loading={loading} items={items} onEdit={startEdit} />

          {/* ======= Modal CSS-only (criar, editar e excluir) ======= */}
          <section id="novo-cliente" className="modal" aria-labelledby="titulo-modal" aria-modal="true" role="dialog">
            <a href="#" className="modal__overlay" aria-label="Fechar"></a>

            <div className="modal__panel">
              <a className="modal__close" href="#" aria-label="Fechar">✕</a>

              <h2 id="titulo-modal" className="modal__title">
                {mode === "edit" ? "Editar cliente" : "Adicionar cliente"}
              </h2>

              <form method="post" action={mode === "edit" ? `/clients/${editingId}` : "/clients"}>
                <input type="hidden" name="_token" value={window.csrfToken} />
                {mode === "edit" && <input type="hidden" name="_method" value="PUT" />}

                <div className="grid">
                  <div className="field">
                    <label htmlFor="name">Nome</label>
                    <input id="name" name="name" type="text" placeholder="Ex.: Lucas Silva" required value={form.name} onChange={onFieldChange("name")} disabled={form.is_system}/>
                  </div>

                  <div className="field half">
                    <label htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" placeholder="email@exemplo.com" value={form.email} onChange={onFieldChange("email")} disabled={form.is_system}/>
                  </div>

                  <div className="field half">
                    <label htmlFor="phone">Telefone</label>
                    <input id="phone" name="phone" type="text" inputMode="tel" placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setField("phone", formatPhoneBR(e.target.value))} disabled={form.is_system}/>
                  </div>

                  <div className="field">
                    <label htmlFor="notes">Observações</label>
                    <input id="notes" name="notes" type="text" placeholder="Anotações do cliente" value={form.notes} onChange={onFieldChange("notes")}/>
                  </div>
                </div>

                <div className="form__actions">
                  {mode === "edit" && !form.is_system && (
                    <button type="submit" className="btn danger" form="client-delete-form" onClick={(e) => { if (!confirm("Tem certeza que deseja excluir este cliente?")) e.preventDefault(); }}><VscTrash size={20} /> Excluir</button>
                  )}

                  <a href="#" className="btn ghost">Cancelar</a>

                  <button type="submit" className="btn primary"><VscSave size={20}/> {mode === "edit" ? "Salvar" : "Salvar"}</button>
                </div>
              </form>

              {mode === "edit" && !form.is_system && (
                <form id="client-delete-form" method="post" action={`/clients/${editingId}`}>
                  <input type="hidden" name="_token" value={window.csrfToken} />
                  <input type="hidden" name="_method" value="DELETE" />
                </form>
              )}
            </div>
          </section>
          {/* ======= /Modal ======= */}
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("app")).render(<Clients />);
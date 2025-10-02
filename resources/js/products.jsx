import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import "../css/home.css";
import { VscEdit, VscTrash, VscSave, VscSearch } from "react-icons/vsc";
import Modal from "../js/components/Modal.jsx";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const cx = (...c) => c.filter(Boolean).join(" ");

const Toolbar = React.memo(function Toolbar({
  q, setQ, loading, low, onSearch, onClear, onToggleLow, onCreate,
}) {
  const onKeyDown = useCallback((e) => { if(e.key === "Enter") onSearch(); }, [onSearch]);
  return(
    <div className="toolbar" aria-busy={loading}>
      <div className="toolbar__left">
        <input placeholder="Buscar por nome ou SKU..." value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown} aria-label="Buscar por nome ou SKU"/>
        <button className="btn" onClick={onSearch} disabled={loading} title="Buscar"><VscSearch size={20} /> Buscar</button>
        <button className="btn ghost" onClick={onClear} disabled={loading} title="Limpar busca">Limpar</button>
        <button className={cx("btn", low === 1 && "secondary")} onClick={onToggleLow} aria-pressed={low === 1} title={low === 1 ? "Mostrando apenas baixo estoque" : "Mostrar apenas baixo estoque"} disabled={loading}>{low === 1 ? "Ver todos" : "Estoque baixo"}</button>
      </div>
      <div className="toolbar__right muted">
        <div className="actions">
          <a href="#novo-produto" className="btn primary" onClick={onCreate}>+ Cadastrar produto</a>
        </div>
      </div>
    </div>
  );
});

const Row = React.memo(function Row({ p, onEdit }) {
  const isLow = Number(p.stock) < Number(p.min_stock);
  return (
    <tr className={isLow ? "row-low" : ""} data-low={isLow ? "1" : "0"} title={isLow ? "Produto com baixo estoque" : undefined}>
      <td>{p.id}</td>
      <td>{p.name} {isLow && <span className="chip chip--low" title="Baixo estoque">Baixo</span>}</td>
      <td className="muted">{p.sku}</td>
      <td>{p.category || "-"}</td>
      <td className="right">{p.stock}</td>
      <td className="right">{p.min_stock}</td>
      <td className="right">{p.sale_price != null ? BRL.format(Number(p.sale_price)) : "-"}</td>
      <td className="action"><a className="link" href="#novo-produto" onClick={(e) => onEdit(p, e)}><VscEdit size={20}/> Editar</a></td>
    </tr>
  );
});

const Table = React.memo(function Table({ loading, items, onEdit }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th><th>Produto</th><th>SKU</th><th>Categoria</th>
            <th className="right">Estoque</th><th className="right">Mínimo</th>
            <th className="right">Preço</th><th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <>
              <tr><td colSpan={8} className="muted">Carregando...</td></tr>
              <tr><td colSpan={8} className="skeleton-row"></td></tr>
              <tr><td colSpan={8} className="skeleton-row"></td></tr>
            </>
          ) : items.length === 0 ? (
            <tr><td colSpan={8} className="muted">Nenhum registro.</td></tr>
          ) : items.map((p) => <Row key={p.id} p={p} onEdit={onEdit} />)}
        </tbody>
      </table>
    </div>
  );
});

function Products() {
  const [q, setQ] = useState("");
  const [low, setLow] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", category: "", stock: "", min_stock: "", sale_price: "" });

  const cacheRef = useRef(new Map());
  const ctrlRef = useRef(null);

  const qsString = useMemo(() => {
    const qs = new URLSearchParams(); if(q) qs.set("q", q); if(low) qs.set("low", String(low)); return qs.toString();
  }, [q, low]);

  const setField = useCallback((key, val) => setForm((prev) => ({ ...prev, [key]: val })), []);
  const onFieldChange = useCallback((key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })), []);

  const fetchList = useCallback(async (params = {}) => {
    const qParam = params.q ?? q; const lowParam = params.low ?? low; const key = `${qParam}|${lowParam}`;
    if(cacheRef.current.has(key)){ setItems(cacheRef.current.get(key)); return; }
    if(ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController(); ctrlRef.current = ctrl;
    setLoading(true);
    try{
      const qs = new URLSearchParams(); if(qParam) qs.set("q", qParam); if(lowParam) qs.set("low", String(lowParam));
      const res = await fetch(`/products/list${qs.toString() ? `?${qs}` : ""}`, { headers: { Accept: "application/json" }, signal: ctrl.signal });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : [];
      cacheRef.current.set(key, list); setItems(list);
    }catch(err){
      if(err?.name !== "AbortError"){ console.log("Products load error:", err); setItems([]); }
    }finally{ setLoading(false); }
  }, [q, low]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const onToggleLow = useCallback(() => { const next = low === 1 ? 0 : 1; setLow(next); setQ(""); fetchList({ low: next, q: "" }); }, [low, fetchList]);
  const onSearch = useCallback(() => { fetchList({ q }); }, [fetchList, q]);
  const onClear = useCallback(() => { setQ(""); fetchList({ q: "" }); }, [fetchList]);

  const startCreate = useCallback((e) => {
    if(e) e.preventDefault();
    setMode("create"); setEditingId(null);
    setForm({ name: "", sku: "", category: "", stock: "", min_stock: "", sale_price: "" });
    if(location.hash !== "#novo-produto") location.hash = "#novo-produto";
  }, []);

  const startEdit = useCallback((p, e) => {
    if(e) e.preventDefault();
    setMode("edit"); setEditingId(p.id);
    setForm({
      name: p.name ?? "", sku: p.sku ?? "", category: p.category ?? "",
      stock: String(p.stock ?? ""), min_stock: String(p.min_stock ?? ""),
      sale_price: p.sale_price != null ? String(p.sale_price) : "",
    });
    if(location.hash !== "#novo-produto") location.hash = "#novo-produto";
  }, []);

  useEffect(() => {
    const onHash = () => {};
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="home-wrap">
      <main className="container">
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-head"><div className="title-row"><h1>Produtos</h1></div></div>

          <Toolbar q={q} setQ={setQ} loading={loading} low={low} onSearch={onSearch} onClear={onClear} onToggleLow={onToggleLow} onCreate={startCreate}/>
          <Table loading={loading} items={items} onEdit={startEdit}/>

          {/* ======= Modal unificado ======= */}
          <Modal id="novo-produto" title={mode === "edit" ? "Editar produto" : "Adicionar produto"}>
            <form method="post" action={mode === "edit" ? `/products/${editingId}` : "/products"}>
              <input type="hidden" name="_token" value={window.csrfToken}/>
              {mode === "edit" && <input type="hidden" name="_method" value="PUT"/>}

              <div className="grid">
                <div className="field" style={{ gridColumn: "span 12" }}>
                  <label htmlFor="produto">Produto</label>
                  <input id="produto" name="name" type="text" placeholder="Ex.: Teclado Mecânico RGB" value={form.name} onChange={onFieldChange("name")} required/>
                </div>

                <div className="field half">
                  <label htmlFor="sku">SKU</label>
                  <input id="sku" name="sku" type="text" placeholder="Ex.: TEC-RGB-87" value={form.sku} onChange={onFieldChange("sku")} required/>
                </div>

                <div className="field half">
                  <label htmlFor="categoria">Categoria</label>
                  <select id="categoria" name="category" value={form.category} onChange={onFieldChange("category")} required>
                    <option value="" disabled>Selecione...</option>
                    <option>Periféricos</option>
                    <option>Hardware</option>
                    <option>Acessórios</option>
                    <option>Outros</option>
                  </select>
                </div>

                <div className="field third">
                  <label htmlFor="estoque">Estoque</label>
                  <input id="estoque" name="stock" type="number" min="0" step="1" placeholder="0" value={form.stock} onChange={onFieldChange("stock")} required/>
                </div>

                <div className="field third">
                  <label htmlFor="minimo">Mínimo</label>
                  <input id="minimo" name="min_stock" type="number" min="0" step="1" placeholder="5" value={form.min_stock} onChange={onFieldChange("min_stock")} required/>
                </div>

                <div className="field third">
                  <label htmlFor="preco">Preço</label>
                  <input id="preco" name="sale_price" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0,00" value={form.sale_price} onChange={onFieldChange("sale_price")} required/>
                </div>
              </div>

              <div className="form__actions">
                {mode === "edit" && (
                  <button type="submit" className="btn danger" form="product-delete-form" onClick={(e) => { if (!confirm("Tem certeza que deseja excluir este produto?")) e.preventDefault(); }} title="Excluir produto">
                    <VscTrash size={20} /> Excluir
                  </button>
                )}

                <a href="#" className="btn ghost">Cancelar</a>
                <button type="submit" className="btn primary"><VscSave size={20}/> {mode === "edit" ? "Salvar alterações" : "Salvar"}</button>
              </div>
            </form>

            {mode === "edit" && !form.is_system && (
              <form id="product-delete-form" method="post" action={`/products/${editingId}`}>
                <input type="hidden" name="_token" value={window.csrfToken}/>
                <input type="hidden" name="_method" value="DELETE"/>
              </form>
            )}
          </Modal>
          {/* ======= /modal ======= */}
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("app")).render(<Products />);
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import '../css/home.css';
import '../css/produtoModal.css';
import { VscEdit, VscTrash, VscSave, VscSearch  } from "react-icons/vsc"; // Edit && Trash && Save && Search

function Products(){
  const [q, setQ] = useState("");
  const [low, setLow] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----- estado do modal (create/edit) -----
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "", sku: "", category: "",
    stock: "", min_stock: "", sale_price: "",
  });

  async function load(next = {}) {
    const qParam   = next.q   ?? q;
    const lowParam = next.low ?? low;

    setLoading(true);
    const qs = new URLSearchParams();
    if (qParam) qs.set("q", qParam);
    if (lowParam) qs.set("low", String(lowParam));

    const res = await fetch(`/products/list${qs.toString() ? `?${qs}` : ""}`, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    setItems(Array.isArray(data?.data) ? data.data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function toggleLow(){
    const next = low === 1 ? 0 : 1;
    setLow(next);
    setQ("");
    load({ low: next, q: "" });
  }

  // ---- abrir modal para criar ----
  function startCreate(){
    setMode("create");
    setEditingId(null);
    setForm({
      name: "", sku: "", category: "",
      stock: "", min_stock: "", sale_price: "",
    });
  }

  // ---- abrir modal para editar ----
  function startEdit(p){
    setMode("edit");
    setEditingId(p.id);
    setForm({
      name: p.name ?? "",
      sku: p.sku ?? "",
      category: p.category ?? "",
      stock: String(p.stock ?? ""),
      min_stock: String(p.min_stock ?? ""),
      sale_price: p.sale_price != null ? String(p.sale_price) : "",
    });
  }

  // helper pra atualizar inputs controlados
  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  return (
    <div className="home-wrap">
      <main className="container">
        <section className="panel" style={{marginTop:16}}>
          <div className="panel-head">
            <div className="title-row">
              <h1>Produtos</h1>
              <div style={{marginTop:12, display:'flex', gap:8}}>
                <input placeholder="Buscar por nome ou SKU..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter' && load({q})}/>
                <button className="btn" onClick={() => load({ q })}><VscSearch style={{fontSize:24}}/> Buscar</button>
                <button className="btn" onClick={toggleLow} aria-pressed={low === 1} title={low === 1 ? "Mostrando apenas baixo estoque" : "Mostrar apenas baixo estoque"}>{low === 1 ? "Ver todos" : "Estoque Baixo"}</button>
              </div>
            </div>
            <div className="actions">
              <a href="#novo-produto" className="btn primary" onClick={startCreate}>
                + Cadastrar produto
              </a>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Produto</th><th>SKU</th><th>Categoria</th>
                  <th className="right">Estoque</th><th className="right">Mínimo</th><th className="right">Preço</th><th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="muted">Carregando...</td></tr>
                ) : items.length===0 ? (
                  <tr><td colSpan="7" className="muted">Nenhum registro.</td></tr>
                ) : items.map(p=>{
                const isLow = Number(p.stock) <= Number(p.min_stock);
                  return (
                    <tr key={p.id} className={isLow ? "row-low" : ""} data-low={isLow ? "1" : "0"} title={isLow ? "Produto com baixo estoque" : undefined}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td className="muted">{p.sku}</td>
                      <td>{p.category || '-'}</td>
                      <td className="right">{p.stock}</td>
                      <td className="right">{p.min_stock}</td>
                      <td className="right">
                        {p.sale_price ? `R$ ${p.sale_price.toFixed(2).replace('.',',')}` : '-'}
                      </td>
                      <td className="action">
                        <a className="link" href="#novo-produto" onClick={() => startEdit(p)}><VscEdit style={{fontSize:24}}/>Editar</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ======= Modal CSS-only (criar, editar e excluir) ======= */}
        <section id="novo-produto" className="modal" aria-labelledby="titulo-modal" aria-modal="true" role="dialog">
          <a href="#" className="modal__overlay" aria-label="Fechar"></a>

          <div className="modal__panel">
            <a className="modal__close" href="#" aria-label="Fechar">✕</a>

            <h2 id="titulo-modal" className="modal__title">
              {mode === "edit" ? "Editar produto" : "Adicionar produto"}
            </h2>
            
            {/* Action dinâmica + method spoof quando editar */}
            <form method="post" action={mode === "edit" ? `/products/${editingId}` : "/products"}>
            <input type="hidden" name="_token" value={window.csrfToken}/>
            {mode === "edit" && <input type="hidden" name="_method" value="PUT"/>}

              <div className="grid">
                <div className="field" style={{ gridColumn: "span 12" }}>
                  <label htmlFor="produto">Produto</label>
                  <input id="produto" name="name" type="text" placeholder="Ex.: Teclado Mecânico RGB" value={form.name} onChange={e=>setField("name", e.target.value)} required/>
                </div>

                <div className="field half">
                  <label htmlFor="sku">SKU</label>
                  <input id="sku" name="sku" type="text" placeholder="Ex.: TEC-RGB-87" value={form.sku} onChange={e=>setField("sku", e.target.value)} required/>
                </div>
                <div className="field half">
                  <label htmlFor="categoria">Categoria</label>
                  <select id="categoria" name="category" value={form.category} onChange={e=>setField("category", e.target.value)} required > {/* defaultValue="" */}
                    <option value="" disabled>
                      Selecione...
                    </option>
                    <option>Periféricos</option>
                    <option>Hardware</option>
                    <option>Acessórios</option>
                    <option>Outros</option>
                  </select>
                </div>

                <div className="field third">
                  <label htmlFor="estoque">Estoque</label>
                  <input id="estoque" name="stock" type="number" min="0" step="1" placeholder="0" value={form.stock} onChange={e=>setField("stock", e.target.value)} required/>
                </div>
                <div className="field third">
                  <label htmlFor="minimo">Mínimo</label>
                  <input id="minimo" name="min_stock" type="number" min="0" step="1" placeholder="5" value={form.min_stock} onChange={e=>setField("min_stock", e.target.value)} required/>
                </div>
                <div className="field third">
                  <label htmlFor="preco">Preço</label>
                  <input id="preco" name="sale_price" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0,00" value={form.sale_price} onChange={e=>setField("sale_price", e.target.value)} required/>
                </div>
              </div>

              <div className="form__actions">
                {/* Form EXCLUIR aparece só em modo edição */}
                {mode === "edit" && (
                  <button type="submit" className="btn danger" form="product-delete-form" onClick={(e)=>{ if(!confirm("Tem certeza que deseja excluir este produto?")) e.preventDefault(); }}><VscTrash style={{fontSize:24}}/></button>
                )}

                <a href="#" className="btn">Cancelar</a>
                <button type="submit" className="btn primary">
                  <VscSave style={{fontSize:24}}/> {mode === "edit" ? "Salvar alterações" : "Salvar"}
                </button>
              </div>
            </form>
            {/* FORM DE EXCLUSÃO */}
            {mode === "edit" && !form.is_system && (
              <form id="product-delete-form" method="post" action={`/products/${editingId}`}>
                <input type="hidden" name="_token" value={window.csrfToken}/>
                <input type="hidden" name="_method" value="DELETE"/>
              </form>
            )}
          </div>
        </section>
        {/* ======= /modal ======= */}
      </main>
    </div>
  );
}

createRoot(document.getElementById("app")).render(<Products />);
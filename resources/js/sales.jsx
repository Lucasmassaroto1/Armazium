import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import '../css/home.css';
import '../css/produtoModal.css';

function Sales(){
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [paidTotal, setPaidTotal] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // ===== modal state =====
  const [mode, setMode] = useState("create"); // "create" | "show"

  // create
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("open");
  const [soldAt, setSoldAt] = useState(new Date().toISOString().slice(0,10));
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState([{ product_id: "", qty: "1", unit_price: "" }]);

  const STATUS_PT ={
    open: "Pendente",
    paid: "Pago",
    canceled: "Cancelado",
  };

  // show (detalhes)
  const [viewSale, setViewSale] = useState(null); // {id, client, status, sold_at, total}
  const [viewItems, setViewItems] = useState([]); // itens da venda

  async function load(){
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/sales/list?date=${encodeURIComponent(date)}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
      setPaidTotal(Number(data?.meta?.paid_total ?? 0));
      setShowAll(false);
    } catch(e) {
      setErr("Não foi possível carregar as vendas.");
      setRows([]);
      setPaidTotal(0);
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function exibitudo(){
    setLoading(true);
    setErr("");
    try{
      const res = await fetch(`/sales/list?all=1`, { headers: { Accept:'application/json' }});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
      setPaidTotal(Number(data?.meta?.paid_total ?? 0));
      setShowAll(true); // modo "tudo"
    }catch(e){
      console.log(e);
      setErr("Não foi possível carregar todas as vendas.");
      setRows([]);
      setPaidTotal(0);
    }finally{
      setLoading(false);
    }
  }

  async function loadOptions() {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`/clients/list?per_page=1000`,  { headers: { Accept: "application/json" } }),
        fetch(`/products/list?per_page=1000`, { headers: { Accept: "application/json" } }),
      ]);
      const cJson = await cRes.json();
      const pJson = await pRes.json();
      setClients(Array.isArray(cJson?.data) ? cJson.data : []);
      setProducts(Array.isArray(pJson?.data) ? pJson.data : []);
    } catch (e) {
      console.log("Erro ao carregar opções:", e);
    }
  }

  useEffect(() => { load(); }, []);
  const totalDia = rows
    .filter(s => s.status === "paid")
    .reduce((acc, s) => acc + (s.total || 0), 0);

  // ===== abrir modal: criar =====
  function openModalNovaVenda(){
    setMode("create");
    setClientId("");
    setStatus("open");
    setSoldAt(new Date().toISOString().slice(0,10));
    setItems([{ product_id:"", qty:"1", unit_price:"" }]);
    loadOptions();
  }

  // ===== abrir modal: detalhes =====
  async function openModalDetalhes(id){
    try {
      setMode("show");
      setViewSale(null);
      setViewItems([]);
      const res = await fetch(`/sales/${id}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setViewSale(json?.data ?? null);
      setViewItems(Array.isArray(json?.data?.items) ? json.data.items : []);
    } catch (e) {
      console.log("Erro ao carregar detalhes da venda:", e);
      setViewSale(null);
      setViewItems([]);
    }
  }

  // helpers (create)
  function setItem(index, key, value){
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [key]: value } : it));
  }
  function addItem(){ setItems(prev => [...prev, { product_id:"", qty:"1", unit_price:"" }]); }
  function removeItem(index){ setItems(prev => prev.filter((_, i) => i !== index)); }
  function onChangeProduct(index, productId){
    setItem(index, "product_id", productId);
    const p = products.find(pp => String(pp.id) === String(productId));
    if (p && p.sale_price != null) setItem(index, "unit_price", String(p.sale_price));
  }

  return (
    <div className="home-wrap">
      <main className="container">
        <section className="panel">
          <div className="panel-head">
            <div className="title-row">
              <h1>Vendas</h1>
              <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
                <button className="btn" onClick={load}>Filtrar</button>
                <button className="btn" onClick={exibitudo}>Exibir tudo</button>
              </div>
            </div>
            <div className="badge">Total pago do dia: R$ {totalDia.toFixed(2).replace('.',',')}</div>
            <a className="btn" href="#sale-modal" onClick={openModalNovaVenda}>+ Nova venda</a>
          </div>

          {err && <div className="alert" style={{margin:'8px 16px 0'}}>{err}</div>}

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="muted">Carregando...</td></tr>
                ) : rows.length===0 ? (
                  <tr><td colSpan="6" className="muted">Nenhuma venda.</td></tr>
                ) : rows.map(s=>(
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td>{s.client}</td>
                    <td>R$ {s.total.toFixed(2).replace('.',',')}</td>
                    <td>{STATUS_PT[s.status] ?? s.status}</td>
                    <td className="muted">{s.created_at}</td>
                    <td className="action"><a className="link" href="#sale-modal" onClick={()=>openModalDetalhes(s.id)}>Ver detalhes</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ======= Modal CSS-only (criar e detalhes) ======= */}
        <section id="sale-modal" className="modal" aria-labelledby="titulo-venda" aria-modal="true" role="dialog">
          <a href="#" className="modal__overlay" aria-label="Fechar"></a>

          <div className="modal__panel">
            <a className="modal__close" href="#" aria-label="Fechar">✕</a>

            {mode === "create" ? (
              <>
                <h2 id="titulo-venda" className="modal__title">Nova venda</h2>
                <p className="modal__desc">O estoque fará a baixa dos produtos se a venda estiver como <b>Pago</b>.</p>

                <form method="post" action="/sales">
                  <input type="hidden" name="_token" value={window.csrfToken} />

                  <div className="grid">
                    <div className="field half">
                      <label htmlFor="sold_at">Data da venda</label>
                      <input id="sold_at" name="sold_at" type="date" value={soldAt} onChange={e=>setSoldAt(e.target.value)} required/>
                    </div>

                    <div className="field half">
                      <label htmlFor="status">Status</label>
                      <select id="status" name="status" value={status} onChange={e=>setStatus(e.target.value)}>
                        <option value="open">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="canceled">Cancelado</option>
                      </select>
                    </div>

                    <div className="field" style={{ gridColumn: "span 12" }}>
                      <label htmlFor="client_id">Cliente</label>
                      <select id="client_id" name="client_id" required value={clientId} onChange={e=>setClientId(e.target.value)}>
                        <option value="" disabled>Selecione...</option>
                        {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>

                    <div className="field" style={{ gridColumn: "span 12" }}>
                      <label>Itens</label>
                      <div className="table-wrap" style={{maxHeight:280, overflow:'auto'}}>
                        <table>
                          <thead>
                            <tr>
                              <th style={{width:'45%'}}>Produto</th>
                              <th style={{width:'15%'}}>Qtd</th>
                              <th style={{width:'20%'}}>Preço unit.</th>
                              <th style={{width:'20%'}}>Subtotal</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it, idx) => {
                              const p = products.find(pp => String(pp.id) === String(it.product_id));
                              const unit = parseFloat(it.unit_price || (p?.sale_price ?? 0)) || 0;
                              const qty  = parseInt(it.qty || "0", 10) || 0;
                              const subtotal = unit * qty;

                              return (
                                <tr key={idx}>
                                  <td>
                                    <select name={`items[${idx}][product_id]`} required value={it.product_id} onChange={e=>onChangeProduct(idx, e.target.value)}>
                                      <option value="" disabled>Selecione...</option>
                                      {products.map(pp => (
                                        <option key={pp.id} value={pp.id}>{pp.name} (SKU: {pp.sku})</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    <input type="number" min="1" step="1" name={`items[${idx}][qty]`} value={it.qty} onChange={e=>setItem(idx, "qty", e.target.value)} required/>
                                  </td>
                                  <td>
                                    <input type="number" min="0" step="0.01" name={`items[${idx}][unit_price]`} value={it.unit_price} onChange={e=>setItem(idx, "unit_price", e.target.value)} placeholder={p?.sale_price != null ? String(p.sale_price) : "0,00"}/>
                                  </td>
                                  <td className="right">R$ {subtotal.toFixed(2).replace('.',',')}</td>
                                  <td className="action">
                                    {items.length > 1 && (
                                      <button type="button" className="btn danger" onClick={()=>removeItem(idx)}>Remover</button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div style={{marginTop:8}}>
                        <button type="button" className="btn" onClick={addItem}>+ Adicionar item</button>
                      </div>
                    </div>
                  </div>

                  <div className="form__actions">
                    <a href="#" className="btn">Cancelar</a>
                    <button type="submit" className="btn primary">Salvar venda</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="modal__title">Detalhes da venda #{viewSale?.id ?? ""}</h2>
                <p className="modal__desc">Cliente: <b>{viewSale?.client ?? "-"}</b> &nbsp;•&nbsp; Status: <b>{viewSale?.status}</b> &nbsp;•&nbsp; Data: <b>{viewSale?.sold_at}</b></p>

                {/* Form para mudar o status */}
                {viewSale?.id && (
                  <form method="post" action={`/sales/${viewSale.id}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                    <input type="hidden" name="_token" value={window.csrfToken}/>
                    <input type="hidden" name="_method" value="PUT"/>
                    <label htmlFor="new_status" style={{ fontWeight: 600 }}>status:</label>
                    <select id="new_status" name="status" defaultValue={viewSale.status} style={{ width: 120 }}>
                      <option value="open">Pendente</option>
                      <option value="paid">Pago</option>
                      <option value="canceled">Cancelado</option>
                    </select>
                    <button type="submit" className="btn primary">
                      Atualizar status
                    </button>
                  </form>
                )}

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>SKU</th>
                        <th className="right">Qtd</th>
                        <th className="right">Preço unit.</th>
                        <th className="right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewItems.length === 0 ? (
                        <tr><td colSpan="5" className="muted">Sem itens.</td></tr>
                      ) : viewItems.map((it, i) => (
                        <tr key={i}>
                          <td>{it.product}</td>
                          <td className="muted">{it.sku}</td>
                          <td className="right">{it.qty}</td>
                          <td className="right">R$ {Number(it.unit_price).toFixed(2).replace('.',',')}</td>
                          <td className="right">R$ {Number(it.subtotal).toFixed(2).replace('.',',')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="right"><b>Total</b></td>
                        <td className="right"><b>R$ {Number(viewSale?.total || 0).toFixed(2).replace('.',',')}</b></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="form__actions">
                  {/* Excluir venda */}
                  {viewSale?.id && (
                    <form method="post" action={`/sales/${viewSale.id}`} onSubmit={(e)=>{ if(!confirm("Tem certeza que deseja excluir esta venda?")) e.preventDefault(); }}>
                      <input type="hidden" name="_token" value={window.csrfToken}/>
                      <input type="hidden" name="_method" value="DELETE"/>
                      <button type="submit" className="btn danger">Excluir</button>
                    </form>
                  )}
                  <a href="#" className="btn">Fechar</a>
                </div>
              </>
            )}
          </div>
        </section>
        {/* ======= /modal ======= */}
      </main>
    </div>
  );
}

createRoot(document.getElementById('app')).render(<Sales />);

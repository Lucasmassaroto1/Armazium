import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../css/home.css";
import "../css/produtoModal.css";
import { VscSave, VscSync, VscEye } from "react-icons/vsc";  // Save && Sync && Eye

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

  // seleção cliente
  const [clientId, setClientId] = useState("");       // valor REAL enviado
  const [clientIdInput, setClientIdInput] = useState("");   // input de ID (texto)
  const [clientNameInput, setClientNameInput] = useState(""); // input de Nome

  // itens com inputs separados de produto
  const [items, setItems] = useState([
    { product_id: "", qty: "1", unit_price: "", productIdInput: "", productNameInput: "" }
  ]);

  const STATUS_PT ={
    open: "Pendente",
    paid: "Pago",
    canceled: "Cancelado",
  };

  // show (detalhes)
  const [viewSale, setViewSale] = useState(null);
  const [viewItems, setViewItems] = useState([]);

  // =================== carregamento ===================
  async function load(){
    setLoading(true);
    setErr("");
    try{
      const res = await fetch(`/sales/list?date=${encodeURIComponent(date)}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
      setPaidTotal(Number(data?.meta?.paid_total ?? 0));
      setShowAll(false);
    }catch(e){
      setErr("Não foi possível carregar as vendas.");
      setRows([]);
      setPaidTotal(0);
      console.log(e);
    }finally{
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
      setShowAll(true);
    }catch(e){
      console.log(e);
      setErr("Não foi possível carregar todas as vendas.");
      setRows([]);
      setPaidTotal(0);
    }finally{
      setLoading(false);
    }
  }

  async function loadOptions(){
    try{
      const [cRes, pRes] = await Promise.all([
        fetch(`/clients/list?per_page=1000`,  { headers: { Accept: "application/json" } }),
        fetch(`/products/list?per_page=1000`, { headers: { Accept: "application/json" } }),
      ]);
      const cJson = await cRes.json();
      const pJson = await pRes.json();
      setClients(Array.isArray(cJson?.data) ? cJson.data : []);
      setProducts(Array.isArray(pJson?.data) ? pJson.data : []);
    }catch (e){
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
    setStatus("open");
    setSoldAt(new Date().toISOString().slice(0,10));
    setClientId("");
    setClientIdInput("");
    setClientNameInput("");
    setItems([{ product_id:"", qty:"1", unit_price:"", productIdInput:"", productNameInput:"" }]);
    loadOptions();
  }

  // ===== abrir modal: detalhes =====
  async function openModalDetalhes(id){
    try{
      setMode("show");
      setViewSale(null);
      setViewItems([]);
      const res = await fetch(`/sales/${id}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setViewSale(json?.data ?? null);
      setViewItems(Array.isArray(json?.data?.items) ? json.data.items : []);
    }catch (e){
      console.log("Erro ao carregar detalhes da venda:", e);
      setViewSale(null);
      setViewItems([]);
    }
  }

  // =================== resolução Cliente ===================
  function setClientFromId(idStr){
    const id = String(idStr || "").trim();
    setClientIdInput(id);
    if(!id) { setClientId(""); setClientNameInput(""); return; }
    const c = clients.find(cc => String(cc.id) === id);
    if(c){
      setClientId(String(c.id));
      setClientNameInput(c.name || "");
    }
  }

  function setClientFromName(nameStr){
    const q = String(nameStr || "").trim().toLowerCase();
    setClientNameInput(nameStr);
    if(!q){ setClientId(""); setClientIdInput(""); return; }
    const c = clients.find(cc => (cc.name || "").toLowerCase() === q)
          || clients.find(cc => (cc.name || "").toLowerCase().includes(q));
    if(c){
      setClientId(String(c.id));
      setClientIdInput(String(c.id));
    }
  }

  // =================== resolução Produto ===================
  function setItem(index, key, value){
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [key]: value } : it));
  }
  function addItem(){ setItems(prev => [...prev, { product_id:"", qty:"1", unit_price:"", productIdInput:"", productNameInput:"" }]); }
  function removeItem(index){ setItems(prev => prev.filter((_, i) => i !== index)); }

  function setProductFromId(index, idStr){
    const id = String(idStr || "").trim();
    setItem(index, "productIdInput", id);
    if(!id){
      setItem(index, "product_id", "");
      setItem(index, "productNameInput", "");
      return;
    }
    const p = products.find(pp => String(pp.id) === id);
    if(p){
      setItem(index, "product_id", String(p.id));
      setItem(index, "productNameInput", p.name || "");
      if(p.sale_price != null && !items[index]?.unit_price){
        setItem(index, "unit_price", String(p.sale_price));
      }
    }
  }

  function setProductFromName(index, nameStr){
    const q = String(nameStr || "").trim().toLowerCase();
    setItem(index, "productNameInput", nameStr);
    if(!q){
      setItem(index, "product_id", "");
      setItem(index, "productIdInput", "");
      return;
    }
    const p = products.find(pp => (pp.name||"").toLowerCase() === q)
          || products.find(pp => (pp.name||"").toLowerCase().includes(q))
          || products.find(pp => (pp.sku||"").toLowerCase() === q)
          || products.find(pp => (pp.sku||"").toLowerCase().includes(q));
    if(p){
      setItem(index, "product_id", String(p.id));
      setItem(index, "productIdInput", String(p.id));
      if(p.sale_price != null && !items[index]?.unit_price){
        setItem(index, "unit_price", String(p.sale_price));
      }
    }
  }

  // seletor produto original (mantido para preencher preço + fallback)
  function onChangeProduct(index, productId){
    setItem(index, "product_id", productId);
    const p = products.find(pp => String(pp.id) === String(productId));
    if(p){
      setItem(index, "productIdInput", String(p.id));
      setItem(index, "productNameInput", p.name || "");
      if (p.sale_price != null) setItem(index, "unit_price", String(p.sale_price));
    }
  }

  return(
    <div className="home-wrap">
      <main className="container">
        <section className="panel">
          <div className="panel-head">
            <div className="title-row">
              <h1>Vendas</h1>
              <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
                <button className="btn" onClick={load}>Filtrar</button>
                <button className="btn" onClick={exibitudo} style={{width:200}}><VscEye style={{fontSize:24}}/> Ver tudo</button>
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

                    {/* ===== CLIENTE: inputs separados ===== */}
                    <div className="field" style={{ gridColumn: "span 12" }}>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:8}}>
                        <div>
                          <label htmlFor="client_id_input">Cliente (por ID)</label>
                          <input id="client_id_input" type="number" min="1" placeholder="Ex.: 1" value={clientIdInput} onChange={e=>setClientFromId(e.target.value)} onBlur={e=>setClientFromId(e.target.value)}/>
                        </div>
                        <div>
                          <label htmlFor="client_name_input">Cliente (por Nome)</label>
                          <input id="client_name_input" type="text" placeholder="Ex.: Consumidor" list="clients-name-list" value={clientNameInput} onChange={e=>setClientFromName(e.target.value)} onBlur={e=>setClientFromName(e.target.value)}/>
                          <datalist id="clients-name-list">
                            {clients.map(c => (
                              <option key={c.id} value={c.name}/>
                            ))}
                          </datalist>
                        </div>
                      </div>

                      {/* campo real que vai no POST */}
                      <select id="client_id" name="client_id" value={clientId} onChange={e=>setClientFromId(e.target.value)} style={{ display: "none" }} required>
                        <option value="" disabled>Selecione...</option>
                        {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>

                      <span className="helper">Preencha por ID <b>ou</b> por Nome. O sistema sincroniza automaticamente.</span>
                    </div>

                    {/* ===== ITENS ===== */}
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
                                    <div style={{display:'grid', gridTemplateColumns:'100px 1fr', gap:8}}>
                                      <input ype="number" min="1" placeholder="ID" value={it.productIdInput} onChange={e=>setProductFromId(idx, e.target.value)} onBlur={e=>setProductFromId(idx, e.target.value)}/>
                                      <div>
                                        <input type="text" placeholder="Nome ou SKU" list={`prod-name-list-${idx}`} value={it.productNameInput} onChange={e=>setProductFromName(idx, e.target.value)} onBlur={e=>setProductFromName(idx, e.target.value)}/>
                                        <datalist id={`prod-name-list-${idx}`}>
                                          {products.map(pp => (
                                            <option key={pp.id} value={pp.name} />
                                          ))}
                                        </datalist>
                                      </div>
                                    </div>

                                    {/* Select real que vai no POST (escondido) */}
                                    <select name={`items[${idx}][product_id]`} value={it.product_id} onChange={e=>onChangeProduct(idx, e.target.value)} required>
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
                    <button type="submit" className="btn primary"><VscSave style={{fontSize:24}}/> Salvar</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="modal__title">Detalhes da venda #{viewSale?.id ?? ""}</h2>
                <p className="modal__desc">Cliente: <b>{viewSale?.client ?? "-"}</b> &nbsp;•&nbsp; Status: <b>{viewSale?.status}</b> &nbsp;•&nbsp; Data: <b>{viewSale?.sold_at}</b></p>

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
                      <VscSync style={{fontSize:24}}/> Atualizar
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
                  {viewSale?.id && (
                    <form method="post" action={`/sales/${viewSale.id}`} onSubmit={(e)=>{ if(!confirm("Tem certeza que deseja excluir esta venda?")) e.preventDefault(); }}>
                      <input type="hidden" name="_token" value={window.csrfToken}/>
                      <input type="hidden" name="_method" value="DELETE"/>
                      <button type="submit" className="btn danger"><VscSave style={{fontSize:24}}/> Excluir</button>
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
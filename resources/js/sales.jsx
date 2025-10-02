import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import "../css/home.css";
import { VscSave, VscSync, VscEye } from "react-icons/vsc";
import Modal from "../js/components/Modal.jsx";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const STATUS_PT = { open: "Pendente", paid: "Pago", canceled: "Cancelado" };
const MAX_VISIBLE_ROWS = 400; // segurança para “Ver tudo”

const useDebouncedFn = (fn, delay = 180) => {
  const t = useRef();
  return useCallback((...args) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
};

const RowsTable = React.memo(function RowsTable({ loading, rows, onShow, capped, onShowMore }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>#</th><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th><th></th></tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6" className="muted">Carregando...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan="6" className="muted">Nenhuma venda.</td></tr>
          ) : (
            rows.map((s) => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td>{s.client}</td>
                <td>{BRL.format(Number(s.total || 0))}</td>
                <td><span className={`status status--${s.status}`}>{STATUS_PT[s.status] ?? s.status}</span></td>
                <td className="muted">{s.created_at}</td>
                <td className="action"><a className="link" href="#sale-modal" onClick={() => onShow(s.id)}><VscEye style={{ fontSize: 20 }}/> Detalhes</a></td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {capped && (
        <div style={{padding:"8px 12px", display:"flex", justifyContent:"center"}}>
          <button className="btn" onClick={onShowMore}>Mostrar mais</button>
        </div>
      )}
    </div>
  );
});

function Sales() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [allRows, setAllRows] = useState([]); // lista completa
  const [rows, setRows] = useState([]);       // fatia visível
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE_ROWS);

  // modal
  const [mode, setMode] = useState("create"); // "create" | "show"

  // opções (cacheadas)
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  // criação
  const [status, setStatus] = useState("open");
  const [soldAt, setSoldAt] = useState(new Date().toISOString().slice(0, 10));
  const [clientId, setClientId] = useState("");
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientNameInput, setClientNameInput] = useState("");
  const [items, setItems] = useState([
    { product_id: "", qty: "1", unit_price: "", productIdInput: "", productNameInput: "" },
  ]);

  // detalhes
  const [viewSale, setViewSale] = useState(null);
  const [viewItems, setViewItems] = useState([]);

  // controllers e caches
  const listCtrlRef = useRef(null);
  const detailCtrlRef = useRef(null);
  const optionsCtrlRef = useRef(null);
  const listCacheRef = useRef(new Map());// key: `${date}|${all}`
  const optionsCacheRef = useRef({ clients: null, products: null });

  // indexes O(1)
  const clientsById = useMemo(() => {
    const m = new Map(); for (const c of clients) m.set(String(c.id), c); return m;
  }, [clients]);
  const clientsByName = useMemo(() => {
    const m = new Map(); for (const c of clients) { const k = (c.name||"").trim().toLowerCase(); if (k) m.set(k, c); } return m;
  }, [clients]);
  const productsById = useMemo(() => {
    const m = new Map(); for (const p of products) m.set(String(p.id), p); return m;
  }, [products]);
  const productsIndex = useMemo(() => {
    const m = new Map();
    for(const p of products){
      const n = (p.name||"").trim().toLowerCase();
      const s = (p.sku||"").trim().toLowerCase();
      if(n) m.set(`n:${n}`, p);
      if(s) m.set(`s:${s}`, p);
    }
    return m;
  }, [products]);

  const totalDia = useMemo(() =>
    allRows.reduce((acc, s) => acc + (s.status === "paid" ? (s.total || 0) : 0), 0),
  [allRows]);

  const applyVisibleSlice = useCallback((full) => {
    setAllRows(full);
    setRows(full.slice(0, visibleCount));
  }, [visibleCount]);

  const onShowMore = useCallback(() => {
    setVisibleCount(c => {
      const next = c + MAX_VISIBLE_ROWS;
      setRows(allRows.slice(0, next));
      return next;
    });
  }, [allRows]);

  /* --------- LISTA --------- */
  const fetchList = useCallback(async (opts = {}) => {
    const _date = opts.date ?? date;
    const _all = opts.all ?? showAll;
    const key = `${_date}|${_all ? 1 : 0}`;

    // cache
    if(listCacheRef.current.has(key)){
      const cached = listCacheRef.current.get(key);
      setErr(""); setLoading(false); setVisibleCount(MAX_VISIBLE_ROWS);
      applyVisibleSlice(cached);
      return;
    }

    if(listCtrlRef.current) listCtrlRef.current.abort();
    const ctrl = new AbortController();
    listCtrlRef.current = ctrl;

    setLoading(true); setErr(""); setVisibleCount(MAX_VISIBLE_ROWS);
    try{
      const qs = _all ? "all=1" : `date=${encodeURIComponent(_date)}`;
      const res = await fetch(`/sales/list?${qs}`, { headers: { Accept: "application/json" }, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : [];
      listCacheRef.current.set(key, list);
      applyVisibleSlice(list);
    }catch(e){
      if(e?.name !== "AbortError"){
        console.log(e);
        setErr(_all ? "Não foi possível carregar todas as vendas." : "Não foi possível carregar as vendas.");
        setAllRows([]); setRows([]);
      }
    }finally{
      setLoading(false);
    }
  }, [date, showAll, applyVisibleSlice]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const onFilter = useCallback(() => {
    setShowAll(false);
    fetchList({ date, all: false });
  }, [date, fetchList]);

  const toggleAll = useCallback(() => {
    const next = !showAll;
    setShowAll(next);
    fetchList({ date, all: next });
  }, [showAll, date, fetchList]);

  /* --------- OPÇÕES --------- */
  const loadOptions = useCallback(async () => {
    if(optionsCacheRef.current.clients && optionsCacheRef.current.products){
      setClients(optionsCacheRef.current.clients);
      setProducts(optionsCacheRef.current.products);
      return;
    }
    if(optionsCtrlRef.current) optionsCtrlRef.current.abort();
    const ctrl = new AbortController(); optionsCtrlRef.current = ctrl;

    try{
      const [cRes, pRes] = await Promise.all([
        fetch(`/clients/list?per_page=1000`, { headers: { Accept: "application/json" }, signal: ctrl.signal }),
        fetch(`/products/list?per_page=1000`, { headers: { Accept: "application/json" }, signal: ctrl.signal }),
      ]);
      const [cJson, pJson] = await Promise.all([cRes.json(), pRes.json()]);
      const cData = Array.isArray(cJson?.data) ? cJson.data : [];
      const pData = Array.isArray(pJson?.data) ? pJson.data : [];
      optionsCacheRef.current.clients = cData;
      optionsCacheRef.current.products = pData;
      setClients(cData); setProducts(pData);
    }catch(e){
      if (e?.name !== "AbortError") console.log("Erro ao carregar opções:", e);
    }
  }, []);

  /* --------- MODAIS --------- */
  const openModalNovaVenda = useCallback(() => {
    setMode("create");
    setStatus("open");
    const today = new Date().toISOString().slice(0, 10);
    setSoldAt(today);
    setClientId(""); setClientIdInput(""); setClientNameInput("");
    setItems([{ product_id: "", qty: "1", unit_price: "", productIdInput: "", productNameInput: "" }]);
    loadOptions();
  }, [loadOptions]);

  const openModalDetalhes = useCallback(async (id) => {
    if(detailCtrlRef.current) detailCtrlRef.current.abort();
    const ctrl = new AbortController(); detailCtrlRef.current = ctrl;

    try{
      setMode("show"); setViewSale(null); setViewItems([]);
      const res = await fetch(`/sales/${id}`, { headers: { Accept: "application/json" }, signal: ctrl.signal });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const sale = json?.data ?? null;
      setViewSale(sale);
      setViewItems(Array.isArray(sale?.items) ? sale.items : []);
    }catch(e){
      if(e?.name !== "AbortError"){
        console.log("Erro ao carregar detalhes da venda:", e);
        setViewSale(null); setViewItems([]);
      }
    }
  }, []);

  /* --------- CLIENTE --------- */
  const _setClientFromId = useCallback((idStr) => {
    const id = String(idStr || "").trim();
    setClientIdInput(id);
    if(!id) { setClientId(""); setClientNameInput(""); return; }
    const c = clientsById.get(id);
    if(c) { setClientId(String(c.id)); setClientNameInput(c.name || ""); }
  }, [clientsById]);
  const setClientFromId = useDebouncedFn(_setClientFromId, 120);

  const _setClientFromName = useCallback((nameStr) => {
    const raw = String(nameStr || "").trim(); const q = raw.toLowerCase();
    setClientNameInput(raw);
    if(!q) { setClientId(""); setClientIdInput(""); return; }
    const exact = clientsByName.get(q);
    if(exact) { setClientId(String(exact.id)); setClientIdInput(String(exact.id)); return; }
    for(const [k, c] of clientsByName.entries()){
      if(k.includes(q)) { setClientId(String(c.id)); setClientIdInput(String(c.id)); break; }
    }
  }, [clientsByName]);
  const setClientFromName = useDebouncedFn(_setClientFromName, 120);

  /* --------- ITENS --------- */
  const setItem = useCallback((index, key, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  }, []);
  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { product_id: "", qty: "1", unit_price: "", productIdInput: "", productNameInput: "" }]);
  }, []);
  const removeItem = useCallback((index) => { setItems((prev) => prev.filter((_, i) => i !== index)); }, []);

  const _setProductFromId = useCallback((index, idStr) => {
    const id = String(idStr || "").trim();
    setItem(index, "productIdInput", id);
    if(!id){
      setItem(index, "product_id", "");
      setItem(index, "productNameInput", "");
      return;
    }
    const p = productsById.get(id);
    if(p){
      setItems(prev => prev.map((it, i) => i === index ? {
        ...it,
        product_id: String(p.id),
        productNameInput: p.name || "",
        unit_price: it.unit_price ? it.unit_price : String(p.sale_price ?? "")
      } : it));
    }
  }, [productsById, setItem, setItems]);
  const setProductFromId = useDebouncedFn(_setProductFromId, 120);

  const _setProductFromName = useCallback((index, nameStr) => {
    const raw = String(nameStr || "").trim(); const q = raw.toLowerCase();
    setItem(index, "productNameInput", raw);
    if(!q){ setItem(index, "product_id", ""); setItem(index, "productIdInput", ""); return; }
    let p = productsIndex.get(`n:${q}`) || productsIndex.get(`s:${q}`);
    if(!p){
      for(const [k, v] of productsIndex.entries()){
        if((k.startsWith("n:") || k.startsWith("s:")) && k.includes(q)) { p = v; break; }
      }
    }
    if(p){
      setItems(prev => prev.map((it, i) => i === index ? {
        ...it,
        product_id: String(p.id),
        productIdInput: String(p.id),
        unit_price: it.unit_price ? it.unit_price : String(p.sale_price ?? "")
      } : it));
    }
  }, [productsIndex, setItem, setItems]);
  const setProductFromName = useDebouncedFn(_setProductFromName, 120);

  const onChangeProduct = useCallback((index, productId) => {
    const key = String(productId);
    const p = productsById.get(key);
    if(p){
      setItems(prev => prev.map((it, i) => i === index ? {
        ...it,
        product_id: key,
        productIdInput: String(p.id),
        productNameInput: p.name || "",
        unit_price: it.unit_price ? it.unit_price : String(p.sale_price ?? "")
      } : it));
    }else{
      setItem(index, "product_id", productId);
    }
  }, [productsById, setItem, setItems]);

  /* --------- RENDER --------- */
  const capped = useMemo(() => allRows.length > rows.length, [allRows.length, rows.length]);

  return (
    <div className="home-wrap">
      <main className="container">
        <section className="panel">
          <div className="panel-head">
            <div className="title-row"><h1>Vendas</h1></div>
            <div className="panel-head-right"><div className="badge">Total pago do dia: {BRL.format(totalDia)}</div></div>
          </div>

          <div className="toolbar" aria-busy={loading}>
            <div className="toolbar__left">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data" disabled={showAll}/>
              <button className="btn" onClick={onFilter}>Filtrar</button>
              <button className="btn" onClick={toggleAll} style={{ minWidth: 140 }}><VscEye size={20}/> {showAll ? "Ver menos" : "Ver tudo"}</button>
            </div>
            <a className="btn" href="#sale-modal" onClick={openModalNovaVenda}>+ Nova venda</a>
          </div>

          {err && <div className="alert" style={{ margin: "8px 16px 0" }}>{err}</div>}

          <RowsTable loading={loading} rows={rows} onShow={openModalDetalhes} capped={capped} onShowMore={onShowMore}/>
        </section>

        {/* ======= Modal unificado ======= */}
        <Modal id="sale-modal" title={mode === "create" ? "Nova venda" : null}>
          {mode === "create" ? (
            <>
              <p className="modal__desc">
                O estoque fará a baixa dos produtos se a venda estiver como <b>Pago</b>.
              </p>

              <form method="post" action="/sales">
                <input type="hidden" name="_token" value={window.csrfToken} />

                <div className="grid">
                  <div className="field half">
                    <label htmlFor="sold_at">Data da venda</label>
                    <input id="sold_at" name="sold_at" type="date" value={soldAt} onChange={(e) => setSoldAt(e.target.value)} required/>
                  </div>

                  <div className="field half">
                    <label htmlFor="status">Status</label>
                    <select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="open">Pendente</option>
                      <option value="paid">Pago</option>
                      <option value="canceled">Cancelado</option>
                    </select>
                  </div>

                  {/* ===== CLIENTE ===== */}
                  <div className="field" style={{ gridColumn: "span 12" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                      <div>
                        <label htmlFor="client_id_input">Cliente (por ID)</label>
                        <input id="client_id_input" type="number" min="1" placeholder="Ex.: 1" value={clientIdInput} onChange={(e) => setClientFromId(e.target.value)} onBlur={(e) => setClientFromId(e.target.value)}/>
                      </div>
                      <div>
                        <label htmlFor="client_name_input">Cliente (por Nome)</label>
                        <input id="client_name_input" type="text" placeholder="Ex.: Consumidor" list="clients-name-global" value={clientNameInput} onChange={(e) => setClientFromName(e.target.value)} onBlur={(e) => setClientFromName(e.target.value)}/>
                      </div>
                    </div>
                    <input type="hidden" id="client_id" name="client_id" value={clientId} required />
                    <span className="helper">Preencha por ID <b>ou</b> por Nome. O sistema sincroniza automaticamente.</span>
                  </div>

                  {/* ===== ITENS ===== */}
                  <div className="field" style={{ gridColumn: "span 12" }}>
                    <label>Itens</label>
                    <div className="table-wrap" style={{ maxHeight: 280, overflow: "auto" }}>
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: "45%" }}>Produto</th>
                            <th style={{ width: "15%" }}>Qtd</th>
                            <th style={{ width: "20%" }}>Preço unit.</th>
                            <th style={{ width: "20%" }}>Subtotal</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, idx) => {
                            const p = productsById.get(String(it.product_id));
                            const unit = parseFloat(it.unit_price || (p?.sale_price ?? 0)) || 0;
                            const qty = parseInt(it.qty || "0", 10) || 0;
                            const subtotal = unit * qty;

                            return (
                              <tr key={idx}>
                                <td>
                                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
                                    <input type="number" min="1" placeholder="ID" value={it.productIdInput} onChange={(e) => setProductFromId(idx, e.target.value)} onBlur={(e) => setProductFromId(idx, e.target.value)}/>
                                    <div>
                                      <input type="text" placeholder="Nome ou SKU" list="products-name-global" value={it.productNameInput} onChange={(e) => setProductFromName(idx, e.target.value)} onBlur={(e) => setProductFromName(idx, e.target.value)}/>
                                    </div>
                                  </div>
                                  <input type="hidden" name={`items[${idx}][product_id]`} value={it.product_id}/>
                                </td>

                                <td><input type="number" min="1" step="1" name={`items[${idx}][qty]`} value={it.qty} onChange={(e) => setItem(idx, "qty", e.target.value)} required/></td>

                                <td><input type="number" min="0" step="0.01" name={`items[${idx}][unit_price]`} value={it.unit_price} onChange={(e) => setItem(idx, "unit_price", e.target.value)} placeholder={p?.sale_price != null ? String(p.sale_price) : "0,00"}/></td>

                                <td className="right">{BRL.format(subtotal)}</td>

                                <td className="action">
                                  {items.length > 1 && (
                                    <button type="button" className="btn danger" onClick={() => removeItem(idx)}>Remover</button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <button type="button" className="btn" onClick={addItem}>+ Adicionar item</button>
                    </div>
                  </div>
                </div>

                <div className="form__actions">
                  <a href="#" className="btn">Cancelar</a>
                  <button type="submit" className="btn primary"><VscSave size={24}/> Salvar</button>
                </div>
              </form>

              {/* DATALISTS GLOBAIS */}
              <datalist id="clients-name-global">
                {clients.slice(0, 1000).map(c => <option key={c.id} value={c.name} />)}
              </datalist>
              <datalist id="products-name-global">
                {products.slice(0, 1000).map(p => <option key={p.id} value={p.name} />)}
              </datalist>
            </>
          ) : (
            <>
              <h2 id="sale-modal-title" className="modal__title">
                Detalhes da venda #{viewSale?.id ?? ""}
              </h2>
              <p className="modal__desc">
                Cliente: <b>{viewSale?.client ?? "-"}</b> &nbsp;•&nbsp;
                Status: <b>{viewSale ? STATUS_PT[viewSale.status] ?? viewSale.status : "-"}</b> &nbsp;•&nbsp;
                Data: <b>{viewSale?.sold_at ?? "-"}</b>
              </p>

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
                  <button type="submit" className="btn primary"><VscSync size={24}/> Atualizar</button>
                </form>
              )}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th><th>SKU</th><th className="right">Qtd</th>
                      <th className="right">Preço unit.</th><th className="right">Subtotal</th>
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
                        <td className="right">{BRL.format(Number(it.unit_price || 0))}</td>
                        <td className="right">{BRL.format(Number(it.subtotal || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" className="right"><b>Total</b></td>
                      <td className="right"><b>{BRL.format(Number(viewSale?.total || 0))}</b></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="form__actions">
                {viewSale?.id && (
                  <form method="post" action={`/sales/${viewSale.id}`} onSubmit={(e) => { if (!confirm("Tem certeza que deseja excluir esta venda?")) e.preventDefault(); }}>
                    <input type="hidden" name="_token" value={window.csrfToken}/>
                    <input type="hidden" name="_method" value="DELETE"/>
                    <button type="submit" className="btn danger"><VscSave size={24}/> Excluir</button>
                  </form>
                )}
                <a href="#" className="btn">Fechar</a>
              </div>
            </>
          )}
        </Modal>
        {/* ======= /modal ======= */}
      </main>
    </div>
  );
}

createRoot(document.getElementById("app")).render(<Sales />);
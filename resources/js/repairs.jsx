import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "../css/home.css";
import "../css/produtoModal.css";
import { VscSave, VscSync, VscEye, VscTrash } from "react-icons/vsc";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const STATUS_PT = { open: "Pendente", in_progress: "Em andamento", done: "Concluído", canceled: "Cancelado" };
const cx = (...c) => c.filter(Boolean).join(" ");

const Table = React.memo(function Table({ loading, rows, onOpen }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>#</th><th>Cliente</th><th>Dispositivo</th><th>Status</th><th>Preço</th><th>Data</th><th></th></tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="muted">Carregando...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={7} className="muted">Nenhuma manutenção no momento.</td></tr>
          ) : rows.map((r) => (
            <tr key={r.id}>
              <td>#{r.id}</td>
              <td>{r.client}</td>
              <td>{r.device}</td>
              <td>{STATUS_PT[r.status] ?? r.status}</td>
              <td>{r.price != null ? BRL.format(Number(r.price || 0)) : "-"}</td>
              <td className="muted">{r.created_at}</td>
              <td className="action"><a className="link" href="#repair-modal" onClick={() => onOpen(r.id)}><VscEye style={{ fontSize: 20 }}/> Detalhes</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

function Repairs() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // modal state
  const [mode, setMode] = useState("create"); // "create" | "show"

  // criação
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientNameInput, setClientNameInput] = useState("");
  const [device, setDevice] = useState("");
  const [issue, setIssue] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("open");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));

  // detalhes
  const [viewRepair, setViewRepair] = useState(null);

  // controllers & caches
  const listCtrlRef = useRef(null);
  const detailCtrlRef = useRef(null);
  const optionsCtrlRef = useRef(null);
  const listCacheRef = useRef(new Map()); // chave: date
  const clientsCacheRef = useRef(null);   // cache global de clientes

  // indexes O(1)
  const clientsById = useMemo(() => {
    const m = new Map(); for (const c of clients) m.set(String(c.id), c); return m;
  }, [clients]);
  const clientsByName = useMemo(() => {
    const m = new Map(); for (const c of clients) { const k = (c.name || "").trim().toLowerCase(); if (k) m.set(k, c); } return m;
  }, [clients]);

  const fetchList = useCallback(async (_date = date) => {
    const key = _date;
    if(listCacheRef.current.has(key)){
      setRows(listCacheRef.current.get(key)); setErr(""); setLoading(false);
      return;
    }
    if(listCtrlRef.current) listCtrlRef.current.abort();
    const ctrl = new AbortController(); listCtrlRef.current = ctrl;

    setLoading(true); setErr("");
    try{
      const res = await fetch(`/repairs/list?date=${encodeURIComponent(_date)}`, { headers: { Accept: "application/json" }, signal: ctrl.signal });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : [];
      listCacheRef.current.set(key, list);
      setRows(list);
    }catch(e){
      if(e?.name !== "AbortError"){
        console.log(e);
        setErr("Não foi possível carregar as manutenções.");
        setRows([]);
      }
    }finally{
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const loadClients = useCallback(async () => {
    if(clientsCacheRef.current) { setClients(clientsCacheRef.current); return; }
    if(optionsCtrlRef.current) optionsCtrlRef.current.abort();
    const ctrl = new AbortController(); optionsCtrlRef.current = ctrl;

    try{
      const res = await fetch(`/clients/list?per_page=1000`, { headers: { Accept: "application/json" }, signal: ctrl.signal });
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];
      clientsCacheRef.current = data;
      setClients(data);
    }catch(e){
      if(e?.name !== "AbortError") console.log("Erro ao carregar clientes:", e);
    }
  }, []);

  // abrir modal: criar
  const startCreate = useCallback(() =>{
    setMode("create");
    setClientId(""); setClientIdInput(""); setClientNameInput("");
    setDevice(""); setIssue(""); setPrice("");
    setStatus("open");
    setReceivedAt(new Date().toISOString().slice(0, 10));
    loadClients();
  }, [loadClients]);

  // abrir modal: detalhes
  const startShow = useCallback(async (id) => {
    if(detailCtrlRef.current) detailCtrlRef.current.abort();
    const ctrl = new AbortController(); detailCtrlRef.current = ctrl;

    setMode("show"); setViewRepair(null);
    try{
      const res = await fetch(`/repairs/${id}`, { headers: { Accept: "application/json" }, signal: ctrl.signal });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setViewRepair(json?.data ?? null);
    }catch(e){
      if(e?.name !== "AbortError"){
        console.log("Erro ao carregar manutenção:", e);
        setViewRepair(null);
      }
    }
  }, []);

  // resolver cliente (ID/Nome) sem <select> gigante
  const setClientFromId = useCallback((idStr) => {
    const id = String(idStr || "").trim();
    setClientIdInput(id);
    if(!id) { setClientId(""); setClientNameInput(""); return; }
    const c = clientsById.get(id);
    if(c) { setClientId(String(c.id)); setClientNameInput(c.name || ""); }
  }, [clientsById]);

  const setClientFromName = useCallback((nameStr) => {
    const raw = String(nameStr || "").trim(); const q = raw.toLowerCase();
    setClientNameInput(raw);
    if(!q) { setClientId(""); setClientIdInput(""); return; }
    const exact = clientsByName.get(q);
    if(exact) { setClientId(String(exact.id)); setClientIdInput(String(exact.id)); return; }
    for(const [k, c] of clientsByName.entries()){
      if(k.includes(q)) { setClientId(String(c.id)); setClientIdInput(String(c.id)); break; }
    }
  }, [clientsByName]);

  const onFilter = useCallback(() => { fetchList(date); }, [fetchList, date]);

  return (
    <div className="home-wrap">
      <main className="container">
        <section className="panel">
          <div className="panel-head">
            <div className="title-row">
              <h1>Manutenções</h1>
              <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <button className="btn" onClick={onFilter}>Filtrar</button>
              </div>
            </div>
            <a className="btn" href="#repair-modal" onClick={startCreate}>+ Nova manutenção</a>
          </div>

          {err && <div className="alert" style={{ margin: "8px 16px 0" }}>{err}</div>}

          <Table loading={loading} rows={rows} onOpen={startShow} />
        </section>

        {/* ======= Modal (criar / detalhes) ======= */}
        <section id="repair-modal" className="modal" aria-labelledby="titulo-repair" aria-modal="true" role="dialog">
          <a href="#" className="modal__overlay" aria-label="Fechar"></a>

          <div className="modal__panel">
            <a className="modal__close" href="#" aria-label="Fechar">✕</a>

            {mode === "create" ? (
              <>
                <h2 id="titulo-repair" className="modal__title">Nova manutenção</h2>

                <form method="post" action="/repairs">
                  <input type="hidden" name="_token" value={window.csrfToken} />

                  <div className="grid">
                    <div className="field half">
                      <label htmlFor="received_at">Data de recebimento</label>
                      <input id="received_at" name="received_at" type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} required />
                    </div>

                    <div className="field half">
                      <label htmlFor="status">Status</label>
                      <select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="open">Pendente</option>
                        <option value="in_progress">Em andamento</option>
                        <option value="done">Concluído</option>
                        <option value="canceled">Cancelado</option>
                      </select>
                    </div>

                    {/* Cliente (ID/Nome com datalist global + input hidden) */}
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
                      {/* valor real para o POST */}
                      <input type="hidden" id="client_id" name="client_id" value={clientId} required />
                      <span className="helper">Preencha por ID <b>ou</b> por Nome. O sistema sincroniza automaticamente.</span>
                    </div>

                    <div className="field half">
                      <label htmlFor="device">Dispositivo</label>
                      <input id="device" name="device" type="text" placeholder="Ex.: Notebook Acer" value={device} onChange={(e) => setDevice(e.target.value)} required />
                    </div>

                    <div className="field half">
                      <label htmlFor="price">Preço</label>
                      <input id="price" name="price" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0,00" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>

                    <div className="field" style={{ gridColumn: "span 12" }}>
                      <label htmlFor="issue">Descrição do problema</label>
                      <textarea id="issue" name="issue" rows="4" placeholder="Descreva o defeito / serviço" style={{ resize: "vertical" }} value={issue} onChange={(e) => setIssue(e.target.value)} />
                    </div>
                  </div>

                  <div className="form__actions">
                    <a href="#" className="btn">Cancelar</a>
                    <button type="submit" className="btn primary"><VscSave style={{ fontSize: 24 }} /> Salvar</button>
                  </div>
                </form>

                {/* datalist global (renderiza uma única vez) */}
                <datalist id="clients-name-global">
                  {clients.slice(0, 1000).map((c) => <option key={c.id} value={c.name} />)}
                </datalist>
              </>
            ) : (
              <>
                <h2 className="modal__title">Detalhes da manutenção #{viewRepair?.id ?? ""}</h2>
                <p className="modal__desc">
                  Cliente: <b>{viewRepair?.client ?? "-"}</b> &nbsp;•&nbsp;
                  Status: <b>{STATUS_PT[viewRepair?.status] ?? "-"}</b> &nbsp;•&nbsp;
                  Recebida: <b>{viewRepair?.received_at ?? "-"}</b>
                </p>

                {viewRepair?.id && (
                  <form method="post" action={`/repairs/${viewRepair.id}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                    <input type="hidden" name="_token" value={window.csrfToken} />
                    <input type="hidden" name="_method" value="PUT" />
                    <label htmlFor="new_status" style={{ fontWeight: 600 }}>Status:</label>
                    <select id="new_status" name="status" defaultValue={viewRepair.status} style={{ width: 136 }}>
                      <option value="open">Pendente</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="done">Concluído</option>
                      <option value="canceled">Cancelado</option>
                    </select>
                    <button type="submit" className="btn primary"><VscSync style={{ fontSize: 24 }} /> Atualizar</button>
                  </form>
                )}

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Dispositivo</th><th>Preço</th><th>Descrição</th><th>Criada em</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{viewRepair?.device ?? "-"}</td>
                        <td>{viewRepair?.price != null ? BRL.format(Number(viewRepair.price || 0)) : "-"}</td>
                        <td className="muted">{viewRepair?.issue || "-"}</td>
                        <td className="muted">{viewRepair?.created_at ?? "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="form__actions">
                  {viewRepair?.id && (
                    <form method="post" action={`/repairs/${viewRepair.id}`} onSubmit={(e) => { if (!confirm("Tem certeza que deseja excluir esta manutenção?")) e.preventDefault(); }}>
                      <input type="hidden" name="_token" value={window.csrfToken} />
                      <input type="hidden" name="_method" value="DELETE" />
                      <button type="submit" className="btn danger"><VscTrash style={{ fontSize: 24 }} /> Excluir</button>
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

createRoot(document.getElementById("app")).render(<Repairs />);
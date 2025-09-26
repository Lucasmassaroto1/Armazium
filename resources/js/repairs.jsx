import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import '../css/home.css';
import '../css/produtoModal.css';

function Repairs(){
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ===== modal state =====
  const [mode, setMode] = useState("create"); // "create" | "show"

  // create
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [device, setDevice] = useState("");
  const [issue, setIssue] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("open");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0,10));

  // show
  const [viewRepair, setViewRepair] = useState(null);

  const STATUS_PT ={
    open: "Pendente",
    in_progress: "Em andamento",
    done: "Concluída",
    canceled: "Cancelada",
  };

  async function load(){
    setLoading(true);
    setErr("");
    try{
      const res = await fetch(`/repairs/list?date=${encodeURIComponent(date)}`, { headers:{Accept:'application/json'}});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data?.data)? data.data : []);
    }catch(e){
      console.log(e);
      setErr("Não foi possível carregar as manutenções.");
      setRows([]);
    }finally{
      setLoading(false);
    }
  }

  async function loadClients(){
    try{
      const res = await fetch(`/clients/list?per_page=1000`, { headers:{Accept:'application/json'}});
      const json = await res.json();
      setClients(Array.isArray(json?.data) ? json.data : []);
    }catch(e){
      console.log("Erro ao carregar clientes:", e);
    }
  }

  useEffect(()=>{ load(); },[]);

  // abrir modal: criar
  function startCreate(){
    setMode("create");
    setClientId("");
    setDevice("");
    setIssue("");
    setPrice("");
    setStatus("open");
    setReceivedAt(new Date().toISOString().slice(0,10));
    loadClients();
  }

  // abrir modal: detalhes
  async function startShow(id){
    setMode("show");
    setViewRepair(null);
    try{
      const res = await fetch(`/repairs/${id}`, { headers:{Accept:'application/json'}});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setViewRepair(json?.data ?? null);
    }catch(e){
      console.log("Erro ao carregar manutenção:", e);
      setViewRepair(null);
    }
  }

  return (
    <div className="home-wrap">
      <main className="container">
        <section className="panel">
          <div className="panel-head">
            <div className="title-row">
              <h1>Manutenções</h1>
                <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
                  <button className="btn" onClick={load}>Filtrar</button>
                </div>
            </div>
            <a className="btn" href="#repair-modal" onClick={startCreate}>+ Nova manutenção</a>
          </div>

          {err && <div className="alert" style={{margin:'8px 16px 0'}}>{err}</div>}

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Cliente</th><th>Dispositivo</th><th>Status</th><th>Preço</th><th>Data</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="muted">Carregando...</td></tr>
                ) : rows.length===0 ? (
                  <tr><td colSpan="7" className="muted">Nenhuma manutenção no momento.</td></tr>
                ) : rows.map(r=>(
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.client}</td>
                    <td>{r.device}</td>
                    <td>{STATUS_PT[r.status] ?? r.status}</td>
                    <td>{r.price ? `R$ ${r.price.toFixed(2).replace('.',',')}` : '-'}</td>
                    <td className="muted">{r.created_at}</td>
                    <td className="action"><a className="link" href="#repair-modal" onClick={()=>startShow(r.id)}>Ver detalhes</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        
        {/* ======= Modal CSS-only (criar e detalhes) ======= */}
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
                      <input id="received_at" name="received_at" type="date" value={receivedAt} onChange={e=>setReceivedAt(e.target.value)} required/>
                    </div>

                    <div className="field half">
                      <label htmlFor="status">Status</label>
                      <select id="status" name="status" value={status} onChange={e=>setStatus(e.target.value)}>
                        <option value="open">Pendente</option>
                        <option value="in_progress">Em andamento</option>
                        <option value="done">Concluída</option>
                        <option value="canceled">Cancelada</option>
                      </select>
                    </div>

                    <div className="field" style={{ gridColumn: "span 12" }}>
                      <label htmlFor="client_id">Cliente</label>
                      <select id="client_id" name="client_id" required value={clientId} onChange={e=>setClientId(e.target.value)}>
                        <option value="" disabled>Selecione...</option>
                        {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>

                    <div className="field half">
                      <label htmlFor="device">Dispositivo</label>
                      <input id="device" name="device" type="text" placeholder="Ex.: Notebook Acer" value={device} onChange={e=>setDevice(e.target.value)} required/>
                    </div>

                    <div className="field half">
                      <label htmlFor="price">Preço</label>
                      <input id="price" name="price" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0,00" value={price} onChange={e=>setPrice(e.target.value)}/>
                    </div>

                    <div className="field" style={{ gridColumn: "span 12" }}>
                      <label htmlFor="issue">Descrição do problema</label>
                      <textarea id="issue" name="issue" rows="4" placeholder="Descreva o defeito / serviço" style={{resize:'vertical'}} value={issue} onChange={e=>setIssue(e.target.value)} />
                    </div>
                  </div>

                  <div className="form__actions">
                    <a href="#" className="btn">Cancelar</a>
                    <button type="submit" className="btn primary">Salvar manutenção</button>
                  </div>
                </form>
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
                  <form method="post" action={`/repairs/${viewRepair.id}`} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
                    <input type="hidden" name="_token" value={window.csrfToken}/>
                    <input type="hidden" name="_method" value="PUT"/>
                    <label htmlFor="new_status" style={{ fontWeight: 600 }}>Status:</label>
                    <select id="new_status" name="status" defaultValue={viewRepair.status} style={{width:136}}>
                      <option value="open">Pendente</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="done">Concluída</option>
                      <option value="canceled">Cancelada</option>
                    </select>
                    <button type="submit" className="btn primary">Atualizar status</button>
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
                        <td>{viewRepair?.price != null ? `R$ ${Number(viewRepair.price).toFixed(2).replace('.',',')}` : '-'}</td>
                        <td className="muted">{viewRepair?.issue || "-"}</td>
                        <td className="muted">{viewRepair?.created_at ?? "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="form__actions">
                  {viewRepair?.id && (
                    <form method="post" action={`/repairs/${viewRepair.id}`} onSubmit={(e)=>{ if(!confirm("Tem certeza que deseja excluir esta manutenção?")) e.preventDefault(); }}>
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

createRoot(document.getElementById('app')).render(<Repairs />);

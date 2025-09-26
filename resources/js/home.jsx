import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../css/home.css";

function Home(){
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [metrics, setMetrics] = useState({
    salesToday: 0,
    repairsToday: 0,
    revenueToday: 0,
    lowStockCount: 0,
  });

  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    let canceled = false;

    (async () => {
      setLoading(true);
      setError("");

      try{
        const [mRes, lRes] = await Promise.all([
          fetch("/dashboard/metrics", { headers: { Accept: "application/json" } }),
          fetch("/products/list?low=1&per_page=5", { headers: { Accept: "application/json" } }),
        ]);
        if(canceled) return;

        if(!mRes.ok || !lRes.ok){
          throw new Error(`HTTP ${mRes.status}/${lRes.status}`);
        }

        const m = await mRes.json();
        const l = await lRes.json();

        setMetrics({
          salesToday: Number(m?.salesToday || 0),
          repairsToday: Number(m?.repairsToday || 0),
          revenueToday: Number(m?.revenueToday || 0),
          lowStockCount: Number(m?.lowStockCount || 0),
        });

        setLowStock(Array.isArray(l?.data) ? l.data : []);
      }catch(err){
        if(canceled) return;
        setError("Não foi possível carregar os dados agora.");
        setMetrics({ salesToday: 0, repairsToday: 0, revenueToday: 0, lowStockCount: 0 });
        setLowStock([]);
        console.log("Dashboard error:", err);
      }finally{
        if(!canceled) setLoading(false);
      }
    })();

    return () => { canceled = true; };
  }, []);

  return (
    <div className="home-wrap">
      <main className="container">
        <div className="title-row">
          <h1>Dashboard</h1>
        </div>

        {error && <div className="alert">{error}</div>}

        <section className="grid-cards">
          <div className={`card ${metrics.salesToday > 0 ? "success" : "danger"}`}>
            <div className="card-label">Vendas (hoje)</div>
            <div className="card-value">{loading ? "..." : metrics.salesToday}</div>
            {metrics.salesToday > 0 && (
              <a className={`card-link ${metrics.salesToday > 0 ? "success" : "danger"}`} href="/sales?f=low">Detalhes</a>
            )}
          </div>

          <div className={`card ${metrics.repairsToday > 0 ? "success" : "danger"}`}>
            <div className="card-label">Manutenções (hoje)</div>
            <div className="card-value">{loading ? "..." : metrics.repairsToday}</div>
            {metrics.repairsToday > 0 && (
              <a className={`card-link ${metrics.repairsToday > 0 ? "success" : "danger"}`} href="/repairs?f=low">Detalhes</a>
            )}
          </div>

          <div className={`card ${metrics.revenueToday > 0 ? "success" : "danger"}`}>
            <div className="card-label">Faturado (hoje)</div>
            <div className="card-value">
              {loading ? "..." : `R$ ${Number(metrics.revenueToday).toFixed(2).replace(".", ",")}`}
            </div>
          </div>

          <div className={`card ${metrics.lowStockCount > 0 ? "danger" : ""}`}>
            <div className="card-label">Items com baixo estoque</div>
            <div className="card-value">{loading ? "..." : metrics.lowStockCount}</div>
            {metrics.lowStockCount > 0 && (
              <a className="card-link" href="/products?f=low">ver todos</a>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Estoque baixo</h2>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Produto</th>
                  <th>SKU</th>
                  <th>Categoria</th>
                  <th className="right">Estoque</th>
                  <th className="right">Mínimo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="muted">Carregando...</td></tr>
                ) : lowStock.length === 0 ? (
                  <tr><td colSpan="6" className="muted">Nenhum item no momento.</td></tr>
                ) : (
                  lowStock.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td className="muted">{p.sku}</td>
                      <td>{p.category || "-"}</td>
                      <td className="right">{p.stock}</td>
                      <td className="right">{p.min_stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("app")).render(<Home />);
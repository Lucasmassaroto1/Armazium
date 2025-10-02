import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import "../css/home.css";
import { VscEye } from "react-icons/vsc";
import { BsBoxSeam, BsCartCheck } from "react-icons/bs";
import { FaTools } from "react-icons/fa";

const cx = (...c) => c.filter(Boolean).join(" ");
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** ----- Componentes puros/memorizados ----- */
const StatCard = React.memo(function StatCard({ label, value, loading, successWhen = (v) => v > 0, link, Icon }){
  const isSuccess = !loading && successWhen(value);
  const variant = isSuccess ? "success" : (label.toLowerCase().includes("estoque") && value > 0 ? "danger" : (!loading ? "danger" : ""));
  return(
    <div className={cx("card", variant)}>
      <div className="card-label">{Icon ? <Icon style={{ fontSize: 20 }} aria-hidden/> : null}<span>{label}</span></div>
      <div className="card-value">{loading ? "..." : value}</div>
      {link && isSuccess && (
        <a className={cx("card-link", variant)} href={link.href}>{link.text}</a>
      )}
    </div>
  );
});

const MoneyCard = React.memo(function MoneyCard({ label, value, loading }){
  return(
    <div className={cx("card", (!loading && value > 0) ? "success" : "danger")}>
      <div className="card-label">{label}</div>
      <div className="card-value">{loading ? "..." : BRL.format(Number(value || 0))}</div>
    </div>
  );
});

const LowStockRow = React.memo(function LowStockRow({ p }){
  return(
    <tr>
      <td>{p.id}</td>
      <td>{p.name}</td>
      <td className="muted">{p.sku}</td>
      <td>{p.category || "-"}</td>
      <td className="right">{p.stock}</td>
      <td className="right">{p.min_stock}</td>
    </tr>
  );
});

const LowStockTable = React.memo(function LowStockTable({ loading, items }){
  return(
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
          ) : items.length === 0 ? (
            <tr><td colSpan="6" className="muted">Nenhum item no momento.</td></tr>
          ) : (
            items.map((p) => <LowStockRow key={p.id} p={p} />)
          )}
        </tbody>
      </table>
    </div>
  );
});

/** ----- Página ----- */
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

  useEffect(() =>{
    const ctrl = new AbortController();

    async function load(){
      setLoading(true);
      setError("");

      try{
        const [mRes, lRes] = await Promise.all([
          fetch("/dashboard/metrics", { headers: { Accept: "application/json" }, signal: ctrl.signal }),
          fetch("/products/list?low=1&per_page=5", { headers: { Accept: "application/json" }, signal: ctrl.signal }),
        ]);

        if(!mRes.ok || !lRes.ok){
          throw new Error(`HTTP ${mRes.status}/${lRes.status}`);
        }

        const [m, l] = await Promise.all([mRes.json(), lRes.json()]);

        setMetrics({
          salesToday: Number(m?.salesToday || 0),
          repairsToday: Number(m?.repairsToday || 0),
          revenueToday: Number(m?.revenueToday || 0),
          lowStockCount: Number(m?.lowStockCount || 0),
        });

        setLowStock(Array.isArray(l?.data) ? l.data : []);
      }catch(err){
        if(err?.name === "AbortError") return;
        console.log("Dashboard error:", err);
        setError("Não foi possível carregar os dados agora.");
        setMetrics({ salesToday: 0, repairsToday: 0, revenueToday: 0, lowStockCount: 0 });
        setLowStock([]);
      }finally{
        setLoading(false);
      }
    }

    load();
    return () => ctrl.abort();
  }, []);

  // Derivações memorizadas
  const lowStockCount = metrics.lowStockCount;

  return (
    <div className="home-wrap">
      <main className="container">
        <div className="title-row">
          <h1>Dashboard</h1>
        </div>

        {error && <div className="alert">{error}</div>}

        <section className="grid-cards">
          <StatCard Icon={BsCartCheck} label=" Vendas (hoje)" value={metrics.salesToday} loading={loading} successWhen={(v) => v > 0} link={{ href: "/sales?f=low", text: "Detalhes" }}/>

          <StatCard Icon={FaTools} label=" Manutenções (hoje)" value={metrics.repairsToday} loading={loading} successWhen={(v) => v > 0} link={{ href: "/repairs?f=low", text: "Detalhes" }}/>

          <MoneyCard label="Faturado (hoje)" value={metrics.revenueToday} loading={loading}/>

          <div className={cx("card", (!loading && lowStockCount > 0) ? "danger" : "")}>
            <div className="card-label"><BsBoxSeam style={{ fontSize: 20 }}/> Produtos com baixo estoque</div>
            <div className="card-value">{loading ? "..." : lowStockCount}</div>
            {!loading && lowStockCount > 0 && (
              <a className="card-link" href="/products?f=low"><VscEye style={{ fontSize: 20 }}/> ver todos</a>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Estoque baixo</h2>
          </div>
          <LowStockTable loading={loading} items={lowStock}/>
        </section>
      </main>
    </div>
  );
}

const mount = document.getElementById("app");
if (mount) createRoot(mount).render(<Home/>);
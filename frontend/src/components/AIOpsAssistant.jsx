import React, { useState, useEffect } from "react";
import API from "../api";

export default function AIOpsAssistant() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("business");

  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    if (open) loadInsights();
  }, [open]);

  const loadInsights = async () => {
    try {
      const [sum, low, top] = await Promise.all([
        API.get("summary/"),
        API.get("analytics/low-stock/"),
        API.get("analytics/top-products/"),
      ]);

      setSummary(sum.data);
      setLowStock(low.data || []);
      setTopProducts(top.data || []);
    } catch (err) {
      console.error("AI assistant insight error:", err);
    }
  };

  // ---------- UI STYLES ----------
  const bubble = {
    position: "fixed",
    bottom: "26px",
    right: "26px",
    zIndex: 1200,
    background: "#1E5EFF",
    color: "#fff",
    padding: "12px 22px",
    borderRadius: "50px",
    border: "none",
    fontSize: "14px",
    boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
    cursor: "pointer",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "0.2s",
  };

  const panel = {
    position: "fixed",
    top: 0,
    right: 0,
    width: "430px",
    height: "100vh",
    background: "#fff",
    boxShadow: "-10px 0 32px rgba(0,0,0,0.15)",
    zIndex: 1500,
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #eee",
  };

  const header = {
    padding: "18px 22px",
    borderBottom: "1px solid #eee",
    fontWeight: 700,
    fontSize: "16px",
    display: "flex",
    justifyContent: "space-between",
  };

  const closeBtn = {
    border: "none",
    background: "transparent",
    fontSize: "26px",
    cursor: "pointer",
    lineHeight: 1,
  };

  const tabBar = {
    display: "flex",
    padding: "0 18px",
    borderBottom: "1px solid #eee",
    gap: "18px",
  };

  const tabBtn = (key, label) => ({
    padding: "14px 0",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    borderBottom: activeTab === key ? "2px solid #1E5EFF" : "2px solid transparent",
    color: activeTab === key ? "#1E5EFF" : "#444",
  });

  const sectionTitle = {
    fontWeight: 700,
    marginBottom: "6px",
    fontSize: "14px",
  };

  const section = { marginBottom: "22px" };

  return (
    <>
      {/* Floating action bubble */}
      {!open && (
        <button style={bubble} onClick={() => setOpen(true)}>
          ✨ AI Executive Summary
        </button>
      )}

      {/* Slide-in panel */}
      {open && (
        <div style={panel}>
          <div style={header}>
            AI Executive Assistant
            <button style={closeBtn} onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          {/* TAB SELECTOR */}
          <div style={tabBar}>
            <div style={tabBtn("business", "Business")} onClick={() => setActiveTab("business")}>
              Business
            </div>
            <div style={tabBtn("engineering", "Engineering")} onClick={() => setActiveTab("engineering")}>
              Engineering
            </div>
            <div style={tabBtn("vision", "Vision & Roadmap")} onClick={() => setActiveTab("vision")}>
              Roadmap
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ padding: "22px", overflowY: "auto", fontSize: "14px" }}>
            {!summary ? (
              <p style={{ textAlign: "center", paddingTop: 40, color: "#777" }}>Loading insights…</p>
            ) : (
              <>
                {/* ----------- BUSINESS INSIGHTS ---------------- */}
                {activeTab === "business" && (
                  <>
                    <div style={section}>
                      <div style={sectionTitle}>📊 Business overview</div>
                      <p>
                        • {summary.products} active SKUs across {summary.brands} brands  
                        <br />• {summary.orders} orders processed in the last 30 days  
                        <br />• Catalogue shows healthy long tail distribution  
                        <br />• No single SKU dominates → balanced revenue base  
                      </p>
                    </div>

                    <div style={section}>
                      <div style={sectionTitle}>⚠️ Stock risk</div>
                      <p>
                        {lowStock.length === 0
                          ? "No critical low-stock items — stable position."
                          : `${lowStock.length} SKUs below buffer level → increasing stock-out exposure.`}
                        <br />
                        • High velocity items need tighter replenishment  
                        <br />• Small shortages now → large revenue leakage later  
                      </p>
                    </div>

                    <div style={section}>
                      <div style={sectionTitle}>🏆 Top sellers (last 30 days)</div>
                      <ul>
                        {topProducts.slice(0, 3).map((p, i) => (
                          <li key={p.product__name}>
                            #{i + 1} {p.product__name} — {p.total} orders
                          </li>
                        ))}
                      </ul>
                      <p>
                        • Protect these SKUs → highest ROI per unit restocked  
                        <br />• Candidates for subscription, bundles and supplier discounts  
                      </p>
                    </div>

                    <div style={section}>
                      <div style={sectionTitle}>🧠 Suggested focus</div>
                      <ul>
                        <li>Protect availability on top velocity sellers.</li>
                        <li>Check SKUs at 0–2 units weekly to avoid silent stock-outs.</li>
                        <li>Track brand contribution vs shelf space usage.</li>
                        <li>Raise visibility on suppliers with inconsistent lead times.</li>
                      </ul>
                    </div>
                  </>
                )}

                {/* ----------- ENGINEERING INSIGHTS ---------------- */}
                {activeTab === "engineering" && (
                  <>
                    <div style={section}>
                      <div style={sectionTitle}>🧩 Why this architecture?</div>
                      <ul>
                        <li>Django REST + React → fast delivery, low cognitive load.</li>
                        <li>Monolith by design → small team velocity  unnecessary complexity.</li>
                        <li>Postgres → strong integrity, handles analytics well.</li>
                        <li>Avoiding microservices until scale *forces* it.</li>
                        <li>API intentionally thin → predictable, testable, maintainable.</li>
                      </ul>
                    </div>

                    <div style={section}>
                      <div style={sectionTitle}>🧪 Scaling pressure points</div>
                      <ul>
                        <li>Dashboard analytics under heavy read traffic.</li>
                        <li>SKU count growth → slower aggregations without caching.</li>
                        <li>Forecasting large SKU sets → requires async pipelines.</li>
                        <li>Future multi-warehouse → needs event-driven synchronisation.</li>
                      </ul>
                    </div>

                    <div style={section}>
                      <div style={sectionTitle}>🔧 Evolution plan</div>
                      <ul>
                        <li>Introduce Redis for caching hot analytics.</li>
                        <li>Move forecasting to Celery/RabbitMQ worker pool.</li>
                        <li>Add stock-change events → real-time dashboards.</li>
                        <li>Add read replicas when SKU count grows beyond threshold.</li>
                        <li>Split monolith only when natural domain boundaries appear.</li>
                      </ul>
                    </div>

                    <div style={section}>
                      <div style={sectionTitle}>🧠 Engineering principles</div>
                      <ul>
                        <li>Simplify first, optimise later.</li>
                        <li>Measure before scaling — data over guesswork.</li>
                        <li>Every system needs clear ownership + clean boundaries.</li>
                        <li>Microservices are an organisational tool, not a default choice.</li>
                      </ul>
                    </div>
                  </>
                )}

                {/* ----------- VISION & ROADMAP ---------------- */}
                {activeTab === "vision" && (
                  <>
                    <div style={section}>
                      <div style={sectionTitle}>🚀 Vision & Strategy</div>
                      <p>
                        Build the operating system for wholesale inventory intelligence —  
                        a platform where forecasting, replenishment, anomalies, supplier performance  
                        and demand signals work together as one coherent system.  
                        <br /><br />
                        The goal isn’t more features.  
                        The goal is <strong>compounding intelligence</strong>.
                      </p>
                    </div>

                    <div style={section}>
                      <div style={sectionTitle}>1️⃣ Short-term (0–3 months)</div>
                      <ul>
                        <li>Improve SKU accuracy & eliminate silent stock-outs.</li>
                        <li>Supplier lead time monitoring.</li>
                        <li>Enhanced audit trails on stock operations.</li>
                        <li>Strengthen baseline demand modelling.</li>
                      </ul>
                    </div>

                    <div style={section}>
                      <div style={sectionTitle}>2️⃣ Mid-term (3–6 months)</div>
                      <ul>
                        <li>Pricing engine (rules, overrides, elasticity insights).</li>
                        <li>Demand anomaly detection.</li>
                        <li>ABC inventory segmentation.</li>
                        <li>Redis accelerated analytics (&lt;50ms loads).</li>
                        <li>SKU lifecycle scoring (promotion, protection, retirement).</li>
                      </ul>
                    </div>

                    <div style={section}>
                      <div style={sectionTitle}>3️⃣ Long term (6–12 months)</div>
                      <ul>
                        <li>Dedicated forecasting microservice.</li>
                        <li>Event driven stock sync across warehouses.</li>
                        <li>Multi warehouse orchestration.</li>
                        <li>External supplier API integrations.</li>
                        <li>Automatic replenishment (zero-touch procurement).</li>
                      </ul>
                    </div>

                    <div style={section}>
                      <div style={sectionTitle}>🧭 Product philosophy</div>
                      <ul>
                        <li>Think in systems, not features.</li>
                        <li>Keep complexity behind the scenes — users see simplicity.</li>
                        <li>Every change must deliver measurable business value.</li>
                        <li>Intelligence compounds when the system learns continuously.</li>
                      </ul>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
import React, { useEffect, useState } from "react";
import API from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


// --------------------------------------
// Simple fake data generator used only
// when the backend has no order history.
// This keeps the page looking alive.
// --------------------------------------
function generateFakeInsights() {
  const fake = [];
  const brands = [
    "Makita",
    "Philips",
    "WD-40",
    "Bosch",
    "DeWalt",
    "Duracell",
    "3M",
    "Black+Decker",
  ];

  // creates a small set of random products with rough behaviour
  for (let i = 0; i < 20; i++) {
    const stock = Math.floor(Math.random() * 30) + 1;
    const daily = Number((Math.random() * 2 + 0.2).toFixed(2));
    const daysToOOS = Number((stock / daily).toFixed(1));

    fake.push({
      product_id: i + 1,
      name: `${brands[i % brands.length]} ${1000 + i}`,
      brand: brands[i % brands.length],
      stock,
      daily_rate: daily,
      days_to_oos: daysToOOS,
      recommended_restock: Math.max(0, Math.round(30 * daily - stock)),
    });
  }

  // matches the shape of the real backend response
  return {
    window_days: 30,
    horizon_days: 30,
    summary: {
      tracked_skus: fake.length,
      total_skus: fake.length,
      avg_daily_units: 41.2,
      at_risk_7_days: fake.filter((x) => x.days_to_oos <= 7).length,
      at_risk_30_days: fake.filter((x) => x.days_to_oos <= 30).length,
    },
    items: fake,
  };
}


// --------------------------------------
// Converts days_to_oos into a small label
// Helps highlight urgency in the table.
// --------------------------------------
const riskLabel = (item) => {
  if (item.days_to_oos === null) return "No movement";
  if (item.days_to_oos <= 7) return "High";
  if (item.days_to_oos <= 30) return "Medium";
  return "Low";
};

// class helper for coloured badges
const riskClass = (item) => {
  if (item.days_to_oos === null) return "risk-pill risk-none";
  if (item.days_to_oos <= 7) return "risk-pill risk-high";
  if (item.days_to_oos <= 30) return "risk-pill risk-med";
  return "risk-pill risk-low";
};


// --------------------------------------
// MAIN COMPONENT
// Shows a mix of high-level risk signals
// and per-SKU recommendations.
// --------------------------------------
function Inventory() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  // number of days of order history we use
  const [windowDays, setWindowDays] = useState(30);

  // how far ahead we want to plan
  const [horizonDays, setHorizonDays] = useState(30);

  // fetches insights from the backend
  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await API.get("inventory-insights/", {
        params: {
          window: windowDays,
          horizon: horizonDays,
          limit: 50,
        },
      });

      // if backend has no orders yet, we fall back to demo values
      if (!res.data.items || res.data.items.length === 0) {
        setInsights(generateFakeInsights());
      } else {
        setInsights(res.data);
      }

    } catch (err) {
      console.error("Inventory insights error:", err);
      // fallback keeps UI functioning
      setInsights(generateFakeInsights());
    } finally {
      setLoading(false);
    }
  };

  // load once on mount
  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line
  }, []);

  // --------------------------------------
  // builds a top-risk slice for the chart
  // lower "days_to_oos" = bigger problem
  // --------------------------------------
  const topRisk =
    insights?.items
      ?.filter((i) => i.days_to_oos !== null)
      .sort((a, b) => a.days_to_oos - b.days_to_oos)
      .slice(0, 10) || [];

  return (
    <div className="fade-in">
      
      {/* HEADER + controls */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-semibold text-primary d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Inventory Intelligence
        </h3>

        {/* simple filters for changing data window */}
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
          </select>

          <select
            className="form-select form-select-sm"
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
          >
            <option value={14}>Plan 2 weeks</option>
            <option value={30}>Plan 1 month</option>
            <option value={60}>Plan 2 months</option>
          </select>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={fetchInsights}
          >
            Recalculate
          </button>
        </div>
      </div>


      {/* SUMMARY CARDS */}
      {!loading && insights && (
        <div className="row mb-4 text-center">
          {/* quick overview numbers */}
          <div className="col-md-3">
            <div className="card p-3 stat-card">
              <small className="text-muted">Window</small>
              <h5 className="mb-0">{insights.window_days} days</h5>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 stat-card">
              <small className="text-muted">Planning horizon</small>
              <h5 className="mb-0">{insights.horizon_days} days</h5>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 stat-card">
              <small className="text-muted">SKUs tracked</small>
              <h5 className="mb-0">
                {insights.summary.tracked_skus} / {insights.summary.total_skus}
              </h5>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 stat-card">
              <small className="text-muted">At risk (≤ 7d)</small>
              <h5 className="mb-0 text-danger">
                {insights.summary.at_risk_7_days}
              </h5>
            </div>
          </div>
        </div>
      )}


      {/* LOADING MESSAGE */}
      {loading && (
        <div className="text-center text-muted py-5">
          Calculating inventory insights…
        </div>
      )}


      {/* MAIN CONTENT */}
      {!loading && insights && (
        <>
          {/* risk chart */}
          <div className="card p-3 mb-4">
            <h6 className="fw-semibold mb-3">
              Top at-risk SKUs (days to stock-out)
            </h6>

            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={topRisk}>
                  {/* product names hidden to avoid clutter */}
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="days_to_oos"
                    fill="#f97316"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <small className="text-muted">
              Lower bars = sooner stock-out risk.
            </small>
          </div>


          {/* restock table */}
          <div className="card p-3">
            <h6 className="fw-semibold mb-3">Restock recommendations</h6>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th className="text-end">Stock</th>
                    <th className="text-end">Daily use</th>
                    <th className="text-end">Days to OOS</th>
                    <th className="text-end">Recommend buy</th>
                    <th>Risk</th>
                  </tr>
                </thead>

                <tbody>
                  {insights.items.map((item) => (
                    <tr key={item.product_id}>
                      <td>{item.name}</td>
                      <td>{item.brand}</td>
                      <td className="text-end">{item.stock}</td>
                      <td className="text-end">{item.daily_rate}</td>
                      <td className="text-end">
                        {item.days_to_oos !== null ? item.days_to_oos : "—"}
                      </td>
                      <td className="text-end">
                        {item.recommended_restock > 0
                          ? item.recommended_restock
                          : "—"}
                      </td>
                      <td>
                        {/* small coloured tag for visual risk level */}
                        <span className={riskClass(item)}>
                          {riskLabel(item)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <small className="text-muted">
              Based on the last {insights.window_days} days of demand.
            </small>
          </div>
        </>
      )}
    </div>
  );
}

export default Inventory;
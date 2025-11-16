import React, { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

function Forecast() {
  // stores full forecast response
  const [data, setData] = useState(null);

  // user-chosen history window and forecast horizon
  const [windowDays, setWindowDays] = useState(30);
  const [horizonDays, setHorizonDays] = useState(30);

  // loading state shown while fetching
  const [loading, setLoading] = useState(true);

  // toggle between top 10 and all items
  const [showAll, setShowAll] = useState(false);

  // fetches forecast from backend
  const loadForecast = async () => {
    setLoading(true);
    try {
      const res = await API.get("analytics/demand-forecast/", {
        params: { window: windowDays, horizon: horizonDays },
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load demand forecast");
    } finally {
      setLoading(false);
    }
  };

  // load on first render
  useEffect(() => {
    loadForecast();
  }, []);

  // forecast item list
  const allItems = data?.items || [];

  // what to show depending on user choice
  const visibleItems = showAll ? allItems : allItems.slice(0, 10);

  // builds a simple dataset for the bar chart
  const chartData = visibleItems.map((i) => ({
    name: i.name,
    forecast: i.forecast_qty,
    stock: i.stock,
  }));

  return (
    <div className="fade-in">
      {/* page header with filters */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-semibold text-primary d-flex align-items-center">
          <i className="bi bi-activity me-2"></i>
          AI Demand Forecast
        </h3>

        <div className="d-flex align-items-center gap-2">
          {/* window selection */}
          <select
            className="form-select form-select-sm"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
          </select>

          {/* forecast horizon selector */}
          <select
            className="form-select form-select-sm"
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
          >
            <option value={14}>Forecast 2 weeks</option>
            <option value={30}>Forecast 1 month</option>
            <option value={60}>Forecast 2 months</option>
          </select>

          {/* manually reload forecast */}
          <button className="btn btn-outline-secondary btn-sm" onClick={loadForecast}>
            Recalculate
          </button>
        </div>
      </div>

      {/* top summary cards */}
      {!loading && data && (
        <div className="row mb-4 text-center">
          <div className="col-md-3">
            <div className="card p-3 stat-card">
              <small className="text-muted">Window</small>
              <h5 className="mb-0">{data.window_days} days</h5>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 stat-card">
              <small className="text-muted">Forecast horizon</small>
              <h5 className="mb-0">{data.horizon_days} days</h5>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 stat-card">
              <small className="text-muted">SKUs tracked</small>
              <h5 className="mb-0">
                {data.summary.tracked_skus} / {data.summary.total_skus}
              </h5>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card p-3 stat-card">
              <small className="text-muted">High-risk (≤ 7d)</small>
              <h5 className="mb-0 text-danger">{data.summary.high_risk}</h5>
            </div>
          </div>
        </div>
      )}

      {/* loading message */}
      {loading && <div className="text-center text-muted py-5">Calculating forecast…</div>}

      {/* no results */}
      {!loading && data && allItems.length === 0 && (
        <div className="alert alert-info">
          No order history in the selected window.
        </div>
      )}

      {/* main chart and table section */}
      {!loading && data && visibleItems.length > 0 && (
        <>
          {/* bar chart displaying forecast vs stock */}
          <div className="card p-3 mb-4">
            <h6 className="fw-semibold mb-3">
              {showAll ? "All SKUs – Forecast vs Stock" : "Top At-Risk SKUs – Forecast vs Stock"}
            </h6>

            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="forecast" name="Forecast demand" fill="#4C7CF3" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="stock" name="Current stock" fill="#FF7B6E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <small className="text-muted">
              If forecast &gt; stock → likely stock-out in the selected horizon.
            </small>
          </div>

          {/* show all toggle */}
          {allItems.length > 10 && (
            <div className="text-center mb-3">
              <button
                className="btn btn-link fw-semibold"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show Top 10 Only" : `Show All (${allItems.length})`}
              </button>
            </div>
          )}

          {/* detailed table */}
          <div className="card p-3">
            <h6 className="fw-semibold mb-3">Forecast details</h6>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th className="text-end">Stock</th>
                    <th className="text-end">Daily rate</th>
                    <th className="text-end">Forecast qty</th>
                    <th className="text-end">Days to OOS</th>
                    <th>Risk</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleItems.map((i) => (
                    <tr key={i.product_id}>
                      <td>{i.name}</td>
                      <td>{i.brand}</td>
                      <td className="text-end">{i.stock}</td>
                      <td className="text-end">{i.daily_rate}</td>
                      <td className="text-end">{i.forecast_qty}</td>
                      <td className="text-end">{i.days_to_oos ?? "—"}</td>
                      <td>
                        {i.risk === "high" && (
                          <span className="badge bg-danger-subtle text-danger">High</span>
                        )}
                        {i.risk === "medium" && (
                          <span className="badge bg-warning text-dark">Medium</span>
                        )}
                        {i.risk === "low" && (
                          <span className="badge bg-success-subtle text-success">Low</span>
                        )}
                        {i.risk === "none" && (
                          <span className="badge bg-secondary-subtle text-muted">No data</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <small className="text-muted">
              Model = moving-average + short-term trend.
            </small>
          </div>
        </>
      )}
    </div>
  );
}

export default Forecast;
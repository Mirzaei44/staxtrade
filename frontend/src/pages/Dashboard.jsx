import React, { useEffect, useState } from "react";
import API from "../api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

function Dashboard() {
  // main summary numbers: products, brands, orders
  const [summary, setSummary] = useState(null);

  // analytic datasets for charts and tables
  const [topProducts, setTopProducts] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [dailyOrders, setDailyOrders] = useState([]);
  const [brandRevenue, setBrandRevenue] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  // simple color palette reused by multiple charts
  const COLORS = [
    "#4C7CF3",
    "#32C1A4",
    "#FFCB57",
    "#FF7B6E",
    "#8F63FF",
    "#E76DD6",
    "#5ABFFF",
    "#9AD95A",
  ];

  // refresh analytics every 10 seconds if the switch is on
  useEffect(() => {
    fetchAllAnalytics();
    const timer = setInterval(() => {
      if (autoRefresh) fetchAllAnalytics();
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  // loads all API analytics at once so UI updates together
  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);

      // fetch everything in parallel
      const [
        summaryRes,
        topRes,
        monthRes,
        dailyRes,
        brandRevRes,
        lowStockRes,
      ] = await Promise.all([
        API.get("summary/"),
        API.get("analytics/top-products/"),
        API.get("analytics/monthly-revenue/"),
        API.get("analytics/daily-orders/"),
        API.get("analytics/brand-revenue/"),
        API.get("analytics/low-stock/"),
      ]);

      // summary numbers for KPI cards
      setSummary(summaryRes.data);

      // normalise top-selling product rows
      const topMapped = (topRes.data || []).map((row) => ({
        name: row.product__name,
        total: row.total,
      }));
      setTopProducts(topMapped);

      // format monthly revenue dates
      const monthMapped = (monthRes.data || []).map((row) => ({
        month: row.month
          ? new Date(row.month).toLocaleDateString("en-GB", {
              month: "short",
              year: "2-digit",
            })
          : "Unknown",
        revenue: Number(row.revenue || 0),
      }));
      setMonthlyRevenue(monthMapped);

      // format daily order counts
      const dailyMapped = (dailyRes.data || []).map((row) => ({
        day: row.day
          ? new Date(row.day).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            })
          : "Unknown",
        count: row.count,
      }));
      setDailyOrders(dailyMapped);

      // convert brand revenue rows
      const brandRevMapped = (brandRevRes.data || []).map((row) => ({
        name: row.name || "Unknown",
        revenue: Number(row.revenue || 0),
      }));
      setBrandRevenue(brandRevMapped);

      // store low-stock list
      setLowStock(lowStockRes.data || []);

      // update the last updated time for UI
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);

      // small “updated” animation on the badge
      const el = document.getElementById("updated-badge");
      if (el) {
        el.classList.add("updated-ping");
        setTimeout(() => el.classList.remove("updated-ping"), 800);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setLoading(false);
    }
  };

  // tiny skeleton used for card placeholders
  const CardSkeleton = () => (
    <div className="card shadow-sm p-4 placeholder-glow">
      <div className="placeholder col-6 mb-2"></div>
      <div className="placeholder col-4"></div>
    </div>
  );

  // basic helpers for KPI summaries below the charts
  const latestMonth =
    monthlyRevenue.length > 0
      ? monthlyRevenue[monthlyRevenue.length - 1]
      : null;

  const peakMonth =
    monthlyRevenue.length > 0
      ? monthlyRevenue.reduce(
          (best, row) =>
            !best || row.revenue > best.revenue ? row : best,
          null
        )
      : null;

  const lastDay =
    dailyOrders.length > 0 ? dailyOrders[dailyOrders.length - 1] : null;

  const avgDailyOrders =
    dailyOrders.length > 0
      ? Math.round(
          dailyOrders.reduce((sum, r) => sum + (r.count || 0), 0) /
            dailyOrders.length
        )
      : 0;

  const dailyTrendLabel =
    lastDay && avgDailyOrders
      ? lastDay.count >= avgDailyOrders
        ? "Above average"
        : "Below average"
      : "No recent orders";

  const maxTopTotal =
    topProducts.length > 0
      ? Math.max(...topProducts.map((p) => p.total || 0))
      : 0;

  // gives each low stock item a simple severity label
  const stockSeverity = (stock) => {
    if (stock <= 0) return "Critical";
    if (stock <= 2) return "High";
    if (stock <= 5) return "Medium";
    return "Low";
  };

  return (
    <div className="dashboard-page fade-in">
      {/* Page header with auto-refresh switch */}
      <div className="dashboard-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="dashboard-title fw-semibold text-primary">
            <i className="bi bi-graph-up-arrow me-2"></i>
            Dashboard Summary
          </h3>
          <p className="dashboard-subtitle text-muted mb-0">
            Overview of product, brand and order performance.
          </p>
        </div>

        <div className="dashboard-header-meta d-flex align-items-center gap-3 text-muted">
          <span
            id="updated-badge"
            className="badge bg-light text-dark"
            style={{ transition: "0.3s" }}
          >
            Last updated: <strong>{lastUpdated || "—"}</strong>
          </span>

          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
            />
            <label className="form-check-label">Auto refresh</label>
          </div>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={fetchAllAnalytics}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="row g-4 text-center mb-2 kpi-row">
        {loading || !summary ? (
          <>
            <div className="col-md-4"><CardSkeleton /></div>
            <div className="col-md-4"><CardSkeleton /></div>
            <div className="col-md-4"><CardSkeleton /></div>
          </>
        ) : (
          <>
            <div className="col-md-4">
              <div className="card stat-card dashboard-kpi-card p-4">
                <span className="kpi-label text-muted">Products</span>
                <h2 className="kpi-value fw-bold">{summary.products}</h2>
                <span className="kpi-caption text-muted">
                  Active SKUs in catalogue
                </span>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card stat-card dashboard-kpi-card p-4">
                <span className="kpi-label text-muted">Brands</span>
                <h2 className="kpi-value fw-bold">{summary.brands}</h2>
                <span className="kpi-caption text-muted">
                  Total suppliers
                </span>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card stat-card dashboard-kpi-card p-4">
                <span className="kpi-label text-muted">Orders</span>
                <h2 className="kpi-value fw-bold">{summary.orders}</h2>
                <span className="kpi-caption text-muted">
                  Orders in the last 30 days
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CHART ROW 1 */}
      <div className="row g-4 mt-2">
        {/* products per brand bar chart */}
        <div className="col-md-6">
          <div className="card dashboard-card p-4">
            <div className="dashboard-card-header d-flex justify-content-between align-items-center mb-2">
              <h6 className="text-uppercase mb-0">Products per Brand</h6>
              <span className="chip chip-soft">Catalogue mix</span>
            </div>

            {loading || !summary ? (
              <div className="text-center text-muted p-5 placeholder-glow">
                <div className="placeholder col-8 mb-3"></div>
                <div className="placeholder col-10"></div>
              </div>
            ) : summary.by_brand.length === 0 ? (
              <div className="text-center text-muted py-5">
                No product data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.by_brand}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="#4C7CF3"
                    radius={[6, 6, 0, 0]}
                    animationDuration={900}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* revenue per brand pie chart */}
        <div className="col-md-6">
          <div className="card dashboard-card p-4">
            <div className="dashboard-card-header d-flex justify-content-between align-items-center mb-2">
              <h6 className="text-uppercase mb-0">Revenue by Brand (£)</h6>
              <span className="chip chip-soft chip-green">Share of revenue</span>
            </div>

            {loading ? (
              <div className="text-center text-muted p-5 placeholder-glow">
                <div className="placeholder col-6 mb-3"></div>
                <div className="placeholder col-8"></div>
              </div>
            ) : brandRevenue.length === 0 ? (
              <div className="text-center text-muted py-5">
                No revenue data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={brandRevenue}
                    dataKey="revenue"
                    nameKey="name"
                    outerRadius={110}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    animationDuration={900}
                  >
                    {brandRevenue.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* CHART ROW 2 */}
      <div className="row g-4 mt-2">
        {/* monthly revenue line chart */}
        <div className="col-md-6">
          <div className="card dashboard-card p-4">
            <div className="dashboard-card-header d-flex justify-content-between align-items-center mb-2">
              <h6 className="text-uppercase mb-0">
                Monthly Revenue Trend (£)
              </h6>
              <span className="chip chip-soft">Last 12 months</span>
            </div>

            {/* quick stats above the chart */}
            {!loading && monthlyRevenue.length > 0 && (
              <div className="d-flex justify-content-between mb-2 small text-muted">
                <div>
                  <span className="text-uppercase">Latest month</span>
                  <div className="fw-semibold text-dark">
                    {latestMonth?.month} ·{" "}
                    {latestMonth
                      ? `£${latestMonth.revenue.toLocaleString("en-GB")}`
                      : "—"}
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-uppercase">Peak month</span>
                  <div className="fw-semibold text-dark">
                    {peakMonth?.month} ·{" "}
                    {peakMonth
                      ? `£${peakMonth.revenue.toLocaleString("en-GB")}`
                      : "—"}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center text-muted p-5 placeholder-glow">
                <div className="placeholder col-7 mb-3"></div>
                <div className="placeholder col-9"></div>
              </div>
            ) : monthlyRevenue.length === 0 ? (
              <div className="text-center text-muted py-5">
                No orders yet to show revenue.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#32C1A4"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* daily orders line chart */}
        <div className="col-md-6">
          <div className="card dashboard-card p-4">
            <div className="dashboard-card-header d-flex justify-content-between align-items-center mb-2">
              <h6 className="text-uppercase mb-0">
                Daily Orders (recent)
              </h6>
              <span className="chip chip-soft chip-orange">Activity</span>
            </div>

            {/* quick KPIs above the chart */}
            {!loading && dailyOrders.length > 0 && (
              <div className="d-flex justify-content-between mb-2 small text-muted">
                <div>
                  <span className="text-uppercase">Last day</span>
                  <div className="fw-semibold text-dark">
                    {lastDay?.day} ·{" "}
                    {lastDay ? `${lastDay.count} orders` : "—"}
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-uppercase">Trend</span>
                  <div className="fw-semibold text-dark">
                    {dailyTrendLabel}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center text-muted p-5 placeholder-glow">
                <div className="placeholder col-7 mb-3"></div>
                <div className="placeholder col-9"></div>
              </div>
            ) : dailyOrders.length === 0 ? (
              <div className="text-center text-muted py-5">
                No order activity yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dailyOrders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#FF7B6E"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3 – top products + low stock table */}
      <div className="row g-4 mt-2">
        {/* top selling products */}
        <div className="col-md-6">
          <div className="card dashboard-card p-4">
            <div className="dashboard-card-header d-flex justify-content-between align-items-center mb-2">
              <h6 className="text-uppercase mb-0">Top Selling Products</h6>
              <span className="chip chip-soft chip-purple">
                By order volume
              </span>
            </div>

            {loading ? (
              <div className="text-muted placeholder-glow">
                <div className="placeholder col-12 mb-2"></div>
                <div className="placeholder col-10 mb-2"></div>
                <div className="placeholder col-8 mb-2"></div>
              </div>
            ) : topProducts.length === 0 ? (
              <div className="text-muted">No sales yet.</div>
            ) : (
              <ul className="list-group list-group-flush dashboard-list">
                {topProducts.slice(0, 8).map((p, idx) => {
                  const ratio =
                    maxTopTotal > 0 ? (p.total / maxTopTotal) * 100 : 0;

                  return (
                    <li
                      key={p.name}
                      className="list-group-item d-flex flex-column"
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="d-flex align-items-center gap-2">
                          <span className="badge rank-badge">
                            #{idx + 1}
                          </span>
                          <span>{p.name}</span>
                        </span>
                        <span className="badge bg-light text-dark">
                          {p.total} orders
                        </span>
                      </div>

                      {/* small progress bar for ranking */}
                      <div
                        className="w-100"
                        style={{
                          height: 4,
                          borderRadius: 999,
                          background: "rgba(148,163,184,0.25)",
                        }}
                      >
                        <div
                          style={{
                            width: `${ratio}%`,
                            height: "100%",
                            borderRadius: 999,
                            background:
                              "linear-gradient(90deg,#2563eb,#4f46e5)",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* low stock table */}
        <div className="col-md-6">
          <div className="card dashboard-card p-4">
            <div className="dashboard-card-header d-flex justify-content-between align-items-center mb-2">
              <h6 className="text-uppercase mb-0">Low Stock Alerts</h6>
              <span className="chip chip-warning">
                {lowStock.length} at risk
              </span>
            </div>

            {loading ? (
              <div className="text-muted placeholder-glow">
                <div className="placeholder col-12 mb-2"></div>
                <div className="placeholder col-10 mb-2"></div>
                <div className="placeholder col-8 mb-2"></div>
              </div>
            ) : lowStock.length === 0 ? (
              <div className="text-muted">All good. No low stock lines.</div>
            ) : (
              <div className="table-container">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Brand</th>
                      <th className="text-end">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((p) => {
                      const sev = stockSeverity(p.stock);
                      const sevClass =
                        sev === "Critical"
                          ? "bg-danger-subtle text-danger"
                          : sev === "High"
                          ? "bg-warning-subtle text-warning"
                          : sev === "Medium"
                          ? "bg-info-subtle text-info"
                          : "bg-light text-muted";

                      return (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>{p.brand}</td>
                          <td className="text-end">
                            <span
                              className={`badge ${sevClass}`}
                              style={{ minWidth: 52 }}
                            >
                              {p.stock} · {sev}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
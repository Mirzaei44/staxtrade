import React, { useState, useEffect, useCallback } from "react";
import API from "../api";
import { toast } from "react-toastify";

function Products() {
  // full product list + brand list
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);

  // user filters
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [ordering, setOrdering] = useState("");

  // product form (add/edit)
  const [form, setForm] = useState({ name: "", price: "", brand: "" });
  const [editing, setEditing] = useState(null); // when not null → editing mode

  // pagination
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  // threshold for low stock highlight
  const LOW_STOCK = 10;

  // ---------------------------------------------------
  // Load products + brands whenever filters/page change
  // ---------------------------------------------------
  const fetchAll = useCallback(async () => {
    try {
      const prodRes = await API.get("products/", {
        params: {
          page,
          search,
          brand: brandFilter || undefined,
          ordering: ordering || undefined,
        },
      });

      const brandRes = await API.get("brands/");

      setProducts(prodRes.data.results || []);
      setBrands(brandRes.data.results || brandRes.data);
      setCount(prodRes.data.count);

    } catch (err) {
      toast.error("Failed to load products");
    }
  }, [page, search, brandFilter, ordering]);

  // run fetch on start + whenever filters change
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---------------------------------------------------
  // Start editing an item (prefill the form)
  // ---------------------------------------------------
  const startEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      brand: p.brand,
    });
  };

  // ---------------------------------------------------
  // Add new product OR update existing one
  // ---------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.brand)
      return toast.error("Fill all fields");

    // payload sent to backend
    const payload = {
      name: form.name,
      price: form.price,
      brand: form.brand,
      stock: editing ? editing.stock : 50, // default for new product
    };

    try {
      if (editing) {
        await API.put(`products/${editing.id}/`, payload);
        toast.success("Updated");
      } else {
        await API.post("products/", payload);
        toast.success("Added");
      }

      // reset the form after saving
      setForm({ name: "", price: "", brand: "" });
      setEditing(null);
      fetchAll();

    } catch {
      toast.error("Error saving product");
    }
  };

  // ---------------------------------------------------
  // Delete a product
  // ---------------------------------------------------
  const handleDelete = async (id) => {
    try {
      await API.delete(`products/${id}/`);
      toast.success("Deleted");
      fetchAll();
    } catch {
      toast.error("Delete failed");
    }
  };

  // ---------------------------------------------------
  // Quick stock adjust from table (+ or -)
  // ---------------------------------------------------
  const adjustStock = async (id, amount) => {
    try {
      await API.post(`products/${id}/adjust_stock/`, { amount });
      fetchAll();
    } catch {
      toast.error("Failed to adjust stock");
    }
  };

  // ---------------------------------------------------
  // Auto-restock low-stock items on this page
  // ---------------------------------------------------
  const restockAllLowStock = async () => {
    const lowItems = products.filter((p) => p.stock < LOW_STOCK);

    if (lowItems.length === 0) {
      return toast.info("No low-stock items on this page.");
    }

    toast.info(`Restocking ${lowItems.length} items…`);

    for (const item of lowItems) {
      // simple rule: bring each item back to LOW_STOCK minimum
      let amount = item.stock === 0 ? 20 : LOW_STOCK - item.stock;

      try {
        await API.post(`products/${item.id}/adjust_stock/`, { amount });
      } catch {
        console.warn("Restock failed for item", item.id);
      }
    }

    toast.success("All low-stock items restocked");
    fetchAll();
  };

  // ---------------------------------------------------
  // Sort by clicking table headers
  // If you click the same header twice → reverse order
  // ---------------------------------------------------
  const doSort = (field) => {
    setOrdering((prev) => (prev === field ? `-${field}` : field));
  };

  // number of pages based on backend count
  const totalPages = Math.ceil(count / 10);

  return (
    <div className="fade-in">
      <h3 className="text-center mb-4 fw-semibold text-primary">
        <i className="bi bi-bag-check-fill me-2"></i> Products
      </h3>

      {/* Search + Filters */}
      <div className="row mb-3 g-2">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        <div className="col-md-4">
          <select
            className="form-select"
            value={brandFilter}
            onChange={(e) => {
              setPage(1);
              setBrandFilter(e.target.value);
            }}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="col-md-2">
          <button
            className="btn btn-secondary w-100"
            onClick={() => {
              setSearch("");
              setBrandFilter("");
              setOrdering("");
              fetchAll();
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Product Add/Edit Form */}
      <form onSubmit={handleSubmit} className="row g-3 mb-4">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="col-md-3">
          <input
            type="number"
            className="form-control"
            placeholder="Price (£)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          >
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="col-md-2 d-grid">
          <button className={`btn ${editing ? "btn-warning" : "btn-success"}`}>
            {editing ? "Update" : "Add"}
          </button>
        </div>
      </form>

      {/* Auto-restock button */}
      <div className="d-flex justify-content-end mb-2">
        <button
          className="btn btn-warning fw-semibold"
          onClick={restockAllLowStock}
        >
          <i className="bi bi-lightning-charge me-1"></i>
          Auto-Restock Low-Stock Items
        </button>
      </div>

      {/* Product Table */}
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th onClick={() => doSort("name")} style={{ cursor: "pointer" }}>Name</th>
            <th>Brand</th>
            <th onClick={() => doSort("price")} style={{ cursor: "pointer" }}>Price</th>
            <th onClick={() => doSort("stock")} style={{ cursor: "pointer" }}>Stock</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={p.stock < LOW_STOCK ? "table-danger" : ""}>
              <td>{p.name}</td>
              <td>{p.brand_name}</td>
              <td>£{p.price}</td>

              <td>
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => adjustStock(p.id, -1)}
                  >
                    –
                  </button>

                  <span className={p.stock < LOW_STOCK ? "text-danger fw-bold" : ""}>
                    {p.stock}
                  </span>

                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => adjustStock(p.id, +1)}
                  >
                    +
                  </button>
                </div>
              </td>

              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => startEdit(p)}
                >
                  Edit
                </button>

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(p.id)}
                >
                  Delete
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="d-flex justify-content-between mt-3">
        <small className="text-muted">
          Page {page} / {totalPages} — {count} items
        </small>

        <div className="btn-group">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ‹ Prev
          </button>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}

export default Products;
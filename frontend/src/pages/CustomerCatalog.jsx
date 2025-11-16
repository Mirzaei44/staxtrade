import React, { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

function CustomerCatalog() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  // Load cart from localStorage when the page loads
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("cart") || "[]")
  );

  // Saves cart changes and notifies navbar
  const saveCart = (newCart) => {
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Loads the full catalog from backend
  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await API.get("customer/catalog/");
      const results = res.data.results || [];

      setProducts(results);
      setFiltered(results);

      // Collect brand names for the dropdown
      setBrands([...new Set(results.map((p) => p.brand))]);
    } catch (err) {
      toast.error("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Re-run filters whenever search text or brand filter changes
  useEffect(() => {
    let temp = [...products];

    if (search.trim() !== "") {
      temp = temp.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (brandFilter !== "") {
      temp = temp.filter((p) => p.brand === brandFilter);
    }

    setFiltered(temp);
  }, [search, brandFilter, products]);

  // Adds a product to the cart or bumps qty if already added
  const addToCart = (item) => {
    const exists = cart.find((c) => c.id === item.id);
    let newCart;

    if (exists) {
      newCart = cart.map((c) =>
        c.id === item.id ? { ...c, qty: c.qty + 1 } : c
      );
    } else {
      newCart = [...cart, { ...item, qty: 1 }];
    }

    setCart(newCart);
    saveCart(newCart);
    toast.success("Added to cart");
  };

  // Skeleton loaders while we fetch products
  const SkeletonCard = () => (
    <div className="col-md-4 mb-3">
      <div
        className="card p-4 placeholder-glow"
        style={{ height: "220px", borderRadius: "16px" }}
      >
        <div className="placeholder col-8 mb-2"></div>
        <div className="placeholder col-5 mb-4"></div>
        <div className="placeholder col-6 mb-2"></div>
        <div className="placeholder col-4"></div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-semibold text-primary d-flex align-items-center">
          <i className="bi bi-shop-window me-2"></i>
          Product Catalog
        </h3>
      </div>

      {/* Search + brand filters */}
      <div className="row mb-4 g-2 align-items-end">
        <div className="col-md-5">
          <div className="input-group">
            <span className="input-group-text bg-light">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="form-control"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="col-md-4">
          <select
            className="form-select"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3 text-end">
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              setSearch("");
              setBrandFilter("");
            }}
          >
            Clear filters
          </button>
        </div>
      </div>

      <p className="text-muted mb-3">{filtered.length} products found</p>

      {/* Main product grid */}
      <div className="row">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted p-5">No products found.</div>
        ) : (
          filtered.map((p) => (
            <div className="col-md-4 mb-4" key={p.id}>
              <div
                className="card shadow-sm p-3 catalog-card"
                style={{
                  borderRadius: "16px",
                  transition: "0.25s",
                  cursor: "pointer",
                }}
              >
                {/* Brand label */}
                <span className="badge bg-primary-subtle text-primary mb-2">
                  {p.brand}
                </span>

                {/* Product name */}
                <h5 className="fw-semibold">{p.name}</h5>

                {/* Price and discount */}
                <div className="mt-2">
                  <span className="fw-bold text-primary fs-4">
                    £{p.effective_price}
                  </span>

                  {p.discount_percent > 0 && (
                    <span className="ms-2 text-success fw-semibold">
                      -{p.discount_percent}%
                    </span>
                  )}
                </div>

                {/* Stock indicator */}
                <div className="mt-1">
                  {p.stock > 20 ? (
                    <span className="badge bg-success-subtle text-success">
                      In stock
                    </span>
                  ) : p.stock > 5 ? (
                    <span className="badge bg-warning text-dark">
                      Low stock ({p.stock})
                    </span>
                  ) : (
                    <span className="badge bg-danger-subtle text-danger">
                      Very low ({p.stock})
                    </span>
                  )}
                </div>

                {/* Add to cart button */}
                <button
                  className="btn btn-primary btn-sm mt-3 w-100"
                  onClick={() => addToCart(p)}
                >
                  <i className="bi bi-bag-plus me-1"></i>
                  Add to cart
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slight hover animation for cards */}
      <style>
        {`
        .catalog-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.15);
        }
      `}
      </style>
    </div>
  );
}

export default CustomerCatalog;
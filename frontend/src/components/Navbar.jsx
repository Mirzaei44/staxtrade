import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const mode = localStorage.getItem("portal_mode") || "admin";

  // LIVE CART COUNT
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const readCart = () => {
      const c = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(c.length);
    };

    readCart();

    // Listen for changes from other pages
    window.addEventListener("cartUpdated", readCart);
    return () => window.removeEventListener("cartUpdated", readCart);
  }, []);

  const switchMode = () => {
    const newMode = mode === "admin" ? "customer" : "admin";
    localStorage.setItem("portal_mode", newMode);
    navigate(newMode === "admin" ? "/dashboard" : "/customer/catalog");
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  const goToCart = () => {
    navigate("/customer/cart");
  };

  return (
    <nav className="navbar navbar-expand-lg bg-white shadow-sm">
      <div className="container">
        <span
          className="navbar-brand fw-semibold text-primary"
          style={{ cursor: "pointer" }}
          onClick={() =>
            navigate(mode === "admin" ? "/dashboard" : "/customer/catalog")
          }
        >
          <i className="bi bi-box-seam me-2"></i> StaxTrade
        </span>

        <button
          className="navbar-toggler"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div id="nav" className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            {mode === "admin" ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/dashboard">
                    Dashboard
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink className="nav-link" to="/products">
                    Products
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink className="nav-link" to="/inventory">
                    Intelligence
                  </NavLink>
                </li>

                {/* ⭐ NEW: Forecast AI */}
                <li className="nav-item">
                  <NavLink className="nav-link" to="/forecast">
                    Forecast AI
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/customer/catalog">
                    Catalog
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink className="nav-link" to="/customer/orders">
                    My Orders
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">

            {/* ⭐ CART BUTTON (Customer Mode Only) */}
            {mode === "customer" && (
              <button
                onClick={goToCart}
                className="btn btn-sm btn-outline-primary position-relative"
              >
                <i className="bi bi-cart3"></i>
                <span className="ms-1">Cart</span>

                {/* Badge */}
                {cartCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "0.65rem" }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            <button className="btn btn-sm btn-warning" onClick={switchMode}>
              <i className="bi bi-intersect me-1"></i>
              Switch to {mode === "admin" ? "Customer Portal" : "Admin Panel"}
            </button>

            <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
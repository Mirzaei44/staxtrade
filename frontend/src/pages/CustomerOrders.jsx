import React, { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Loads the user's orders from the backend
  const loadOrders = async () => {
    try {
      const res = await API.get("customer/orders/");
      setOrders(res.data); // store them in state
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false); // stop loading spinner either way
    }
  };

  // Fetch orders when the page first loads
  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="fade-in">
      <h3 className="fw-semibold text-primary mb-4">
        <i className="bi bi-bag-check me-2"></i>
        My Orders
      </h3>

      {/* Show loading message while API is running */}
      {loading ? (
        <div className="text-muted text-center p-5">Loading orders...</div>
      ) : orders.length === 0 ? (
        // If no orders exist
        <div className="alert alert-info">You have no orders yet.</div>
      ) : (
        // Normal table view
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Qty</th>
                <th>Total (£)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.product}</td>
                  <td>{o.brand}</td>
                  <td>{o.quantity}</td>
                  <td>{o.total_price}</td>
                  {/* Display order date in a readable way */}
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CustomerOrders;
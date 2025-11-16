import React, { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

function Cart() {
  const [cart, setCart] = useState([]);
  const [justOrdered, setJustOrdered] = useState(false);

  // Load the cart from localStorage when the page opens
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(saved);
  }, []);

  // Saves the cart and lets the navbar know something changed
  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Adjusts quantity for a single product
  const changeQty = (id, delta) => {
    let updated = cart
      .map((item) =>
        item.id === id
          ? { ...item, qty: Math.max(0, item.qty + delta) }
          : item
      )
      .filter((item) => item.qty > 0); // drop items once qty hits zero

    updateCart(updated);
  };

  // Removes a product entirely
  const removeItem = (id) => {
    const updated = cart.filter((item) => item.id !== id);
    updateCart(updated);
  };

  // Generates a simple reference code for the confirmation view
  const generateRef = () => {
    return "STX-" + Math.floor(100000 + Math.random() * 900000);
  };

  const [orderRef, setOrderRef] = useState(null);

  // Sends the order to the backend
  const placeOrder = async () => {
    if (cart.length === 0) return toast.warn("Cart is empty");

    try {
      const lines = cart.map((item) => ({
        product_id: item.id,
        quantity: item.qty,
      }));

      await API.post("customer/orders/", { lines });

      toast.success("Order placed!");

      // store the reference so we can show it
      const ref = generateRef();
      setOrderRef(ref);
      setJustOrdered(true);

      updateCart([]); // empty the cart afterwards
    } catch (err) {
      console.error(err);
      toast.error("Order failed");
    }
  };

  // Total cost shown at the bottom
  const grandTotal = cart.reduce(
    (sum, item) => sum + item.qty * item.effective_price,
    0
  );

  return (
    <div className="fade-in">
      <h3 className="fw-semibold mb-4 d-flex align-items-center text-primary">
        <i className="bi bi-bag-check me-2"></i>
        Your Cart
      </h3>

      {/* After placing an order, this confirmation card is shown */}
      {cart.length === 0 && justOrdered && (
        <div className="card shadow-sm p-5 text-center bg-light border-0">
          <i className="bi bi-check-circle-fill text-success fs-1 mb-3"></i>

          <h4 className="fw-bold text-success mb-2">Order Placed Successfully</h4>

          <p className="text-muted mb-1">
            Your order has been submitted for processing.
          </p>

          <p className="fw-semibold mb-4 text-secondary">
            Order Reference: <span className="text-dark">{orderRef}</span>
          </p>

          <div className="d-flex justify-content-center gap-3">
            <button
              className="btn btn-primary"
              onClick={() => (window.location.href = "/customer/catalog")}
            >
              <i className="bi bi-shop-window me-1"></i>
              Continue Shopping
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => (window.location.href = "/customer/orders")}
            >
              <i className="bi bi-receipt me-1"></i>
              View My Orders
            </button>
          </div>

          <small className="text-muted d-block mt-4">
            (In a full B2B ecommerce setup this screen would include more details,  
            but here it's kept clean so the focus is on the flow.)
          </small>
        </div>
      )}

      {/* If the user has not ordered and their cart is empty */}
      {cart.length === 0 && !justOrdered && (
        <div className="card shadow-sm p-5 text-center bg-light border-0">
          <i className="bi bi-bag-dash text-muted fs-1 mb-3"></i>
          <h5 className="fw-semibold text-muted">Your cart is empty.</h5>
        </div>
      )}

      {/* Normal cart view */}
      {cart.length > 0 && (
        <>
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-end">Price</th>
                <th className="text-end">Qty</th>
                <th className="text-end">Total</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <small className="text-muted">{item.brand}</small>
                  </td>

                  <td className="text-end">
                    £{item.effective_price.toFixed(2)}
                  </td>

                  <td>
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => changeQty(item.id, -1)}
                      >
                        -
                      </button>

                      <span className="fw-semibold">{item.qty}</span>

                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => changeQty(item.id, +1)}
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td className="text-end fw-semibold">
                    £{(item.qty * item.effective_price).toFixed(2)}
                  </td>

                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total and checkout button */}
          <div className="d-flex justify-content-end fw-bold fs-5 mt-3">
            Total: £{grandTotal.toFixed(2)}
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-success btn-lg" onClick={placeOrder}>
              Place Order
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
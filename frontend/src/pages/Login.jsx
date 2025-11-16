import React, { useState } from "react";
import API from "../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

function Login() {
  // store username + password
  const [form, setForm] = useState({ username: "", password: "" });

  // disables the button during request
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // handles the login submit
  const handleLogin = async (e) => {
    e.preventDefault(); // stop page reload
    setLoading(true);

    try {
      // send credentials to backend
      const res = await API.post("login/", form);

      // store JWT tokens for later API calls
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      // show small success message
      toast.success("✅ Welcome back!", { position: "top-center" });

      // short delay before redirect (UI feels smoother)
      setTimeout(() => navigate("/dashboard"), 800);

    } catch (error) {
      console.error("Login error:", error);

      // wrong password or username
      if (error.response?.status === 401) {
        toast.error("❌ Invalid username or password", { position: "top-center" });

      // backend offline or unreachable
      } else if (error.code === "ERR_NETWORK") {
        toast.error("⚠️ Cannot connect to server", { position: "top-center" });

      // fallback for any unexpected error
      } else {
        toast.error("Something went wrong. Please try again.", { position: "top-center" });
      }

    } finally {
      setLoading(false); // re-enable login button
    }
  };

  return (
    <div className="col-md-4 mx-auto mt-5 fade-in">
      <h3 className="mb-4 text-center text-primary">
        <i className="bi bi-person-lock me-2"></i>Login
      </h3>

      {/* login card */}
      <form onSubmit={handleLogin} className="card p-4 shadow-sm border-0">
        {/* username input */}
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />

        {/* password input */}
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {/* login button */}
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      {/* notification system */}
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default Login;
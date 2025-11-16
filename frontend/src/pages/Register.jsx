import React, { useState } from "react";
import API from "../api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

function Register() {
  // form data
  const [form, setForm] = useState({ username: "", password: "" });

  // store validation messages
  const [errors, setErrors] = useState({});

  // loading spinner state
  const [loading, setLoading] = useState(false);

  // used to move user to Login page after successful signup
  const navigate = useNavigate();

  // Simple client-side validation before sending to backend
  const validate = () => {
    const newErrors = {};

    // username rules
    if (!form.username.trim()) newErrors.username = "Username is required.";
    else if (form.username.length < 3)
      newErrors.username = "Username must be at least 3 characters.";

    // password rules
    if (!form.password.trim()) newErrors.password = "Password is required.";
    else if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";
    else if (!/\d/.test(form.password))
      newErrors.password = "Password must contain at least one number.";

    setErrors(newErrors);

    // only valid if no errors found
    return Object.keys(newErrors).length === 0;
  };

  // send user registration to backend
  const handleRegister = async (e) => {
    e.preventDefault();

    // if validation fails → stop
    if (!validate()) return;

    setLoading(true);

    try {
      await API.post("register/", form);

      // notify user and redirect after short delay
      toast.success("Account created successfully! Please log in.", {
        position: "top-center",
      });

      setTimeout(() => navigate("/login"), 1500);

    } catch (error) {
      // backend sent error message
      if (error.response?.data?.error) {
        toast.error(error.response.data.error, { position: "top-center" });

      } else {
        // generic fallback
        toast.error("Something went wrong. Try again.", {
          position: "top-center",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-md-4 mx-auto mt-5 fade-in">
      
      {/* Page title */}
      <h3 className="mb-4 text-center text-primary">
        <i className="bi bi-person-plus me-2"></i>Register
      </h3>

      {/* Signup form */}
      <form onSubmit={handleRegister} className="card p-4 shadow-sm">

        {/* Username input */}
        <div className="mb-3">
          <input
            type="text"
            className={`form-control ${
              errors.username ? "is-invalid" : ""
            }`}
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />
          {/* show username error below field */}
          {errors.username && (
            <div className="invalid-feedback">{errors.username}</div>
          )}
        </div>

        {/* Password input */}
        <div className="mb-3">
          <input
            type="password"
            className={`form-control ${
              errors.password ? "is-invalid" : ""
            }`}
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
          {/* show password error */}
          {errors.password && (
            <div className="invalid-feedback">{errors.password}</div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="btn btn-success w-100"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        {/* Link to login */}
        <p className="text-center mt-3 mb-0">
          Already have an account?{" "}
          <span
            className="text-primary"
            role="button"
            onClick={() => navigate("/login")}
          >
            Log in
          </span>
        </p>
      </form>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}

export default Register;
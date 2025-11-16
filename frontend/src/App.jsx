import React from "react";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Cart from "./pages/Cart";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Forecast from "./pages/Forecast";

import CustomerCatalog from "./pages/CustomerCatalog";
import CustomerOrders from "./pages/CustomerOrders";

import Navbar from "./components/Navbar";
import AIOpsAssistant from "./components/AIOpsAssistant";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


// Simple check: if there's an access token, user can see protected pages.
// Otherwise send them back to login.
function PrivateRoute({ children }) {
  const token = localStorage.getItem("access");
  return token ? children : <Navigate to="/login" replace />;
}


// Main layout wrapper used by every page.
// It shows navbar + AI bot only if the user is logged in.
// Login/Register pages stay clean without those elements.
function Layout({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("access");
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      {/* navbar shown for logged-in users only */}
      {token && !isLoginPage && <Navbar />}

      {/* floating AI helper on all logged-in pages */}
      {token && !isLoginPage && <AIOpsAssistant />}

      {/* main screen content */}
      <div className="container mt-5 fade-in">{children}</div>

      {/* global toast notifications */}
      <ToastContainer position="top-center" autoClose={2000} />
    </>
  );
}


export default function App() {
  const isLoggedIn = !!localStorage.getItem("access");

  return (
    <Router>
      <Routes>

        {/* Login page */}
        <Route
          path="/login"
          element={
            <Layout>
              <Login />
            </Layout>
          }
        />

        {/* Register page */}
        <Route
          path="/register"
          element={
            <Layout>
              <Register />
            </Layout>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* Product manager */}
        <Route
          path="/products"
          element={
            <Layout>
              <PrivateRoute>
                <Products />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* Inventory intelligence */}
        <Route
          path="/inventory"
          element={
            <Layout>
              <PrivateRoute>
                <Inventory />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* AI-powered demand forecast */}
        <Route
          path="/forecast"
          element={
            <Layout>
              <PrivateRoute>
                <Forecast />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* CUSTOMER PAGES */}
        
        {/* customer browsing page */}
        <Route
          path="/customer/catalog"
          element={
            <Layout>
              <PrivateRoute>
                <CustomerCatalog />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* customer personal order history */}
        <Route
          path="/customer/orders"
          element={
            <Layout>
              <PrivateRoute>
                <CustomerOrders />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* shopping cart */}
        <Route
          path="/customer/cart"
          element={
            <Layout>
              <PrivateRoute>
                <Cart />
              </PrivateRoute>
            </Layout>
          }
        />

        {/* If route doesn’t exist, redirect nicely */}
        <Route
          path="*"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/register" replace />
            )
          }
        />

      </Routes>
    </Router>
  );
}
import axios from "axios";

// base API for all requests
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api/",
});

// add access token on every request
API.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem("access");
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// handle expired access token
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL || "http://backend:8000/api/"}token/refresh/`,
          { refresh }
        );

        localStorage.setItem("access", data.access);
        API.defaults.headers.Authorization = `Bearer ${data.access}`;
        return API(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
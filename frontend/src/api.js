import axios from "axios";

const API = axios.create({
  baseURL: "/api/",
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        localStorage.clear();
        document.location = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          "/api/token/refresh/",
          { refresh }
        );

        localStorage.setItem("access", data.access);

        original.headers.Authorization = `Bearer ${data.access}`;
        return API(original);
      } catch (err) {
        localStorage.clear();
        document.location = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default API;

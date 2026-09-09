
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:4000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

// =========================
// JWT TOKEN
// =========================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// GLOBAL RESPONSE HANDLING
// =========================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// =========================
// AUTH
// =========================

export const login = async (body) => {
  const response = await api.post(
    "/auth/login",
    body
  );

  return response.data;
};

export const me = async () => {
  const response = await api.get(
    "/auth/me"
  );

  return response.data;
};

export const changePassword = async (body) => {
  const response = await api.post(
    "/auth/change-password",
    body
  );

  return response.data;
};

// =========================
// DASHBOARD
// =========================

export const dashboard = async () => {
  const response = await api.get(
    "/dashboard"
  );

  return response.data;
};

// =========================
// GENERIC CRUD
// =========================

export const list = async (
  resource,
  params = {}
) => {
  const response = await api.get(
    `/${resource}`,
    {
      params,
    }
  );

  return response.data;
};

export const create = async (
  resource,
  body
) => {
  const response = await api.post(
    `/${resource}`,
    body
  );

  return response.data;
};

export const update = async (
  resource,
  id,
  body
) => {
  const response = await api.put(
    `/${resource}/${id}`,
    body
  );

  return response.data;
};

export const remove = async (
  resource,
  id
) => {
  const response = await api.delete(
    `/${resource}/${id}`
  );

  return response.data;
};

// =========================
// STUDENT REGISTRATION
// =========================
// Registration itself now completes admission.
// No separate admission API is required.

export const registerStudent = async (
  body
) => {
  const response = await api.post(
    "/accountant/registrations",
    body
  );

  return response.data;
};

// =========================
// ACCOUNTANT FEE STUDENTS
// =========================

export const feeStudents = async (
  params = {}
) => {
  const response = await api.get(
    "/accountant/fee-students",
    {
      params,
    }
  );

  return response.data;
};

// =========================
// SINGLE FEE PAYMENT
// =========================

export const collectPayment = async (
  body
) => {
  const response = await api.post(
    "/accountant/payments",
    body
  );

  return response.data;
};

// =========================
// BULK FEE COLLECTION
// =========================

export const bulkCollectPayment = async (
  body
) => {
  const response = await api.post(
    "/accountant/payments/bulk",
    body
  );

  return response.data;
};

// =========================
// ACCOUNTANT PAYMENTS
// =========================

export const accountantPayments = async (
  params = {}
) => {
  const response = await api.get(
    "/accountant/payments",
    {
      params,
    }
  );

  return response.data;
};

// =========================
// ACCOUNTANT EXPENSES
// =========================

export const accountantExpenses = async (
  params = {}
) => {
  const response = await api.get(
    "/accountant/expenses",
    {
      params,
    }
  );

  return response.data;
};

export const addExpense = async (
  body
) => {
  const response = await api.post(
    "/accountant/expenses",
    body
  );

  return response.data;
};

// =========================
// ACCOUNTANT FEE STRUCTURES
// =========================

export const feeStructures = async (
  params = {}
) => {
  const response = await api.get(
    "/accountant/fee-structures",
    {
      params,
    }
  );

  return response.data;
};

export const createFeeStructure = async (
  body
) => {
  const response = await api.post(
    "/accountant/fee-structures",
    body
  );

  return response.data;
};

export const updateFeeStructure = async (
  id,
  body
) => {
  const response = await api.put(
    `/accountant/fee-structures/${id}`,
    body
  );

  return response.data;
};

// =========================
// FINANCIAL REPORT
// =========================

export const financeReport = async (
  params = {}
) => {
  const response = await api.get(
    "/accountant/reports/finance",
    {
      params,
    }
  );

  return response.data;
};

// =========================
// ATTENDANCE REPORT
// =========================

export const attendanceReport = async () => {
  const response = await api.get(
    "/reports/attendance"
  );

  return response.data;
};

// =========================
// ROLE DASHBOARD
// =========================

export const roleDashboard = async (
  role
) => {
  const response = await api.get(
    `/${String(role).toLowerCase()}/dashboard`
  );

  return response.data;
};

export default api;

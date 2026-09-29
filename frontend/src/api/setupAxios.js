import axios from 'axios';

const CUSTOMER_SESSION_EVENT = 'ripoma-customer-session';
const ADMIN_SESSION_EVENT = 'ripoma-admin-session';

const readStore = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};

const persistCustomer = (session) => {
  localStorage.setItem('customerInfo', JSON.stringify(session));
  localStorage.setItem('userInfo', JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_EVENT, { detail: session }));
};

const persistAdmin = (session) => {
  localStorage.setItem('adminInfo', JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT, { detail: session }));
};

const isJwtExpired = (token, skewMs = 30_000) => {
  if (!token || token.split('.').length < 2) return true;
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return !payload.exp || payload.exp * 1000 <= Date.now() + skewMs;
  } catch {
    return true;
  }
};

const isPublicAuthUrl = (url = '') =>
  /\/(login|register|google|verify-2fa|refresh)(\?|$)/.test(url);

const requestNeedsAdminToken = (config) => {
  const url = config.url || '';
  if (url.includes('/api/v1/auth/admin')) return true;
  if (url.includes('/api/v1/auth/customer')) return false;
  if (url.includes('/myorders')) return false;
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return true;
  }
  return false;
};

let customerRefreshInFlight = null;
let adminRefreshInFlight = null;
let interceptorsInstalled = false;

const refreshCustomerAccess = () => {
  if (customerRefreshInFlight) return customerRefreshInFlight;

  customerRefreshInFlight = (async () => {
    const stored = readStore('customerInfo') || readStore('userInfo');
    if (!stored?.refreshToken) {
      throw new Error('No customer refresh token');
    }
    const { data } = await axios.post('/api/v1/auth/customer/refresh', {
      refreshToken: stored.refreshToken,
    });
    const next = { ...stored, token: data.token };
    persistCustomer(next);
    return data.token;
  })().finally(() => {
    customerRefreshInFlight = null;
  });

  return customerRefreshInFlight;
};

const refreshAdminAccess = () => {
  if (adminRefreshInFlight) return adminRefreshInFlight;

  adminRefreshInFlight = (async () => {
    const stored = readStore('adminInfo');
    if (!stored?.refreshToken) {
      throw new Error('No admin refresh token');
    }
    const { data } = await axios.post('/api/v1/auth/admin/refresh', {
      refreshToken: stored.refreshToken,
    });
    const next = { ...stored, token: data.token };
    persistAdmin(next);
    return data.token;
  })().finally(() => {
    adminRefreshInFlight = null;
  });

  return adminRefreshInFlight;
};

const expireCustomerSession = () => {
  localStorage.removeItem('customerInfo');
  localStorage.removeItem('userInfo');
  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_EVENT, { detail: null }));
};

const expireAdminSession = () => {
  localStorage.removeItem('adminInfo');
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT, { detail: null }));
};

export const subscribeCustomerSession = (handler) => {
  const listener = (event) => handler(event.detail);
  window.addEventListener(CUSTOMER_SESSION_EVENT, listener);
  return () => window.removeEventListener(CUSTOMER_SESSION_EVENT, listener);
};

export const subscribeAdminSession = (handler) => {
  const listener = (event) => handler(event.detail);
  window.addEventListener(ADMIN_SESSION_EVENT, listener);
  return () => window.removeEventListener(ADMIN_SESSION_EVENT, listener);
};

export const installAxiosAuthInterceptors = () => {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  axios.interceptors.request.use(async (config) => {
    if (isPublicAuthUrl(config.url || '')) return config;

    const useAdmin = requestNeedsAdminToken(config);
    const stored = useAdmin
      ? readStore('adminInfo')
      : readStore('customerInfo') || readStore('userInfo');

    if (!stored?.token && !stored?.refreshToken) return config;

    let token = stored.token;
    if (isJwtExpired(token) && stored.refreshToken) {
      try {
        token = useAdmin ? await refreshAdminAccess() : await refreshCustomerAccess();
      } catch {
        if (useAdmin) expireAdminSession();
        else expireCustomerSession();
      }
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      if (!original || original._retry || isPublicAuthUrl(original.url || '')) {
        return Promise.reject(error);
      }
      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }

      original._retry = true;
      const useAdmin = requestNeedsAdminToken(original);

      try {
        const token = useAdmin ? await refreshAdminAccess() : await refreshCustomerAccess();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return axios(original);
      } catch (refreshError) {
        if (useAdmin) expireAdminSession();
        else expireCustomerSession();
        return Promise.reject(error);
      }
    }
  );
};

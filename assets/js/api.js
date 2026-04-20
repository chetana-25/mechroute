(function () {
  const hasHttpOrigin = window.location && window.location.origin && window.location.origin !== 'null' && window.location.origin.indexOf('http') === 0;
  const apiBase = window.MECHROUTE_API_BASE || (hasHttpOrigin ? window.location.origin : '');

  if (!apiBase) {
    throw new Error('MechRoute API base is not configured. Set window.MECHROUTE_API_BASE or serve the frontend over http(s).');
  }

  function getToken() {
    return localStorage.getItem('mr_token');
  }

  function setSession(payload) {
    localStorage.setItem('mr_token', payload.token);
    localStorage.setItem('mr_user', JSON.stringify(payload.user));
    if (payload.user?.role === 'driver') {
      localStorage.setItem('user_email', payload.user.email);
      localStorage.setItem('user_firstName', payload.user.firstName || payload.user.displayName || 'User');
    }
    if (payload.user?.role === 'partner') {
      localStorage.setItem('active_partner', JSON.stringify({
        name: payload.user.displayName,
        email: payload.user.email,
        type: payload.user.partnerType || 'Expert'
      }));
      localStorage.setItem('active_role', 'partner');
    }
  }

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = options.auth === false ? null : getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBase}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }

    return data;
  }

  async function registerDriver(firstName, lastName, password) {
    const email = `${String(firstName).trim().toLowerCase()}.${String(lastName).trim().toLowerCase()}@mechroute.com`;
    const result = await request('/api/auth/register/driver', {
      method: 'POST',
      auth: false,
      body: { firstName, lastName, password, email },
    });
    setSession(result);
    return result;
  }

  async function loginDriver(email, password) {
    const result = await request('/api/auth/login/driver', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    setSession(result);
    return result;
  }

  async function registerPartner(payload) {
    const result = await request('/api/auth/register/partner', {
      method: 'POST',
      auth: false,
      body: payload,
    });
    setSession(result);
    return result;
  }

  async function loginPartner(email, password) {
    const result = await request('/api/auth/login/partner', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    setSession(result);
    return result;
  }

  async function createRequest(payload) {
    return request('/api/requests', { method: 'POST', body: payload });
  }

  async function getDriverDashboard() {
    return request('/api/driver/dashboard');
  }

  async function getDriverRequests() {
    return request('/api/driver/requests');
  }

  async function cancelDriverRequest(requestId, reason) {
    return request(`/api/driver/requests/${requestId}/cancel`, {
      method: 'PATCH',
      body: { reason },
    });
  }

  async function payForRequest(requestId, paymentMethod) {
    return request(`/api/driver/requests/${requestId}/pay`, {
      method: 'POST',
      body: { paymentMethod },
    });
  }

  async function getPartnerDashboard() {
    return request('/api/partner/dashboard');
  }

  async function getPartnerJobs() {
    return request('/api/partner/jobs');
  }

  async function acceptPartnerJob(requestId) {
    return request(`/api/partner/jobs/${requestId}/accept`, { method: 'POST' });
  }

  async function markPartnerArrival(requestId) {
    return request(`/api/partner/jobs/${requestId}/arrive`, { method: 'POST' });
  }

  async function verifyPartnerOtp(requestId, otp) {
    return request(`/api/partner/jobs/${requestId}/verify-otp`, {
      method: 'POST',
      body: { otp },
    });
  }

  async function completePartnerJob(requestId) {
    return request(`/api/partner/jobs/${requestId}/complete`, { method: 'POST' });
  }

  async function getPartnerEarnings() {
    return request('/api/partner/earnings');
  }

  function clearSession() {
    localStorage.removeItem('mr_token');
    localStorage.removeItem('mr_user');
  }

  window.MechRouteAPI = {
    request,
    registerDriver,
    loginDriver,
    registerPartner,
    loginPartner,
    createRequest,
    getDriverDashboard,
    getDriverRequests,
    cancelDriverRequest,
    payForRequest,
    getPartnerDashboard,
    getPartnerJobs,
    acceptPartnerJob,
    markPartnerArrival,
    verifyPartnerOtp,
    completePartnerJob,
    getPartnerEarnings,
    setSession,
    clearSession,
  };
})();

// Auth API layer.
//
// Set EXPO_PUBLIC_API_URL in .env once the backend is ready. While it is empty,
// every call resolves against a local mock so the UI is fully testable.
//
// Contract:
//   POST {BASE}/auth/login     { email, password }                  -> { token, user }
//   POST {BASE}/auth/register  { name, email, phone, password }     -> { token, user }
//   POST {BASE}/auth/logout    (Authorization: Bearer <token>)      -> 2xx

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
const TIMEOUT_MS = 15000;

export const isMockAuth = BASE_URL.length === 0;

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function post(path, body, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new ApiError(data?.message || 'تعذر إكمال الطلب. حاول مرة أخرى.', response.status);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('انتهت مهلة الاتصال. تحقق من الشبكة.', 0);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('تعذر الاتصال بالخادم. تحقق من الإنترنت.', 0);
  } finally {
    clearTimeout(timer);
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mockUser({ name, email, phone }) {
  return {
    id: 'mock-user',
    name: name?.trim() || email.split('@')[0],
    email: email.trim(),
    phone: phone?.trim() || '',
  };
}

export async function login({ email, password }) {
  if (isMockAuth) {
    await wait(600);
    return { token: 'mock-token', user: mockUser({ email }) };
  }
  return post('/auth/login', { email, password });
}

export async function register({ name, email, phone, password }) {
  if (isMockAuth) {
    await wait(700);
    return { token: 'mock-token', user: mockUser({ name, email, phone }) };
  }
  return post('/auth/register', { name, email, phone, password });
}

export async function googleLogin() {
  if (isMockAuth) {
    await wait(700);
    return {
      token: 'mock-google-token',
      user: {
        id: 'mock-google-user',
        name: 'مستخدم Google',
        email: 'google.user@gmail.com',
        phone: '',
      },
    };
  }
  // Real OAuth (expo-auth-session + backend token exchange) goes here.
  throw new ApiError('تسجيل الدخول عبر Google غير مهيأ بعد.', 0);
}

export async function logout(token) {
  if (isMockAuth) return;
  try {
    await post('/auth/logout', {}, token);
  } catch {
    // Signing out locally must never fail because the network did.
  }
}

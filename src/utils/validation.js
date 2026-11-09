const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9\s-]{7,15}$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(value.trim());
}

export function isValidPhone(value) {
  return PHONE_RE.test(value.trim());
}

export function validateLogin({ email, password }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = 'أدخل البريد الإلكتروني';
  } else if (!isValidEmail(email)) {
    errors.email = 'البريد الإلكتروني غير صحيح';
  }

  if (!password) {
    errors.password = 'أدخل كلمة المرور';
  } else if (password.length < 6) {
    errors.password = 'كلمة المرور 6 أحرف على الأقل';
  }

  return errors;
}

export function validateRegister({ name, email, phone, password, confirm }) {
  const errors = validateLogin({ email, password });

  if (!name.trim()) {
    errors.name = 'أدخل الاسم الكامل';
  } else if (name.trim().length < 3) {
    errors.name = 'الاسم قصير جداً';
  }

  if (!phone.trim()) {
    errors.phone = 'أدخل رقم الهاتف';
  } else if (!isValidPhone(phone)) {
    errors.phone = 'رقم الهاتف غير صحيح';
  }

  if (!confirm) {
    errors.confirm = 'أعد إدخال كلمة المرور';
  } else if (confirm !== password) {
    errors.confirm = 'كلمتا المرور غير متطابقتين';
  }

  return errors;
}

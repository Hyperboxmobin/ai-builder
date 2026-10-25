// Shared client code: API calls, auth state, theme, header, toasts and Persian formatting.

export class ApiError extends Error {
  constructor(status, code, message, field) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

// Static showcase build (GitHub Pages, scripts/export-static.ts): <html data-static> marks it.
// There is no server: read-only data comes from JSON files next to the page.
export const STATIC = document.documentElement.hasAttribute('data-static');
const STATIC_DATA = { '/api/config': 'data/config.json', '/api/plans': 'data/plans.json' };

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  if (STATIC) {
    if (path === '/api/auth/me') return { user: null };
    const file = method === 'GET' && STATIC_DATA[path];
    if (!file) throw new ApiError(0, 'static', 'این بخش فقط در نسخهٔ کامل پلتفرم در دسترس است.');
    const res = await fetch(file, { cache: 'no-cache' });
    if (!res.ok) throw new ApiError(res.status, 'static', 'داده‌ها بارگذاری نشدند؛ صفحه را تازه کنید.');
    return res.json();
  }
  const opts = { method, headers: { ...headers }, credentials: 'same-origin' };
  if (method !== 'GET') opts.headers['X-ABP-CSRF'] = '1';
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(path, opts);
  } catch {
    throw new ApiError(0, 'network', 'اتصال به سرور برقرار نشد. اینترنت یا سرور را بررسی کنید.');
  }
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    const e = data?.error ?? {};
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      location.href = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
    }
    throw new ApiError(res.status, e.code ?? 'error', e.message ?? 'خطایی رخ داد؛ دوباره تلاش کنید.', e.field);
  }
  return data;
}

export const newKey = () => crypto.randomUUID().replaceAll('-', '');

// ---- formatting ----
const faNum = new Intl.NumberFormat('fa-IR');
export const n = (v) => (v === null || v === undefined ? '—' : faNum.format(v));
const dateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
export const date = (iso) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const dateTime = (iso) => (iso ? dateTimeFmt.format(new Date(iso)) : '—');
export function bytes(b) {
  if (b < 1024) return `${n(b)} بایت`;
  if (b < 1024 * 1024) return `${n(Math.round(b / 102.4) / 10)} کیلوبایت`;
  return `${n(Math.round(b / 104857.6) / 10)} مگابایت`;
}
export function money(amount, currency) {
  if (!amount) return 'رایگان';
  return currency === 'IRT' ? `${n(amount)} تومان` : `${n(amount)} ${currency}`;
}
export function ago(iso) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'چند لحظه پیش';
  if (s < 3600) return `${n(Math.floor(s / 60))} دقیقه پیش`;
  if (s < 86400) return `${n(Math.floor(s / 3600))} ساعت پیش`;
  return date(iso);
}
export function duration(fromIso, toIso) {
  if (!fromIso) return '';
  const s = Math.max(0, Math.round(((toIso ? new Date(toIso) : new Date()) - new Date(fromIso)) / 1000));
  return s < 60 ? `${n(s)} ثانیه` : `${n(Math.floor(s / 60))} دقیقه و ${n(s % 60)} ثانیه`;
}

export const STATUS_FA = {
  queued: 'در صف', running: 'در حال ساخت', succeeded: 'ساخته شد', partial: 'ساخته شد با ایراد', failed: 'ناموفق', canceled: 'لغو شد', timed_out: 'زمان تمام شد',
};

// ---- DOM helpers ----
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
// Null/false children are skipped, so callers can write `cond ? node : null`.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c instanceof Node ? c : String(c));
  return node;
}

export function toast(message, kind = 'info') {
  let region = $('.toast-region');
  if (!region) {
    region = el('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
    document.body.append(region);
  }
  const t = el('div', { class: `toast ${kind === 'error' ? 'error' : ''}`, text: message });
  region.append(t);
  setTimeout(() => t.remove(), kind === 'error' ? 7000 : 4000);
}

export function busy(button, on) {
  if (!button) return;
  button.disabled = on;
  button.setAttribute('aria-busy', on ? 'true' : 'false');
}

// Shows field-level or form-level errors from an ApiError.
export function showFormError(form, err) {
  const box = $('[data-form-error]', form);
  $$('[aria-invalid]', form).forEach((i) => i.removeAttribute('aria-invalid'));
  if (err.field) {
    const input = form.elements[err.field.split('.').pop()];
    if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
  }
  if (box) { box.textContent = err.message; box.hidden = false; } else toast(err.message, 'error');
}

// ---- theme ----
const THEME_KEY = 'abp-theme';
export function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage blocked */ }
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
  $$('[data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  }));
}

// ---- session + header ----
let mePromise = null;
export function me() {
  mePromise ??= api('/api/auth/me').catch(() => ({ user: null }));
  return mePromise;
}
let configPromise = null;
export function config() {
  configPromise ??= api('/api/config');
  return configPromise;
}

export async function initHeader() {
  initTheme();
  const toggle = $('.menu-toggle');
  const nav = $('.nav');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  const [cfg, session] = await Promise.all([config().catch(() => null), me()]);
  if (cfg?.brand) {
    $$('[data-brand-name]').forEach((e) => { e.textContent = cfg.brand.name; });
    if (cfg.brand.primary && /^#[0-9a-f]{6}$/i.test(cfg.brand.primary) && cfg.brand.primary.toLowerCase() !== '#2f5bea') {
      document.documentElement.style.setProperty('--lapis', cfg.brand.primary);
    }
  }
  if (cfg?.brand && !cfg.brand.signupEnabled) closeSignupLinks();
  if (STATIC) $$('a[href="/login"], a[href="/app"]').forEach((a) => a.remove());
  $$('[data-auth="in"]').forEach((e) => { e.hidden = !session.user; });
  $$('[data-auth="out"]').forEach((e) => { e.hidden = !!session.user; });
  $$('[data-auth="admin"]').forEach((e) => { e.hidden = session.user?.role !== 'admin'; });
  $$('[data-logout]').forEach((b) => b.addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    location.href = '/';
  }));
  const here = location.pathname;
  $$('.nav a').forEach((a) => { if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page'); });
  return { cfg, session };
}

// View-only / invite-only mode: sign-up links become a plain note (the server refuses sign-ups too).
export function closeSignupLinks(root = document) {
  // The static build has no account pages at all, so plan buttons are closed as well.
  $$(STATIC ? 'a[href="/signup"], a[href^="/account"]' : 'a[href="/signup"]', root).forEach((a) => {
    const note = el('span', { class: `${a.className.replace(/\bbtn-primary\b/, '')} is-closed`, 'aria-disabled': 'true', text: 'ثبت‌نام به‌زودی باز می‌شود' });
    note.hidden = a.hidden;
    if (a.dataset.auth) note.dataset.auth = a.dataset.auth;
    a.replaceWith(note);
  });
}

export async function requireSession() {
  const session = await me();
  if (!session.user) {
    location.href = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
    return new Promise(() => {});
  }
  return session;
}

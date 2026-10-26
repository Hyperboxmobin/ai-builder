import { api, config, initHeader, closeSignupLinks, STATIC, $, $$, el, n, money } from './core.js';

initHeader();
animateBuildLog();
renderKinds();
renderPlans();
renderShowcase();

// Real engine output only (written by scripts/make-showcase.ts); the section stays hidden without it.
async function renderShowcase() {
  let data;
  try {
    const res = await fetch(STATIC ? 'showcase/showcase.json' : '/showcase/showcase.json', { cache: 'no-cache' });
    if (!res.ok) return;
    data = await res.json();
  } catch { return; }
  if (!data.items?.length) return;
  const secs = (s) => (s < 60 ? `${n(s)} ثانیه` : `${n(Math.round(s / 60))} دقیقه`);
  const caption = (it) => el('figcaption', {},
    el('strong', { text: it.name }),
    el('span', { class: 'muted small', text: `${it.kind_fa}، ساخت در ${secs(it.seconds)}${it.fixed_after_review ? ' (شامل درخواست رفع ایراد)' : ''}${it.audit !== null ? `، ممیزی ${n(it.audit)} از ۱۰۰` : ''}` }));
  // Code kinds have no visual preview: show the real file list and the features the engine reported.
  const card = (it) => it.code
    ? el('figure', { class: 'sample sample-code', 'data-kind': it.kind },
      el('div', { class: 'sample-shot code-card', role: 'img', 'aria-label': `فهرست فایل‌های ${it.name}` },
        el('ul', { class: 'code-files ltr' }, ...it.files.map((f) => el('li', { text: f })),
          it.file_count > it.files.length ? el('li', { class: 'muted', text: `+${it.file_count - it.files.length}` }) : null),
        it.features.length ? el('ul', { class: 'code-features' }, ...it.features.map((f) => el('li', { text: f }))) : null),
      caption(it))
    : el('figure', { class: `sample ${it.mobile ? 'sample-mobile' : ''}`, 'data-kind': it.kind },
      (() => {
        const img = el('img', { src: STATIC ? it.image.replace(/^\//, '') : it.image, alt: `تصویر صفحهٔ اصلی ${it.name}`, loading: 'lazy', width: it.mobile ? '390' : '1280', height: it.mobile ? '780' : '800' });
        // Live demos exist only in the static showcase build (separate origin from the platform).
        return STATIC && it.demo
          ? el('button', { type: 'button', class: 'sample-shot sample-open', 'aria-label': `مشاهدهٔ زندهٔ ${it.name}`, onclick: () => openDemo(it) }, img)
          : el('div', { class: 'sample-shot' }, img);
      })(),
      caption(it),
      STATIC && it.demo ? el('button', { type: 'button', class: 'btn btn-sm sample-live', onclick: () => openDemo(it), text: 'مشاهدهٔ زنده' }) : null);

  const list = $('[data-showcase-list]');
  list.replaceChildren(...data.items.map(card));
  const kinds = [...new Map(data.items.map((it) => [it.kind, it.kind_fa])).entries()];
  const filter = (kind) => {
    $$('[data-showcase-filter] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
    $$('.sample', list).forEach((f) => { f.hidden = kind !== 'all' && f.dataset.kind !== kind; });
  };
  $('[data-showcase-filter]').replaceChildren(
    el('button', { type: 'button', class: 'chip', 'data-kind': 'all', 'aria-pressed': 'true', onclick: () => filter('all'), text: `همه (${n(data.items.length)})` }),
    ...kinds.map(([k, fa]) => el('button', { type: 'button', class: 'chip', 'data-kind': k, 'aria-pressed': 'false', onclick: () => filter(k),
      text: `${fa} (${n(data.items.filter((i) => i.kind === k).length)})` })));
  $('[data-showcase]').hidden = false;
}

// Live demo viewer: the generated site runs in a sandboxed iframe (opaque origin, no access to
// this page), with a phone/desktop toggle and an "open in new tab" link.
let viewer;
function openDemo(it) {
  if (!viewer) {
    const frame = el('iframe', { class: 'demo-frame', title: '', sandbox: 'allow-scripts allow-forms allow-modals allow-popups', referrerpolicy: 'no-referrer' });
    const wrap = el('div', { class: 'demo-wrap', 'data-device': 'desktop' }, frame);
    const title = el('h2', { class: 'demo-title' });
    const newTab = el('a', { class: 'btn btn-sm', target: '_blank', rel: 'noopener noreferrer', text: 'باز کردن در زبانهٔ تازه' });
    const device = (d) => el('button', { type: 'button', class: 'btn btn-sm btn-ghost', 'aria-pressed': String(d === 'desktop'), 'data-device': d, text: d === 'desktop' ? 'دسکتاپ' : 'موبایل',
      onclick: (e) => { wrap.dataset.device = d; viewer.dialog.querySelectorAll('[data-device] button, .demo-devices button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); } });
    const dialog = el('dialog', { class: 'demo-viewer', 'aria-labelledby': 'demo-title' },
      el('div', { class: 'demo-bar' }, title,
        el('div', { class: 'demo-devices', role: 'group', 'aria-label': 'اندازهٔ صفحه' }, device('desktop'), device('mobile')),
        newTab,
        el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'بستن', onclick: () => dialog.close() },
          el('span', { 'aria-hidden': 'true', text: '✕' }))),
      wrap,
      el('p', { class: 'hint demo-note', text: 'این نسخه‌ای از خروجی واقعی موتور است که در محیط ایزوله اجرا می‌شود؛ داده‌هایی که وارد می‌کنید ذخیره نمی‌شوند.' }));
    title.id = 'demo-title';
    dialog.addEventListener('close', () => { frame.src = 'about:blank'; });
    document.body.append(dialog);
    viewer = { dialog, frame, wrap, title, newTab };
  }
  viewer.title.textContent = `${it.name} — ${it.kind_fa}`;
  viewer.frame.title = `نمایش زندهٔ ${it.name}`;
  viewer.frame.src = it.demo;
  viewer.newTab.href = it.demo;
  const mobile = it.kind === 'mobile';
  viewer.wrap.dataset.device = mobile ? 'mobile' : 'desktop';
  viewer.dialog.querySelectorAll('.demo-devices button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.device === viewer.wrap.dataset.device)));
  viewer.dialog.showModal();
}

// One orchestrated reveal of the sample build log; skipped when motion is reduced.
function animateBuildLog() {
  const log = $('.buildlog');
  if (!log || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  log.classList.add('animate');
  [...log.querySelectorAll('[data-step]')].forEach((li, i) => setTimeout(() => li.classList.add('shown'), 400 + i * 550));
}

async function renderKinds() {
  const box = $('[data-kinds]');
  try {
    const { kinds } = await config();
    box.replaceChildren(...kinds.map((k) => el('div', { class: 'kinds-row' },
      el('dt', {}, k.fa, el('span', { class: `tag ${k.preview ? '' : 'files'}`, text: k.preview ? 'پیش‌نمایش در مرورگر' : 'تحویل فایل' })),
      el('dd', { text: k.note_fa }))));
  } catch {
    box.replaceChildren(el('p', { class: 'muted', text: 'فهرست انواع پروژه بارگذاری نشد؛ صفحه را تازه کنید.' }));
  }
}

async function renderPlans() {
  const box = $('[data-plans]');
  try {
    const [{ plans }, { kinds }] = await Promise.all([api('/api/plans'), config()]);
    const kindName = Object.fromEntries(kinds.map((k) => [k.id, k.fa]));
    box.replaceChildren(...plans.map((p) => el('article', { class: `plan ${p.id === 'pro' ? 'featured' : ''}` },
      el('h3', { text: p.name_fa }),
      el('p', { class: 'price' }, p.id === 'enterprise' && !p.price_monthly ? 'توافقی' : money(p.price_monthly, p.currency),
        p.price_monthly ? el('small', { text: ' در ماه' }) : null),
      el('p', { class: 'desc', text: p.description_fa }),
      el('ul', {},
        el('li', { text: `${n(p.max_projects)} پروژهٔ فعال` }),
        el('li', { text: `${n(p.runs_per_month)} بار ساخت یا اصلاح در ماه` }),
        el('li', { text: p.max_concurrent_runs > 1 ? `${n(p.max_concurrent_runs)} ساخت هم‌زمان` : 'یک ساخت هم‌زمان' }),
        el('li', { text: p.allowed_kinds.map((k) => kindName[k]).join('، ') })),
      el('a', { class: `btn ${p.id === 'pro' ? 'btn-primary' : ''}`, href: p.id === 'free' ? '/signup' : '/account#plans',
        text: p.id === 'free' ? 'شروع رایگان' : p.id === 'enterprise' ? 'درخواست پلن سازمانی' : `درخواست پلن ${p.name_fa}` }))));
  } catch {
    box.replaceChildren(el('p', { class: 'muted', text: 'پلن‌ها بارگذاری نشدند؛ صفحه را تازه کنید.' }));
  }
  box.removeAttribute('aria-busy');
  if (!(await config()).brand.signupEnabled) closeSignupLinks(box);
}

/* Shop cart + search — localStorage, no external deps */
(function(){
  const PRODUCTS = [{"id": "p1", "name": "دفتر خاطرات", "price": 210000, "category": "نوشت‌افزار", "badge": "", "rating": null, "stock": null, "desc": "دفتر خاطرات از دستهٔ نوشت‌افزار؛ انتخابی کاربردی برای استفادهٔ روزمره.", "note": "قیمت و مشخصات «دفتر خاطرات» نمونه است؛ مقدار واقعی را در products.json وارد کنید.", "sample": true}, {"id": "p2", "name": "روان‌نویس", "price": 95000, "category": "نوشت‌افزار", "badge": "", "rating": null, "stock": null, "desc": "روان‌نویس با کیفیت ساخت مناسب، در دستهٔ نوشت‌افزار.", "note": "قیمت و مشخصات «روان‌نویس» نمونه است؛ مقدار واقعی را در products.json وارد کنید.", "sample": true}, {"id": "p3", "name": "کتاب رمان", "price": 340000, "category": "کتاب", "badge": "", "rating": null, "stock": null, "desc": "کتاب رمان؛ یکی از پرکاربردترین اقلام دستهٔ کتاب.", "note": "قیمت و مشخصات «کتاب رمان» نمونه است؛ مقدار واقعی را در products.json وارد کنید.", "sample": true}, {"id": "p4", "name": "کتاب آموزشی", "price": 420000, "category": "کتاب", "badge": "", "rating": null, "stock": null, "desc": "کتاب آموزشی برای کسانی که در دستهٔ کتاب دنبال گزینه‌ای مطمئن هستند.", "note": "قیمت و مشخصات «کتاب آموزشی» نمونه است؛ مقدار واقعی را در products.json وارد کنید.", "sample": true}, {"id": "p5", "name": "ست مداد رنگی", "price": 280000, "category": "نقاشی", "badge": "", "rating": null, "stock": null, "desc": "ست مداد رنگی از مجموعهٔ نقاشی، مناسب خرید شخصی یا هدیه.", "note": "قیمت و مشخصات «ست مداد رنگی» نمونه است؛ مقدار واقعی را در products.json وارد کنید.", "sample": true}, {"id": "p6", "name": "کیف کتاب", "price": 260000, "category": "لوازم", "badge": "", "rating": null, "stock": null, "desc": "کیف کتاب؛ گزینه‌ای اقتصادی در دستهٔ لوازم.", "note": "قیمت و مشخصات «کیف کتاب» نمونه است؛ مقدار واقعی را در products.json وارد کنید.", "sample": true}];
  const CURRENCY = "\u062a\u0648\u0645\u0627\u0646";
  const SYMBOL = "";
  const KEY = 'shop_cart_v1';

  function fmt(n){
    if (SYMBOL) return SYMBOL + Number(n).toLocaleString();
    return Number(n).toLocaleString('fa-IR') + ' ' + CURRENCY;
  }
  function esc(v){ return String(v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]); }
  // Storage is editable by anyone with the browser open: only known products and whole quantities
  // 1-99 survive, so nothing read back can become markup or a nonsense total.
  function load(){
    let raw; try { raw = JSON.parse(localStorage.getItem(KEY)||'{}'); } catch(e){ raw = {}; }
    const out = {};
    if (raw && typeof raw === 'object') Object.keys(raw).forEach(id => {
      const q = parseInt(raw[id], 10);
      if (PRODUCTS.some(p => p.id === id) && q > 0) out[id] = Math.min(99, q);
    });
    return out;
  }
  function save(c){ localStorage.setItem(KEY, JSON.stringify(c)); updateBadge(); }
  function count(c){ return Object.values(c).reduce((a,b)=>a+b,0); }
  function updateBadge(){
    const c = load(); const n = count(c);
    document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = n; el.style.display = n? 'inline':'none'; });
  }
  function toast(msg){
    let t = document.querySelector('.toast');
    if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 1800);
  }
  window.shopAdd = function(id, qty){
    qty = qty || 1; const c = load(); c[id] = (c[id]||0) + qty; save(c); toast("\u0628\u0647 \u0633\u0628\u062f \u0627\u0636\u0627\u0641\u0647 \u0634\u062f");
  };
  window.shopSetQty = function(id, qty){
    const c = load(); qty = Math.min(99, Math.max(0, parseInt(qty||0,10) || 0));
    if(qty<=0) delete c[id]; else c[id]=qty; save(c); if(window.renderCart) window.renderCart();
  };
  window.shopClear = function(){ save({}); if(window.renderCart) window.renderCart(); };

  function productById(id){ return PRODUCTS.find(p => p.id === id); }

  window.renderCart = function(){
    const el = document.getElementById('cart-body');
    if(!el) return;
    const c = load(); const ids = Object.keys(c);
    if(!ids.length){
      el.innerHTML = '<div class="empty">' + "\u0633\u0628\u062f \u062e\u0631\u06cc\u062f \u062e\u0627\u0644\u06cc \u0627\u0633\u062a" + '</div>';
      const sum = document.getElementById('cart-summary'); if(sum) sum.innerHTML='';
      return;
    }
    let total = 0;
    let rows = ids.map(id => {
      const p = productById(id); if(!p) return '';
      const q = c[id]; const line = p.price * q; total += line;
      return `<tr>
        <td><strong>${esc(p.name)}</strong><div class="cell-note">${esc(p.category)}</div></td>
        <td>${fmt(p.price)}</td>
        <td><input type="number" min="0" max="99" value="${q}" class="qty-input" data-qty-id="${id}"></td>
        <td>${fmt(line)}</td>
        <td><button class="btn btn-ghost" type="button" data-remove="${id}" aria-label="حذف">×</button></td>
      </tr>`;
    }).join('');
    el.innerHTML = `<table class="cart-table"><thead><tr>
      <th>محصول</th><th>قیمت</th>
      <th>تعداد</th><th>جمع</th><th></th>
    </tr></thead><tbody>${rows}</tbody></table>`;
    const sum = document.getElementById('cart-summary');
    if(sum) sum.innerHTML = `<div class="cart-summary">
      <div class="row"><span>جمع جزء</span><span>${fmt(total)}</span></div>
      <div class="row"><span>ارسال</span><span>محاسبه در پرداخت</span></div>
      <div class="row total"><span>مبلغ قابل پرداخت</span><span>${fmt(total)}</span></div>
      <a class="btn btn-primary s-46c4d15b" href="checkout.html">ادامه پرداخت</a>
    </div>`;
  };

  window.filterProducts = function(){
    const q = (document.getElementById('q')||{}).value || '';
    const cat = (document.getElementById('cat')||{}).value || '';
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    const ql = q.toLowerCase();
    grid.querySelectorAll('[data-product]').forEach(card => {
      const name = (card.getAttribute('data-name')||'').toLowerCase();
      const c = card.getAttribute('data-category')||'';
      const ok = (!ql || name.includes(ql)) && (!cat || c === cat);
      card.style.display = ok ? '' : 'none';
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateBadge();
    if(document.getElementById('cart-body')) renderCart();
    const catSelect = document.getElementById('cat');
    if(catSelect){
      // Category links arrive as shop.html?cat=…; preselecting keeps them real anchors.
      const wanted = new URLSearchParams(location.search).get('cat') || '';
      if(wanted){
        catSelect.value = wanted;
        if(catSelect.value !== wanted){
          const option = document.createElement('option');
          option.value = wanted; option.textContent = wanted;
          catSelect.appendChild(option); catSelect.value = wanted;
        }
        filterProducts();
      }
    }

    // Every control is wired by delegation on data attributes: the page's own CSP
    // (script-src 'self') refuses inline on* handlers, which would make them dead buttons.
    document.addEventListener('click', (e) => {
      const target = e.target.closest ? e.target : null;
      if(!target) return;
      const add = target.closest('[data-add]');
      if(add){
        const from = add.getAttribute('data-add-from');
        const source = from ? document.getElementById(from) : null;
        shopAdd(add.getAttribute('data-add'), source ? Math.max(1, parseInt(source.value||'1',10)) : 1);
        return;
      }
      const remove = target.closest('[data-remove]');
      if(remove){ shopSetQty(remove.getAttribute('data-remove'), 0); return; }
      const step = target.closest('[data-step]');
      if(step){
        const input = document.getElementById(step.getAttribute('data-step'));
        if(input) input.value = Math.max(1, (parseInt(input.value||'1',10)) + parseInt(step.getAttribute('data-inc'),10));
      }
    });
    document.addEventListener('change', (e) => {
      const target = e.target.closest ? e.target : null;
      if(!target) return;
      const row = target.closest('[data-qty-id]');
      if(row){ shopSetQty(row.getAttribute('data-qty-id'), row.value); return; }
      if(target.id === 'cat') filterProducts();
    });
    document.addEventListener('input', (e) => {
      if(e.target && (e.target.id === 'q')) filterProducts();
    });

    const cf = document.getElementById('contact-form');
    if(cf){
      const status = document.getElementById('cf-status');
      cf.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!cf.reportValidity()){ if(status) status.textContent = "\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0641\u0631\u0645 \u06a9\u0627\u0645\u0644 \u0646\u06cc\u0633\u062a"; return; }
        const data = Object.fromEntries(new FormData(cf).entries());
        const endpoint = "";
        const mail = "";
        if(endpoint){
          try {
            const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
            if(!res.ok) throw new Error('HTTP ' + res.status);
            if(status) status.textContent = "\u0633\u0641\u0627\u0631\u0634 \u0628\u0647 \u0633\u0631\u0648\u0631 \u0627\u0631\u0633\u0627\u0644 \u0634\u062f";
            cf.reset();
          } catch(err) {
            if(status) status.textContent = "\u0627\u0631\u0633\u0627\u0644 \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062f";
          }
          return;
        }
        if(mail){
          const body = ['نام: ' + data.name, 'ایمیل: ' + data.email, '', data.message].join('\n');
          location.href = 'mailto:' + mail + '?subject=' + encodeURIComponent("\u067e\u06cc\u0627\u0645 \u0627\u0632 \u0633\u0627\u06cc\u062a") + '&body=' + encodeURIComponent(body);
          if(status) status.textContent = "\u0628\u0631\u0646\u0627\u0645\u0647\u0654 \u0627\u06cc\u0645\u06cc\u0644 \u0634\u0645\u0627 \u0628\u0627 \u0627\u06cc\u0646 \u067e\u06cc\u0627\u0645 \u0628\u0627\u0632 \u0645\u06cc\u200c\u0634\u0648\u062f\u061b \u0627\u0631\u0633\u0627\u0644 \u0631\u0627 \u062a\u0623\u06cc\u06cc\u062f \u06a9\u0646\u06cc\u062f.";
          return;
        }
        if(status) status.textContent = "\u0627\u0631\u0633\u0627\u0644 \u067e\u06cc\u0627\u0645 \u0627\u0632 \u0627\u06cc\u0646 \u0641\u0631\u0645 \u062f\u0631 \u062d\u0627\u0644 \u062d\u0627\u0636\u0631 \u0645\u0645\u06a9\u0646 \u0646\u06cc\u0633\u062a\u061b \u0644\u0637\u0641\u0627\u064b \u0628\u0639\u062f\u0627\u064b \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.";
      });
    }
    const orders = document.getElementById('order-list');
    if(orders){
      let held = [];
      try { held = JSON.parse(localStorage.getItem('shop_orders_v1')||'[]'); } catch(e){ held = []; }
      if(!held.length){
        orders.innerHTML = '<div class="empty">' + "\u0633\u0641\u0627\u0631\u0634\u06cc \u062f\u0631 \u0627\u06cc\u0646 \u0645\u0631\u0648\u0631\u06af\u0631 \u062b\u0628\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a" + '</div>';
      } else {
        orders.innerHTML = held.slice().reverse().map(o => `<article class="card s-363cdaa2">
          <h3>${("\u0633\u0641\u0627\u0631\u0634")} · ${esc(fmt(Number(o.total)||0))}</h3>
          <ul>${(o.lines||[]).map(l => `<li>${esc(l.name)} × ${esc(parseInt(l.qty,10)||0)}</li>`).join('')}</ul>
        </article>`).join('');
      }
    }
    const form = document.getElementById('checkout-form');
    if(form){
      const ckStatus = document.getElementById('ck-status');
      const say = (m) => { if(ckStatus) ckStatus.textContent = m; };
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!form.reportValidity()){ toast("\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0641\u0631\u0645 \u06a9\u0627\u0645\u0644 \u0646\u06cc\u0633\u062a"); say("\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0641\u0631\u0645 \u06a9\u0627\u0645\u0644 \u0646\u06cc\u0633\u062a"); return; }
        const c = load();
        if(!count(c)){ toast("\u0633\u0628\u062f \u062e\u0631\u06cc\u062f \u062e\u0627\u0644\u06cc \u0627\u0633\u062a"); say("\u0633\u0628\u062f \u062e\u0631\u06cc\u062f \u062e\u0627\u0644\u06cc \u0627\u0633\u062a"); return; }
        const lines = Object.keys(c).map(id => {
          const p = productById(id);
          return { id, name: p ? p.name : id, price: p ? p.price : 0, qty: c[id] };
        });
        const fields = Object.fromEntries(new FormData(form).entries());
        const order = { customer: fields, lines, total: lines.reduce((a,l)=>a+l.price*l.qty,0) };
        const endpoint = "";
        if(endpoint){
          try {
            const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(order) });
            if(!res.ok) throw new Error('HTTP ' + res.status);
            toast("\u0633\u0641\u0627\u0631\u0634 \u0628\u0647 \u0633\u0631\u0648\u0631 \u0627\u0631\u0633\u0627\u0644 \u0634\u062f"); say("\u0633\u0641\u0627\u0631\u0634 \u0628\u0647 \u0633\u0631\u0648\u0631 \u0627\u0631\u0633\u0627\u0644 \u0634\u062f");
          } catch(err) {
            toast("\u0627\u0631\u0633\u0627\u0644 \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062f"); say("\u0627\u0631\u0633\u0627\u0644 \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062f");
            return;
          }
        } else {
          try {
            const held = JSON.parse(localStorage.getItem('shop_orders_v1')||'[]');
            held.push(order); localStorage.setItem('shop_orders_v1', JSON.stringify(held.slice(-25)));
          } catch(err) { /* storage disabled */ }
          toast("\u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627 \u062b\u0628\u062a \u0634\u062f\u061b \u0645\u0628\u0644\u063a\u06cc \u067e\u0631\u062f\u0627\u062e\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a."); say("\u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627 \u062b\u0628\u062a \u0634\u062f\u061b \u0645\u0628\u0644\u063a\u06cc \u067e\u0631\u062f\u0627\u062e\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a.");
        }
        shopClear();
      });
    }
  });
})();

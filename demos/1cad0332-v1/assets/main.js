/* Site behaviour — no external dependencies, no fake success states. */
(function () {
  "use strict";
  var M = {"need_name": "نام خود را وارد کنید.", "need_email": "یک نشانی ایمیل معتبر وارد کنید.", "need_message": "متن پیام باید حداقل ۱۰ نویسه باشد.", "fix": "چند مورد باید اصلاح شود.", "no_backend": "این سایت بک‌اند پیکربندی‌شده ندارد؛ پیام ذخیره نمی‌شود. با دکمهٔ زیر آن را از طریق ایمیل بفرستید.", "no_mailto": "نشانی ایمیلی برای ارسال ثبت نشده است.", "sending": "در حال ارسال…", "sent": "پیام شما ثبت شد.", "failed": "ارسال ناموفق بود؛ از راه مستقیم تماس استفاده کنید.", "open_mail": "باز کردن برنامهٔ ایمیل"};
  var SUBJECT = "پیام از وب‌سایت";

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
    });
  }

  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  Array.prototype.forEach.call(document.querySelectorAll(".nav-links a"), function (a) {
    if ((a.getAttribute("href") || "").toLowerCase() === path) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add("is-visible"); });
  }

  Array.prototype.forEach.call(document.querySelectorAll("form[data-validate]"), function (form) {
    var status = form.querySelector(".form-status");
    var show = function (state, text) {
      if (!status) return;
      status.setAttribute("data-state", state);
      status.textContent = text;
    };
    var box = function (input) { return form.querySelector('[data-error-for="' + input.id + '"]'); };
    var fields = ["name", "email", "message"].map(function (n) { return form.querySelector('[name="' + n + '"]'); });
    fields.forEach(function (input) {
      if (input) input.addEventListener("input", function () {
        input.removeAttribute("aria-invalid");
        if (box(input)) box(input).textContent = "";
      });
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = fields[0], email = fields[1], message = fields[2], firstBad = null;
      fields.forEach(function (input) {
        if (!input) return;
        input.removeAttribute("aria-invalid");
        if (box(input)) box(input).textContent = "";
      });
      var mark = function (input, msg) {
        input.setAttribute("aria-invalid", "true");
        if (box(input)) box(input).textContent = msg;
        firstBad = firstBad || input;
      };
      if (name && !name.value.trim()) mark(name, M.need_name);
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) mark(email, M.need_email);
      if (message && message.value.trim().length < 10) mark(message, M.need_message);
      if (firstBad) { show("error", M.fix); firstBad.focus(); return; }
      // A filled hidden field means a bot; it is told "sent" and nothing goes anywhere.
      var trap = form.querySelector('[name="website"]');
      if (trap && trap.value) { show("sent", M.sent); form.reset(); return; }
      var submit = form.querySelector('[type="submit"]');
      if (form.getAttribute("aria-busy") === "true") return;

      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) {
        var to = form.getAttribute("data-mailto") || "";
        if (!to) { show("error", M.no_mailto); return; }
        var link = to + "?subject=" + encodeURIComponent(SUBJECT + " — " + name.value.trim()) +
          "&body=" + encodeURIComponent(message.value.trim() + "\n\n" + name.value.trim() + " <" + email.value.trim() + ">");
        show("info", M.no_backend);
        var a = document.createElement("a");
        a.className = "btn btn-ghost";
        a.href = "mailto:" + link;
        a.textContent = M.open_mail;
        status.appendChild(a);
        return;
      }
      show("info", M.sending);
      form.setAttribute("aria-busy", "true");
      if (submit) submit.disabled = true;
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
      var done = function () { form.removeAttribute("aria-busy"); if (submit) submit.disabled = false; if (timer) clearTimeout(timer); };
      fetch(endpoint, {
        signal: ctrl ? ctrl.signal : undefined,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.value.trim(), email: email.value.trim(), message: message.value.trim() })
      }).then(function (res) {
        done();
        show(res.ok ? "sent" : "error", res.ok ? M.sent : M.failed);
        if (res.ok) form.reset();
      })["catch"](function () { done(); show("error", M.failed); });
    });
  });
})();

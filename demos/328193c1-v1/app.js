/**
 * app.js - Logic for "دخل و خرج" Personal Finance Manager
 * Pure Vanilla JS, LocalStorage persistence, No external dependencies.
 */

(function () {
    'use strict';

    // --- State Management ---
    const state = {
        transactions: [],
        categories: [],
        settings: {
            theme: 'light',
            lastBackup: null
        }
    };

    const STORAGE_KEY = 'dakhl_kharj_data';

    // --- Helpers ---
    const escapeHtml = (str) => {
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('fa-IR').format(num);
    };

    const saveToLocalStorage = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };

    const loadFromLocalStorage = () => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            Object.assign(state, parsed);
        } else {
            // Default categories
            state.categories = [
                { id: 'cat_1', name: 'حقوق' },
                { id: 'cat_2', name: 'خوراک' },
                { id: 'cat_3', name: 'اجاره' },
                { id: 'cat_4', name: 'تفریح' }
            ];
            saveToLocalStorage();
        }
    };

    const showToast = (message) => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // --- UI Logic ---
    const views = {
        dashboard: document.getElementById('dashboard'),
        'transaction-form': document.getElementById('transaction-form'),
        'category-manager': document.getElementById('category-manager'),
        'monthly-report': document.getElementById('monthly-report'),
        'chart-view': document.getElementById('chart-view'),
        settings: document.getElementById('settings')
    };

    const switchView = (viewId) => {
        Object.keys(views).forEach(id => {
            views[id].hidden = (id !== viewId);
        });
        
        document.querySelectorAll('.app-nav .btn').forEach(btn => {
            btn.setAttribute('aria-current', btn.dataset.view === viewId ? 'page' : 'false');
        });

        if (viewId === 'dashboard') renderDashboard();
        if (viewId === 'transaction-form') populateCategoryDropdown();
        if (viewId === 'category-manager') renderCategories();
        if (viewId === 'monthly-report') {
            const now = new Date();
            document.getElementById('report-month').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            renderReport();
        }
    };

    // --- Dashboard & Charts ---
    const renderDashboard = () => {
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7);
        
        const monthlyTxs = state.transactions.filter(t => t.date.startsWith(currentMonth));
        const income = monthlyTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = monthlyTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

        document.getElementById('income-total').textContent = formatNumber(income);
        document.getElementById('expense-total').textContent = formatNumber(expense);
        document.getElementById('balance-total').textContent = formatNumber(income - expense);

        drawSimpleChart('dashboard-chart', monthlyTxs);
    };

    const drawSimpleChart = (canvasId, data) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Simple custom bar chart implementation to avoid external libs
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
        const max = Math.max(income, expense, 1);

        const chartHeight = 150;
        const barWidth = 40;
        const gap = 20;

        // Income Bar
        ctx.fillStyle = 'var(--ok)'; 
        // Note: canvas doesn't support CSS vars directly, using fallback colors
        ctx.fillStyle = '#2ecc71'; 
        ctx.fillRect(20, chartHeight - (income / max * chartHeight), barWidth, (income / max * chartHeight));
        
        // Expense Bar
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(20 + barWidth + gap, chartHeight - (expense / max * chartHeight), barWidth, (expense / max * chartHeight));

        ctx.fillStyle = '#666';
        ctx.fillText('درآمد', 20, chartHeight + 15);
        ctx.fillText('هزینه', 20 + barWidth + gap, chartHeight + 15);
    };

    // --- Transaction Logic ---
    const populateCategoryDropdown = () => {
        const select = document.getElementById('tx-category');
        select.innerHTML = '';
        state.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            select.appendChild(opt);
        });
    };

    const handleTransactionSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const id = formData.get('id');
        
        const tx = {
            id: id || Date.now().toString(),
            type: formData.get('type') === 'درآمد' ? 'income' : 'expense',
            amount: Number(formData.get('amount')),
            date: formData.get('date'),
            categoryId: formData.get('categoryId'),
            note: formData.get('note')
        };

        if (id) {
            const index = state.transactions.findIndex(t => t.id === id);
            state.transactions[index] = tx;
        } else {
            state.transactions.push(tx);
        }

        saveToLocalStorage();
        form.reset();
        document.getElementById('tx-id').value = '';
        showToast('تراکنش با موفقیت ذخیره شد');
        switchView('dashboard');
    };

    // --- Category Logic ---
    const renderCategories = () => {
        const list = document.getElementById('category-list');
        const empty = document.getElementById('category-empty');
        list.innerHTML = '';
        
        if (state.categories.length === 0) {
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        state.categories.forEach(cat => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${escapeHtml(cat.name)}</td><td><button class="btn btn-danger btn-sm" data-action="delete-cat" data-id="${cat.id}">حذف</button></td>`;
            list.appendChild(tr);
        });
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('category-name');
        const name = input.value.trim();
        if (!name) return;

        state.categories.push({ id: Date.now().toString(), name });
        saveToLocalStorage();
        input.value = '';
        renderCategories();
        showToast('دسته‌بندی اضافه شد');
    };

    // --- Report Logic ---
    const renderReport = () => {
        const month = document.getElementById('report-month').value;
        const body = document.getElementById('report-body');
        const empty = document.getElementById('report-empty');

function escapeHtml(s) { return String(s).replace(/[&<>\\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;','\'':'&#39;'}[c])); }
        body.innerHTML = '';

        const filtered = state.transactions.filter(t => t.date.startsWith(month));
        
        if (filtered.length === 0) {
            empty.hidden = false;
            updateReportTotals(0, 0);
            return;
        }
        empty.hidden = true;

        let inc = 0, exp = 0;
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(t => {
            if (t.type === 'income') inc += t.amount; else exp += t.amount;
            
            const cat = state.categories.find(c => c.id === t.categoryId);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(t.date)}</td>
                <td><span class="badge">${t.type === 'income' ? 'درآمد' : 'هزینه'}</span></td>
                <td>${escapeHtml(cat ? cat.name : 'نامشخص')}</td>
                <td>${formatNumber(t.amount)}</td>
                <td>${escapeHtml(t.note)}</td>
                <td>
                    <button class="btn btn-sm" data-action="edit-tx" data-id="${t.id}">ویرایش</button>
                    <button class="btn btn-danger btn-sm" data-action="delete-tx" data-id="${t.id}">حذف</button>
                    <button class="btn btn-sm" data-action="view-tx" data-id="${t.id}">جزئیات</button>
                </td>
            `;
            body.appendChild(tr);
        });

        updateReportTotals(inc, exp);
    };

    const updateReportTotals = (inc, exp) => {
        document.getElementById('report-income-total').textContent = formatNumber(inc);
        document.getElementById('report-expense-total').textContent = formatNumber(exp);
        document.getElementById('report-balance-total').textContent = formatNumber(inc - exp);
    };

    // --- Settings & Data ---
    const exportData = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const importData = (e) => {
        const file = document.getElementById('import-file').files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported.transactions && imported.categories) {
                    Object.assign(state, imported);
                    saveToLocalStorage();
                    showToast('داده‌ها با موفقیت بازیابی شدند');
                    switchView('dashboard');
                } else {
                    throw new Error('فرمت نامعتبر');
                }
            } catch (err) {
                const errEl = document.getElementById('import-error');
                errEl.textContent = 'خطا در بارگذاری فایل JSON';
                errEl.hidden = false;
            }
        };
        reader.readAsText(file);
    };

    const toggleTheme = (theme) => {
        state.settings.theme = theme;
        document.body.className = theme === 'dark' ? 'dark-theme' : '';
        saveToLocalStorage();
    };

    // --- Modal Logic ---
    const showDetail = (id) => {
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return;
        const cat = state.categories.find(c => c.id === tx.categoryId);
        const content = document.getElementById('detail-content');
        content.innerHTML = `
            <p><strong>نوع:</strong> ${tx.type === 'income' ? 'درآمد' : 'هزینه'}</p>
            <p><strong>مبلغ:</strong> ${formatNumber(tx.amount)} تومان</p>
            <p><strong>تاریخ:</strong> ${escapeHtml(tx.date)}</p>
            <p><strong>دسته‌بندی:</strong> ${escapeHtml(cat ? cat.name : 'نامشخص')}</p>
            <p><strong>یادداشت:</strong> ${escapeHtml(tx.note || '---')}</p>
        `;
        document.getElementById('detail-modal').showModal();
    };

    // --- Event Delegation ---
    const init = () => {
        loadFromLocalStorage();

        // Navigation
        document.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('[data-view]');
            if (viewBtn) {
                switchView(viewBtn.dataset.view);
            }

            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.id;

            if (action === 'cancel-form') {
                document.getElementById('transaction-form-element').reset();
                document.getElementById('tx-id').value = '';
                switchView('dashboard');
            } else if (action === 'delete-cat') {
                state.categories = state.categories.filter(c => c.id !== id);
                saveToLocalStorage();
                renderCategories();
            } else if (action === 'load-report') {
                renderReport();
            } else if (action === 'draw-chart') {
                // Simplified: just re-render dashboard chart logic for specific range
                showToast('نمودار بازه زمانی در حال حاضر در داشبورد نمایش داده می‌شود');
            } else if (action === 'export-data') {
                exportData();
            } else if (action === 'import-data') {
                importData();
            } else if (action === 'delete-tx') {
                state.transactions = state.transactions.filter(t => t.id !== id);
                saveToLocalStorage();
                renderReport();
            } else if (action === 'edit-tx') {
                const tx = state.transactions.find(t => t.id === id);
                if (tx) {
                    switchView('transaction-form');
                    document.getElementById('tx-id').value = tx.id;
                    document.getElementById('tx-type').value = tx.type === 'income' ? 'درآمد' : 'هزینه';
                    document.getElementById('tx-amount').value = tx.amount;
                    document.getElementById('tx-date').value = tx.date;
                    document.getElementById('tx-category').value = tx.categoryId;
                    document.getElementById('tx-note').value = tx.note;
                }
            } else if (action === 'view-tx') {
                showDetail(id);
            } else if (action === 'close-detail') {
                document.getElementById('detail-modal').close();
            }
        });

        // Form Submissions
        document.getElementById('transaction-form-element').addEventListener('submit', handleTransactionSubmit);
        document.getElementById('category-form').addEventListener('submit', handleCategorySubmit);

        // Theme listeners
        document.getElementById('theme-light').addEventListener('change', () => toggleTheme('light'));
        document.getElementById('theme-dark').addEventListener('change', () => toggleTheme('dark'));

        // Initial state
        document.getElementById('theme-light').checked = state.settings.theme === 'light';
        document.getElementById('theme-dark').checked = state.settings.theme === 'dark';
        toggleTheme(state.settings.theme);
        switchView('dashboard');
    };

    document.addEventListener('DOMContentLoaded', init);
})();

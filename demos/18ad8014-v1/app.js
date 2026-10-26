document.addEventListener('DOMContentLoaded', () => {
  const screens = Array.from(document.querySelectorAll('.screen'));
  const toast = document.getElementById('toast');
  const habitList = document.getElementById('habit-list');
  const emptyHabits = document.getElementById('empty-habits');
  const habitForm = document.getElementById('habit-form');
  const formTitle = document.getElementById('form-title');
  const detailTitle = document.getElementById('detail-title');
  const detailDescription = document.getElementById('detail-description');
  const currentStreakEl = document.getElementById('current-streak');
  const maxStreakEl = document.getElementById('max-streak');
  const historyTableBody = document.querySelector('#history-table tbody');
  const settingsForm = document.getElementById('settings-form');
  const themeSelect = document.getElementById('theme-select');
  const notificationsToggle = document.getElementById('notifications-toggle');
  const syncToggle = document.getElementById('sync-toggle');

  let editingId = null;
  let currentDetailId = null;
  let toastTimer = null;

  const STORAGE_KEY = 'habits';
  const PREFS_KEY = 'preferences';

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const todayKey = () => new Date().toISOString().slice(0, 10);

  const getHabits = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const saveHabits = (habits) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  };

  const getPrefs = () => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const savePrefs = (prefs) => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  };

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  };

  const showScreen = (name) => {
    screens.forEach((s) => {
      if (s.dataset.screen === name) {
        s.hidden = false;
      } else {
        s.hidden = true;
      }
    });
  };

  const renderHabits = () => {
    if (!habitList) return;
    const habits = getHabits();
    habitList.innerHTML = '';
    emptyHabits.hidden = habits.length > 0;

    habits.forEach((habit) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.habitId = habit.id;

      const icon = habit.icon || '📌';
      const color = habit.color || '#4f46e5';

      const iconEl = document.createElement('div');
      iconEl.className = 'habit-icon';
      iconEl.textContent = icon;
      iconEl.style.background = color + '22';
      iconEl.style.color = color;

      const titleEl = document.createElement('div');
      titleEl.className = 'habit-title';
      titleEl.textContent = habit.title;

      const descEl = document.createElement('div');
      descEl.className = 'habit-desc muted';
      descEl.textContent = habit.description || '';

      const streakEl = document.createElement('div');
      streakEl.className = 'habit-streak';
      streakEl.textContent = `رکورد: ${habit.streakCount || 0}`;

      const actions = document.createElement('div');
      actions.className = 'row stack';

      const checkBtn = document.createElement('button');
      checkBtn.className = 'btn btn-primary';
      checkBtn.dataset.action = 'check-habit';
      checkBtn.dataset.habitId = habit.id;
      checkBtn.textContent = 'تیک زدن';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-ghost';
      editBtn.dataset.action = 'edit-habit';
      editBtn.dataset.habitId = habit.id;
      editBtn.textContent = 'ویرایش';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger';
      deleteBtn.dataset.action = 'delete-habit';
      deleteBtn.dataset.habitId = habit.id;
      deleteBtn.textContent = 'حذف';

      actions.appendChild(checkBtn);
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      card.appendChild(iconEl);
      card.appendChild(titleEl);
      card.appendChild(descEl);
      card.appendChild(streakEl);
      card.appendChild(actions);

      card.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) {
          openDetail(habit.id);
          return;
        }
        const action = target.dataset.action;
        if (action === 'check-habit') {
          checkHabit(habit.id);
        } else if (action === 'edit-habit') {
          openEdit(habit.id);
        } else if (action === 'delete-habit') {
          deleteHabit(habit.id);
        }
      });

      habitList.appendChild(card);
    });
  };

  const openDetail = (id) => {
    const habits = getHabits();
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    currentDetailId = id;
    detailTitle.textContent = habit.title;
    detailDescription.textContent = habit.description || '';
    currentStreakEl.textContent = String(habit.streakCount || 0);
    maxStreakEl.textContent = String(habit.maxStreak || 0);
    renderHistory(habit);
    showScreen('detail');
  };

  const renderHistory = (habit) => {
    if (!historyTableBody) return;
    historyTableBody.innerHTML = '';
    const history = habit.history || [];
    if (history.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 2;
      td.className = 'muted';
      td.textContent = 'هنوز تاریخی ثبت نشده است.';
      tr.appendChild(td);
      historyTableBody.appendChild(tr);
      return;
    }
    history.slice().reverse().forEach((entry) => {
      const tr = document.createElement('tr');
      const dateTd = document.createElement('td');
      dateTd.textContent = entry.date;
      const statusTd = document.createElement('td');
      statusTd.textContent = entry.checked ? '✓ انجام شد' : '✗ انجام نشد';
      tr.appendChild(dateTd);
      tr.appendChild(statusTd);
      historyTableBody.appendChild(tr);
    });
  };

  const checkHabit = (id) => {
    const habits = getHabits();
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const today = todayKey();
    const history = habit.history || [];
    const existing = history.find((e) => e.date === today);
    if (existing) {
      existing.checked = true;
    } else {
      history.push({ date: today, checked: true });
    }
    const lastDate = habit.lastCheckedDate;
    if (lastDate === today) {
      // already checked today, no streak change
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);
      if (lastDate === yesterdayKey) {
        habit.streakCount = (habit.streakCount || 0) + 1;
      } else {
        habit.streakCount = 1;
      }
      habit.lastCheckedDate = today;
    }
    habit.maxStreak = Math.max(habit.maxStreak || 0, habit.streakCount || 0);
    saveHabits(habits);
    renderHabits();
    if (currentDetailId === id) {
      openDetail(id);
    }
    showToast('تیک زده شد.');
  };

  const openEdit = (id) => {
    const habits = getHabits();
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    editingId = id;
    formTitle.textContent = 'ویرایش عادت';
    habitForm.title.value = habit.title || '';
    habitForm.description.value = habit.description || '';
    habitForm.icon.value = habit.icon || '';
    habitForm.color.value = habit.color || '#4f46e5';
    showScreen('add');
  };

  const openAdd = () => {
    editingId = null;
    formTitle.textContent = 'افزودن عادت';
    habitForm.reset();
    habitForm.color.value = '#4f46e5';
    showScreen('add');
  };

  const deleteHabit = (id) => {
    const habits = getHabits();
    const filtered = habits.filter((h) => h.id !== id);
    saveHabits(filtered);
    renderHabits();
    if (currentDetailId === id) {
      currentDetailId = null;
      showScreen('home');
    }
    showToast('عادت حذف شد.');
  };

  const handleSaveHabit = (e) => {
    e.preventDefault();
    const title = habitForm.title.value.trim();
    const description = habitForm.description.value.trim();
    const icon = habitForm.icon.value.trim();
    const color = habitForm.color.value;
    if (!title) {
      showToast('عنوان عادت را وارد کنید.');
      return;
    }
    const habits = getHabits();
    if (editingId) {
      const habit = habits.find((h) => h.id === editingId);
      if (habit) {
        habit.title = title;
        habit.description = description;
        habit.icon = icon;
        habit.color = color;
      }
      saveHabits(habits);
      showToast('عادت ویرایش شد.');
      if (currentDetailId === editingId) {
        openDetail(editingId);
      } else {
        showScreen('home');
      }
    } else {
      const newHabit = {
        id: uid(),
        title,
        description,
        icon,
        color,
        streakCount: 0,
        maxStreak: 0,
        lastCheckedDate: null,
        history: []
      };
      habits.push(newHabit);
      saveHabits(habits);
      showToast('عادت اضافه شد.');
      showScreen('home');
    }
    renderHabits();
  };

  const handleCancel = () => {
    editingId = null;
    habitForm.reset();
    formTitle.textContent = 'افزودن عادت';
    showScreen('home');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const prefs = {
      theme: themeSelect.value,
      notificationsEnabled: notificationsToggle.checked,
      syncEnabled: syncToggle.checked
    };
    savePrefs(prefs);
    applyTheme(prefs.theme);
    showToast('تنظیمات ذخیره شد.');
  };

  const applyTheme = (theme) => {
    if (theme === 'تیره') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const loadPrefs = () => {
    const prefs = getPrefs();
    if (prefs.theme) themeSelect.value = prefs.theme;
    notificationsToggle.checked = !!prefs.notificationsEnabled;
    syncToggle.checked = !!prefs.syncEnabled;
    applyTheme(prefs.theme);
  };

  // Global click delegation: handles data-screen navigation and data-action buttons
  document.addEventListener('click', (e) => {
    const target = e.target;

    // 1) Navigation via data-screen (nav buttons, etc.)
    const screenEl = target.closest('[data-screen]');
    if (screenEl && (target === screenEl || target.closest('button, a'))) {
      const screenName = screenEl.dataset.screen;
      if (screenName === 'add') {
        openAdd();
        return;
      }
      if (screenName === 'home') {
        showScreen('home');
        renderHabits();
        return;
      }
      if (screenName === 'settings') {
        showScreen('settings');
        return;
      }
      if (screenName === 'about') {
        showScreen('about');
        return;
      }
      if (screenName === 'detail') {
        // detail is opened via habit card, not nav
        return;
      }
    }

    // 2) Action buttons via data-action
    const actionEl = target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      const habitId = actionEl.dataset.habitId;

      switch (action) {
        case 'save-habit':
          // handled by form submit, but prevent double
          break;
        case 'cancel':
          e.preventDefault();
          handleCancel();
          break;
        case 'check-habit':
          e.preventDefault();
          if (habitId) checkHabit(habitId);
          break;
        case 'edit-habit':
          e.preventDefault();
          if (habitId) openEdit(habitId);
          break;
        case 'delete-habit':
          e.preventDefault();
          if (habitId) deleteHabit(habitId);
          break;
        case 'back-to-home':
          e.preventDefault();
          currentDetailId = null;
          showScreen('home');
          renderHabits();
          break;
        case 'save-settings':
          // handled by form submit
          break;
        default:
          break;
      }
    }
  });

  // Form submissions
  habitForm.addEventListener('submit', handleSaveHabit);
  settingsForm.addEventListener('submit', handleSaveSettings);

  // Theme change live preview
  themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value);
  });

  // Init
  loadPrefs();
  renderHabits();
  showScreen('home');
});

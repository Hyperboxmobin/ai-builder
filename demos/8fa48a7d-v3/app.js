/* app.js – Vanilla JS Kanban board (تخته کار تیم) */
'use strict';

/* ---------- Constants & Mappings ---------- */
const STORAGE_KEY_TASKS = 'tasks';
const STORAGE_KEY_SETTINGS = 'settings';

const STATUS = {
  TODO: 'todo',
  INPROGRESS: 'inprogress',
  DONE: 'done'
};

const STATUS_LABELS = {
  [STATUS.TODO]: 'انجام نشده',
  [STATUS.INPROGRESS]: 'در حال انجام',
  [STATUS.DONE]: 'انجام شده'
};

const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const PRIORITY_LABELS = {
  [PRIORITY.HIGH]: 'بالا',
  [PRIORITY.MEDIUM]: 'متوسط',
  [PRIORITY.LOW]: 'پایین'
};

const PRIORITY_VALUE = {
  [PRIORITY.HIGH]: 3,
  [PRIORITY.MEDIUM]: 2,
  [PRIORITY.LOW]: 1
};

const STATUS_ORDER = [STATUS.TODO, STATUS.INPROGRESS, STATUS.DONE];

/* ---------- State ---------- */
let tasks = [];
let settings = { theme: 'light', language: 'fa' };

/* ---------- Utility Functions ---------- */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    toast.hidden = true;
  }, 3000);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadFromStorage() {
  const storedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
  tasks = storedTasks ? JSON.parse(storedTasks) : [];
  const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
  settings = storedSettings ? JSON.parse(storedSettings) : { theme: 'light', language: 'fa' };
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

function applySettings() {
  document.documentElement.setAttribute('data-theme', settings.theme);
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) themeSelect.value = settings.theme === 'light' ? 'روشن' : 'تیره';
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) languageSelect.value = settings.language === 'fa' ? 'فارسی' : 'English';
}

/* ---------- Rendering ---------- */
function renderTask(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.draggable = true;
  li.dataset.id = task.id;

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;
  li.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  if (task.priority) {
    const prio = document.createElement('span');
    prio.className = 'badge';
    prio.textContent = PRIORITY_LABELS[task.priority];
    meta.appendChild(prio);
  }

  if (task.dueDate) {
    const due = document.createElement('span');
    due.className = 'badge';
    due.textContent = task.dueDate;
    meta.appendChild(due);
  }

  li.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn btn-sm';
  editBtn.dataset.action = 'edit';
  editBtn.dataset.id = task.id;
  editBtn.textContent = 'ویرایش';
  actions.appendChild(editBtn);

  li.appendChild(actions);

  return li;
}

function renderBoard() {
  const searchText = document.getElementById('searchInput').value.trim().toLowerCase();
  const statusFilter = document.getElementById('filterStatus').value;
  const priorityFilter = document.getElementById('filterPriority').value;

  const filtered = tasks.filter(task => {
    // Text filter
    if (searchText) {
      const inTitle = task.title.toLowerCase().includes(searchText);
      const inDesc = task.description && task.description.toLowerCase().includes(searchText);
      if (!inTitle && !inDesc) return false;
    }
    // Status filter
    if (statusFilter !== 'همه وضعیت‌ها') {
      const statusMap = {
        'انجام نشده': STATUS.TODO,
        'در حال انجام': STATUS.INPROGRESS,
        'انجام شده': STATUS.DONE
      };
      if (task.status !== statusMap[statusFilter]) return false;
    }
    // Priority filter
    if (priorityFilter !== 'همه اولویت‌ها') {
      const priorityMap = {
        'بالا': PRIORITY.HIGH,
        'متوسط': PRIORITY.MEDIUM,
        'پایین': PRIORITY.LOW
      };
      if (task.priority !== priorityMap[priorityFilter]) return false;
    }
    return true;
  });

  // Sort by status order, then dueDate, then priority
  filtered.sort((a, b) => {
    const statusDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    if (statusDiff !== 0) return statusDiff;
    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (dateA !== dateB) return dateA - dateB;
    return PRIORITY_VALUE[b.priority] - PRIORITY_VALUE[a.priority];
  });

  // Clear lists
  const listTodo = document.getElementById('listTodo');
  const listInProgress = document.getElementById('listInProgress');
  const listDone = document.getElementById('listDone');

  listTodo.innerHTML = '';
  listInProgress.innerHTML = '';
  listDone.innerHTML = '';

  // Append tasks
  filtered.forEach(task => {
    const li = renderTask(task);
    if (task.status === STATUS.TODO) listTodo.appendChild(li);
    else if (task.status === STATUS.INPROGRESS) listInProgress.appendChild(li);
    else if (task.status === STATUS.DONE) listDone.appendChild(li);
  });

  // Empty state visibility
  [listTodo, listInProgress, listDone].forEach(list => {
    const emptyMsg = list.parentElement.querySelector('.empty');
    if (list.children.length === 0) emptyMsg.hidden = false;
    else emptyMsg.hidden = true;
  });

  // Update counts
  document.getElementById('countTodo').textContent = tasks.filter(t => t.status === STATUS.TODO).length;
  document.getElementById('countInProgress').textContent = tasks.filter(t => t.status === STATUS.INPROGRESS).length;
  document.getElementById('countDone').textContent = tasks.filter(t => t.status === STATUS.DONE).length;
}

/* ---------- Modal Handling ---------- */
function openModal(task = null) {
  const modal = document.getElementById('taskModal');
  modal.hidden = false;
  modal.setAttribute('open', '');

  document.getElementById('taskId').value = task ? task.id : '';
  document.getElementById('taskTitle').value = task ? task.title : '';
  document.getElementById('taskDescription').value = task ? task.description : '';
  document.getElementById('taskPriority').value = task ? task.priority : PRIORITY.LOW;
  document.getElementById('taskDueDate').value = task ? task.dueDate : '';

  const deleteBtn = document.getElementById('deleteTaskBtn');
  deleteBtn.hidden = !task;
}

function closeModal() {
  const modal = document.getElementById('taskModal');
  modal.hidden = true;
  modal.removeAttribute('open');
  document.getElementById('taskForm').reset();
  document.getElementById('taskId').value = '';
  document.getElementById('deleteTaskBtn').hidden = true;
}

/* ---------- Event Handlers ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  applySettings();
  renderBoard();

  /* Navigation */
  document.getElementById('navBoard').addEventListener('click', () => {
    document.getElementById('boardSection').hidden = false;
    document.getElementById('settingsPanel').hidden = true;
  });

  document.getElementById('navSettings').addEventListener('click', () => {
    document.getElementById('boardSection').hidden = true;
    document.getElementById('settingsPanel').hidden = false;
  });

  /* Settings */
  document.getElementById('themeSelect').addEventListener('change', e => {
    settings.theme = e.target.value === 'روشن' ? 'light' : 'dark';
    applySettings();
    saveToStorage();
  });

  document.getElementById('languageSelect').addEventListener('change', e => {
    settings.language = e.target.value === 'فارسی' ? 'fa' : 'en';
    saveToStorage();
  });

  /* Add Task */
  document.getElementById('addTaskBtn').addEventListener('click', () => openModal());

  /* Modal Buttons */
  document.getElementById('cancelTaskBtn').addEventListener('click', closeModal);
  document.getElementById('deleteTaskBtn').addEventListener('click', () => {
    const id = document.getElementById('taskId').value;
    if (!id) return;
    tasks = tasks.filter(t => t.id !== id);
    saveToStorage();
    closeModal();
    renderBoard();
    showToast('کار حذف شد');
  });

  /* Form Submit */
  document.getElementById('taskForm').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;

    if (!title) {
      document.querySelector('#taskTitle + .error').hidden = false;
      return;
    } else {
      document.querySelector('#taskTitle + .error').hidden = true;
    }

    if (id) {
      // Update existing
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.title = title;
        task.description = description;
        task.priority = priority;
        task.dueDate = dueDate;
        task.updatedAt = new Date().toISOString();
      }
    } else {
      // Create new
      const newTask = {
        id: generateId(),
        title,
        description,
        priority,
        dueDate,
        status: STATUS.TODO,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.push(newTask);
    }

    saveToStorage();
    closeModal();
    renderBoard();
    showToast('کار ذخیره شد');
  });

  /* Search & Filters */
  document.getElementById('searchInput').addEventListener('input', renderBoard);
  document.getElementById('filterStatus').addEventListener('change', renderBoard);
  document.getElementById('filterPriority').addEventListener('change', renderBoard);

  /* Board Interaction */
  const boardSection = document.getElementById('boardSection');
  boardSection.addEventListener('click', e => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const taskId = actionEl.dataset.id;
    if (action === 'edit') {
      const task = tasks.find(t => t.id === taskId);
      if (task) openModal(task);
    }
  });

  /* Drag & Drop */
  const lists = document.querySelectorAll('#boardSection ul');
  lists.forEach(list => {
    list.addEventListener('dragstart', e => {
      const li = e.target.closest('li');
      if (!li) return;
      e.dataTransfer.setData('text/plain', li.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    list.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    list.addEventListener('drop', e => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      const newStatus = list.parentElement.dataset.status;
      if (task.status !== newStatus) {
        task.status = newStatus;
        task.updatedAt = new Date().toISOString();
        saveToStorage();
        renderBoard();
        showToast('کار جابه‌جا شد');
      }
    });
  });
});

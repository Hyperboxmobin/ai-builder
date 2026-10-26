// حدس عدد — Number Guessing Game
// A complete, working implementation that matches the provided index.html.

// ---------- Difficulty configuration ----------
const difficultyLevels = {
    easy:   { maxTime: 120, minAttempts: 1, label: 'آسان' },
    medium: { maxTime: 90,  minAttempts: 2, label: 'متوسط' },
    hard:   { maxTime: 60,  minAttempts: 3, label: 'سخت' }
};

// ---------- State ----------
let state = {
    target: null,
    attempts: 0,
    timeLeft: 0,
    maxTime: 0,
    difficulty: 'easy',
    paused: false,
    timerInterval: null,
    history: [],
    best: null
};

// ---------- DOM references ----------
const screens = {
    home:     document.getElementById('screen-home'),
    game:     document.getElementById('screen-game'),
    results:  document.getElementById('screen-results'),
    settings: document.getElementById('screen-settings'),
    help:     document.getElementById('screen-help')
};

const difficultySelect = document.getElementById('difficulty-select');
const themeSelect      = document.getElementById('theme-select');

const guessInput     = document.getElementById('guess-input');
const gameFeedback   = document.getElementById('game-feedback');
const gameAttempts   = document.getElementById('game-attempts');
const gameTimer      = document.getElementById('game-timer');
const btnPause       = document.getElementById('btn-pause');

const resultTitle    = document.getElementById('result-title');
const resultAttempts = document.getElementById('result-attempts');
const resultBest     = document.getElementById('result-best');
const historyBody    = document.getElementById('history-body');

const toast          = document.getElementById('toast');

// ---------- Helpers ----------
function toPersianDigits(str) {
    const map = { '0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹' };
    return String(str).replace(/[0-9]/g, d => map[d]);
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return toPersianDigits(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
}

function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 2500);
}

// ---------- Screen navigation ----------
function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
        if (el) el.hidden = (key !== name);
    });
    // If leaving the game screen, pause the timer
    if (name !== 'game' && state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

// ---------- Game logic ----------
function startGame() {
    const diff = difficultySelect.value || 'easy';
    state.difficulty = diff;
    state.maxTime = difficultyLevels[diff].maxTime;
    state.timeLeft = state.maxTime;
    state.attempts = 0;
    state.paused = false;
    state.target = Math.floor(Math.random() * 100) + 1;

    gameAttempts.textContent = toPersianDigits('0');
    gameTimer.textContent = formatTime(state.timeLeft);
    gameFeedback.textContent = 'عددی را وارد کنید…';
    gameFeedback.className = 'hint';
    guessInput.value = '';
    guessInput.disabled = false;
    btnPause.textContent = 'توقف';

    showScreen('game');

    // Start timer
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(tick, 1000);
}

function tick() {
    if (state.paused) return;
    state.timeLeft--;
    gameTimer.textContent = formatTime(state.timeLeft);
    if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
        endGame(false);
    }
}

function submitGuess() {
    if (state.paused) return;
    const val = parseInt(guessInput.value, 10);
    if (isNaN(val) || val < 1 || val > 100) {
        gameFeedback.textContent = 'لطفاً عددی بین ۱ تا ۱۰۰ وارد کنید.';
        gameFeedback.className = 'hint error';
        return;
    }

    state.attempts++;
    gameAttempts.textContent = toPersianDigits(state.attempts);

    if (val === state.target) {
        gameFeedback.textContent = 'آفرین! عدد درست بود. 🎉';
        gameFeedback.className = 'hint success';
        guessInput.disabled = true;
        endGame(true);
    } else if (val < state.target) {
        gameFeedback.textContent = 'عدد بزرگ‌تر است. ⬆️';
        gameFeedback.className = 'hint';
    } else {
        gameFeedback.textContent = 'عدد کوچک‌تر است. ⬇️';
        gameFeedback.className = 'hint';
    }
    guessInput.value = '';
    guessInput.focus();
}

function endGame(won) {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    state.paused = false;

    // Update history
    if (won) {
        state.history.push({ attempts: state.attempts, time: state.maxTime - state.timeLeft });
        state.history.sort((a, b) => a.attempts - b.attempts);
        state.history = state.history.slice(0, 5);
        if (state.best === null || state.attempts < state.best) {
            state.best = state.attempts;
        }
    }

    // Populate results screen
    resultTitle.textContent = won ? 'تبریک! 🎉' : 'زمان تمام شد! ⏰';
    resultAttempts.textContent = toPersianDigits(state.attempts);
    resultBest.textContent = state.best !== null ? toPersianDigits(state.best) : '—';

    // Render history table
    historyBody.innerHTML = '';
    state.history.forEach((entry, i) => {
        const tr = document.createElement('tr');
        const tdRank = document.createElement('td');
        tdRank.textContent = toPersianDigits(i + 1);
        const tdAtt = document.createElement('td');
        tdAtt.textContent = toPersianDigits(entry.attempts);
        tr.appendChild(tdRank);
        tr.appendChild(tdAtt);
        historyBody.appendChild(tr);
    });

    showScreen('results');
}

function togglePause() {
    if (!state.timerInterval) return;
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? 'ادامه' : 'توقف';
    gameFeedback.textContent = state.paused ? 'بازی متوقف شد. ⏸️' : 'بازی ادامه دارد. ▶️';
    gameFeedback.className = state.paused ? 'hint loading' : 'hint';
}

function restartGame() {
    startGame();
}

function saveSettings() {
    const diff = difficultySelect.value;
    const theme = themeSelect.value;
    showToast(`تنظیمات ذخیره شد — دشواری: ${difficultyLevels[diff]?.label || diff}`, 'success');
    // Apply theme
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

// ---------- Event delegation for data-nav and data-action ----------
document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav]');
    if (navEl) {
        const screen = navEl.getAttribute('data-nav');
        if (screens[screen]) {
            showScreen(screen);
        }
        return;
    }

    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
        const action = actionEl.getAttribute('data-action');
        switch (action) {
            case 'start-game':
                startGame();
                break;
            case 'submit-guess':
                submitGuess();
                break;
            case 'restart-game':
                restartGame();
                break;
            case 'toggle-pause':
                togglePause();
                break;
            case 'save-settings':
                saveSettings();
                break;
        }
    }
});

// Allow Enter key in guess input
guessInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitGuess();
    }
});

// ---------- Initialize ----------
showScreen('home');

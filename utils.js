const elementos = {
    loginScreen: document.getElementById('login-screen'),
    mainInterface: document.getElementById('main-interface'),
    loadingScreen: document.getElementById('loading-screen'),
    email: document.getElementById('email'),
    senha: document.getElementById('senha'),
    loginBtn: document.getElementById('login-btn'),
    loginError: document.getElementById('login-error'),
    togglePassword: document.getElementById('toggle-password'),
    subscribeBtn: document.getElementById('subscribe-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    settingsToggle: document.getElementById('settings-toggle'),
    settingsMenu: document.getElementById('settings-menu'),
    clientesLista: document.getElementById('clientes-lista'),
    buscaClientes: document.getElementById('busca-clientes'),
    chat: document.getElementById('chat'),
    chatTitle: document.getElementById('chat-title'),
    chatStatus: document.getElementById('chat-status'),
    typingIndicator: document.getElementById('typing-indicator'),
    mensagem: document.getElementById('mensagem'),
    enviarBtn: document.getElementById('enviar-btn'),
    charCount: document.getElementById('char-count'),
    modal: document.getElementById('custom-modal'),
    modalMessage: document.getElementById('modal-message'),
    modalInput: document.getElementById('modal-input'),
    modalConfirm: document.getElementById('modal-confirm'),
    modalCancel: document.getElementById('modal-cancel'),
    notificationSound: document.getElementById('notification-sound')
};

function formatarTimestamp(t) {
    return new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showModal(msg, isConfirm = false, isPrompt = false, cb) {
    elementos.modalMessage.textContent = msg;
    elementos.modal.style.display = 'flex';
    elementos.modalCancel.style.display = isConfirm || isPrompt ? 'inline-block' : 'none';
    elementos.modalInput.style.display = isPrompt ? 'block' : 'none';
    if (isPrompt) elementos.modalInput.value = '';
    elementos.modalConfirm.onclick = () => { elementos.modal.style.display = 'none'; cb(isPrompt ? elementos.modalInput.value : true); };
    elementos.modalCancel.onclick = () => { elementos.modal.style.display = 'none'; cb(isPrompt ? null : false); };
}

function customAlert(msg, cb = () => {}) {
    showModal(msg, false, false, cb);
}

function customConfirm(msg, cb) {
    showModal(msg, true, false, cb);
}

function customPrompt(msg, defaultValue, cb) {
    showModal(msg, true, true, cb);
    elementos.modalInput.value = defaultValue || '';
}

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = elementos.themeToggle.querySelector('i');
    icon.classList.toggle('fa-sun', isDark);
    icon.classList.toggle('fa-moon', !isDark);
}

// Funções de notificação
let titleInterval = null;
const originalTitle = document.title;

function playNotificationSound() {
    elementos.notificationSound.currentTime = 0; // Reinicia o som
    elementos.notificationSound.play().catch(e => console.error('Erro ao tocar som:', e));
}

function startTitleBlink(message) {
    if (titleInterval) return; // Evita múltiplos intervalos
    let isOriginal = true;
    titleInterval = setInterval(() => {
        document.title = isOriginal ? message : originalTitle;
        isOriginal = !isOriginal;
    }, 1000); // Pisca a cada 1 segundo
}

function stopTitleBlink() {
    if (titleInterval) {
        clearInterval(titleInterval);
        titleInterval = null;
        document.title = originalTitle;
    }
}
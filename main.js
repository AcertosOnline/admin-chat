document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initPush();

    auth.onAuthStateChanged(user => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (user && isLoggedIn) {
            updateScreenVisibility(true, user);
        } else {
            updateScreenVisibility(false, null);
        }
    });

    elementos.loginBtn.onclick = logarAdmin;
    elementos.logoutBtn.onclick = deslogarAdmin;
    elementos.themeToggle.onclick = toggleTheme;
    elementos.settingsToggle.onclick = () => elementos.settingsMenu.style.display = elementos.settingsMenu.style.display === 'block' ? 'none' : 'block';
    elementos.subscribeBtn.onclick = subscribeToPush;
    elementos.enviarBtn.onclick = enviarMensagem;

    elementos.togglePassword.addEventListener('click', () => {
        const isPassword = elementos.senha.type === 'password';
        elementos.senha.type = isPassword ? 'text' : 'password';
        elementos.togglePassword.querySelector('i').classList.toggle('fa-eye', isPassword);
        elementos.togglePassword.querySelector('i').classList.toggle('fa-eye-slash', !isPassword);
    });

    document.addEventListener('click', e => {
        if (!elementos.settingsMenu.contains(e.target) && !elementos.settingsToggle.contains(e.target)) {
            elementos.settingsMenu.style.display = 'none';
        }
    });

    if (localStorage.getItem('theme') === 'light') toggleTheme();

    const urlParams = new URLSearchParams(window.location.search);
    const clienteIdFromUrl = urlParams.get('clienteId');
    if (clienteIdFromUrl) selecionarCliente(clienteIdFromUrl);

    // Registro do Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker do PWA registrado com sucesso:', registration);
            })
            .catch(error => {
                console.error('Erro ao registrar Service Worker do PWA:', error);
            });
    }

// Gerenciamento da instalação do PWA
    let deferredPrompt = null;
    const installBtn = elementos.installBtn;

    window.addEventListener('beforeinstallprompt', (e) => {
        // Impede o prompt automático e armazena o evento
        e.preventDefault();
        deferredPrompt = e;
        // Exibe o botão de instalação no menu
        installBtn.style.display = 'block';
    });

    installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
            // Mostra o prompt de instalação
            deferredPrompt.prompt();
            // Aguarda a escolha do usuário
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Usuário aceitou instalar o PWA');
                } else {
                    console.log('Usuário recusou instalar o PWA');
                }
                deferredPrompt = null;
                // Oculta o botão após a tentativa de instalação
                installBtn.style.display = 'none';
            });
        }
    });

    // Evento disparado após a instalação bem-sucedida
    window.addEventListener('appinstalled', () => {
        console.log('PWA foi instalado com sucesso!');
        installBtn.style.display = 'none';
    });
});
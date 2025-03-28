document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    // Registro consolidado do Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration);
                registration.update(); // Força atualização do SW
                initPush(registration); // Inicializa o Firebase Messaging após o registro
                elementos.subscribeBtn.disabled = false; // Habilita o botão após inicialização
            })
            .catch(error => {
                console.error('Erro ao registrar Service Worker:', error);
                customAlert('Erro ao registrar Service Worker. Notificações push não funcionarão.');
            });
    } else {
        console.error('Service Workers não suportados neste navegador.');
        customAlert('Este navegador não suporta notificações push.');
    }

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

    // Gerenciamento da instalação do PWA
    let deferredPrompt = null;
    const installBtn = document.getElementById('install-btn');

    if (installBtn) {
        installBtn.style.display = 'none';

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'block';
        });

        installBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('Usuário aceitou instalar o PWA');
                    } else {
                        console.log('Usuário recusou instalar o PWA');
                    }
                    deferredPrompt = null;
                    installBtn.style.display = 'none';
                });
            }
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA foi instalado com sucesso!');
            installBtn.style.display = 'none';
        });
    } else {
        console.error('Elemento #install-btn não encontrado no DOM!');
    }
});
let messaging;

function initPush() {
    // Inicializa o Firebase Messaging
    messaging = firebase.messaging(app);

    // O Service Worker já está registrado no main.js
    // Não é necessário usar messaging.useServiceWorker na v11.4.0
    navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker pronto para Firebase Messaging:', registration);

        // Opcional: trata mensagens em foreground para depuração
        messaging.onMessage(payload => {
            console.log('Mensagem recebida em foreground:', payload);
            const notification = payload.notification || {};
            const data = payload.data || {};
            const url = data.url || 'https://adm.acertosonline.com/index.html';

            // Exibe notificação em foreground (opcional)
            registration.showNotification(notification.title || 'Nova Mensagem', {
                body: notification.body || 'Você recebeu uma nova mensagem.',
                icon: '/icon-192x192.png',
                data: { url }
            });
        });
    }).catch(err => {
        console.error('Erro ao acessar Service Worker:', err);
    });
}

function subscribeToPush() {
    elementos.subscribeBtn.disabled = true;
    Notification.requestPermission()
        .then(permission => {
            if (permission === 'granted') {
                // Usa o Service Worker registrado no main.js
                return navigator.serviceWorker.ready.then(registration => {
                    return messaging.getToken({
                        vapidKey: 'BCIRsN3lHlpe7xAnIdYKAdcCD6vGBt9bAjkXUrRWfpg7O_WA1w_bfM3QfcjeQ1DR4FUYu9K36kQ-A5zvM2YsQiA',
                        serviceWorkerRegistration: registration // Passa o registration aqui
                    });
                });
            }
            throw new Error('Permissão negada para notificações.');
        })
        .then(currentToken => {
            if (currentToken) {
                if (isTokenValid(currentToken)) {
                    customAlert('Já inscrito em notificações push!', () => elementos.subscribeBtn.style.display = 'none');
                } else {
                    saveAdminToken(currentToken)
                        .then(() => customAlert('Inscrito em notificações push!', () => elementos.subscribeBtn.style.display = 'none'))
                        .catch(e => customAlert('Erro ao salvar token: ' + e.message));
                }
            } else {
                throw new Error('Nenhum token disponível.');
            }
        })
        .catch(err => {
            const msg = err.code === 'messaging/permission-blocked' ? 'Notificações bloqueadas pelo navegador.' : err.message;
            customAlert(msg);
        })
        .finally(() => elementos.subscribeBtn.disabled = false);
}

function saveAdminToken(token) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Usuário não autenticado.');
    return db.ref(`adminTokens/${uid}`).set({
        token,
        timestamp: Date.now()
    }).then(() => localStorage.setItem(`pushToken_${uid}`, token));
}

function isTokenValid(token) {
    const uid = auth.currentUser?.uid;
    return token === localStorage.getItem(`pushToken_${uid}`);
}
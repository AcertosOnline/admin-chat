let messaging;

function initPush() {
    messaging = firebase.messaging(app);
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then(reg => console.log('Service Worker registrado:', reg))
            .catch(err => console.error('Erro ao registrar Service Worker:', err));
    }
}

function subscribeToPush() {
    elementos.subscribeBtn.disabled = true;
    Notification.requestPermission()
        .then(permission => {
            if (permission === 'granted') {
                return messaging.getToken({ vapidKey: 'BCIRsN3lHlpe7xAnIdYKAdcCD6vGBt9bAjkXUrRWfpg7O_WA1w_bfM3QfcjeQ1DR4FUYu9K36kQ-A5zvM2YsQiA' });
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
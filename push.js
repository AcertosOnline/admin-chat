let messaging;

function initPush(registration) {
    if (!firebase.apps.length) {
        const firebaseConfig = {
            apiKey: "AIzaSyA1C3iYQe22zhTP5HVj19atOZLROtba3rw",
            authDomain: "jogo-do-bicho-421ff.firebaseapp.com",
            databaseURL: "https://jogo-do-bicho-421ff-default-rtdb.firebaseio.com",
            projectId: "jogo-do-bicho-421ff",
            storageBucket: "jogo-do-bicho-421ff.firebasestorage.app",
            messagingSenderId: "1023919123583",
            appId: "1:1023919123583:web:b6c561fb121fe54f9e234a",
            measurementId: "G-BPH150V2SG"
        };
        firebase.initializeApp(firebaseConfig);
    }
    messaging = firebase.messaging(); // Não precisa de `app` explicitamente se houver apenas uma instância
    console.log('Firebase Messaging inicializado com Service Worker:', registration);
}

function subscribeToPush() {
    if (!messaging) {
        customAlert('Notificações push não inicializadas ainda. Tente novamente em breve.');
        return;
    }
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
            const msg = err.code === 'messaging/permission-blocked' ? 'Notificações bloqueadas pelo navegador. Verifique as configurações do Brave.' : err.message;
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
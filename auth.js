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

let app, auth, db;

function initAuth() {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth(app);
    db = firebase.database(app);
}

function logarAdmin() {
    const email = elementos.email.value.trim();
    const senha = elementos.senha.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        elementos.loginError.textContent = 'Digite um e-mail válido.';
        elementos.loginError.style.display = 'block';
        return;
    }
    if (!senha) {
        elementos.loginError.textContent = 'Digite a senha.';
        elementos.loginError.style.display = 'block';
        return;
    }

    elementos.loginError.style.display = 'none';
    auth.signInWithEmailAndPassword(email, senha)
        .then((userCredential) => {
            localStorage.setItem('isLoggedIn', 'true');
            updateScreenVisibility(true, userCredential.user);
        })
        .catch(e => {
            elementos.loginError.textContent = e.code === 'auth/invalid-credential' ? 'Credenciais inválidas.' : e.message;
            elementos.loginError.style.display = 'block';
        });
}

function deslogarAdmin() {
    customConfirm('Deseja realmente deslogar?', (confirm) => {
        if (confirm) {
            auth.signOut().then(() => {
                elementos.email.value = '';
                elementos.senha.value = '';
                elementos.loginError.style.display = 'none';
                db.ref('status/admin').set({ online: false, isTyping: false });
                localStorage.removeItem('isLoggedIn');
                updateScreenVisibility(false, null);
            }).catch(e => customAlert('Erro ao deslogar: ' + e.message));
        }
    });
}

function updateScreenVisibility(isLoggedIn, user) {
    elementos.loadingScreen.style.display = 'none';
    elementos.loginScreen.style.display = isLoggedIn ? 'none' : 'flex';
    elementos.mainInterface.style.display = isLoggedIn ? 'flex' : 'none';
    if (isLoggedIn && user) {
        iniciarPainel();
    }
}
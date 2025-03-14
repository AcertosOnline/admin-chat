const CACHE_NAME = 'painel-admin-v2'; // Atualizado para forçar nova versão
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/utils.js',
    '/auth.js',
    '/chat.js',
    '/push.js',
    '/main.js',
    '/notification.mp3',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

// Importar Firebase no Service Worker
self.importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
self.importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

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
const messaging = firebase.messaging();

// Instalação: cachear os arquivos essenciais
self.addEventListener('install', event => {
    console.log('[SW] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cache aberto, adicionando arquivos...');
                return cache.addAll(urlsToCache);
            })
            .catch(error => console.error('[SW] Erro ao cachear arquivos:', error))
            .then(() => self.skipWaiting()) // Força ativação imediata
    );
});

// Ativação: limpar caches antigos
self.addEventListener('activate', event => {
    console.log('[SW] Ativando Service Worker...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim()) // Assume controle imediato
    );
});

// Fetch: servir do cache ou buscar da rede
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(error => console.error('[SW] Erro ao buscar recurso:', error))
    );
});

// Receber notificação push (Firebase Messaging)
messaging.onBackgroundMessage(payload => {
    console.log('[SW] Mensagem em background recebida:', payload);
    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || 'Nova Mensagem';
    const options = {
        body: notification.body || 'Você recebeu uma nova mensagem.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: {
            url: data.url || 'https://www.acertosonline.com/administrador.html',
            clienteId: data.clienteId || null
        }
    };

    console.log('[SW] Exibindo notificação:', { title, options });
    return self.registration.showNotification(title, options);
});

// Clicar na notificação: redirecionar para a página com clienteId
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notificação clicada:', event.notification);
    event.notification.close();

    const redirectUrl = event.notification.data?.url || 'https://www.acertosonline.com/administrador.html';
    console.log('[SW] Redirecionando para:', redirectUrl);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                console.log('[SW] Clientes encontrados:', windowClients.length);
                for (let client of windowClients) {
                    console.log('[SW] URL do cliente:', client.url);
                    if (client.url.includes('administrador.html') && 'focus' in client) {
                        console.log('[SW] Focando janela existente');
                        client.navigate(redirectUrl); // Atualiza a URL se necessário
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    console.log('[SW] Abrindo nova janela:', redirectUrl);
                    return clients.openWindow(redirectUrl);
                }
                console.log('[SW] clients.openWindow não disponível');
            })
            .catch(error => {
                console.error('[SW] Erro ao redirecionar:', error);
            })
    );
});
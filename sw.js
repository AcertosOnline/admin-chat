const CACHE_NAME = 'painel-admin-v1';
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

// Instalação: cachear os arquivos essenciais
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Erro ao cachear arquivos:', error);
            })
    );
});

// Ativação: limpar caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});

// Fetch: servir do cache ou buscar da rede
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
            .catch(error => {
                console.error('Erro ao buscar recurso:', error);
            })
    );
});

// Receber notificação push
self.addEventListener('push', event => {
    let data = {};
    if (event.data) {
        data = event.data.json(); // Assume que o payload é JSON
    }

    const title = data.notification?.title || 'Nova Mensagem';
    const options = {
        body: data.notification?.body || 'Você recebeu uma nova mensagem.',
        icon: '/icon-192x192.png', // Ícone da notificação
        badge: '/icon-192x192.png', // Ícone pequeno (opcional)
        data: {
            url: data.data?.url || '/administrador.html', // URL de redirecionamento
            clienteId: data.data?.clienteId // ID do cliente
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Clicar na notificação: redirecionar para a página com clienteId
self.addEventListener('notificationclick', event => {
    event.notification.close(); // Fecha a notificação

    // Usa a URL do payload ou fallback para a página principal
    const redirectUrl = event.notification.data.url || '/administrador.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Verifica se a página já está aberta
            for (let client of windowClients) {
                if (client.url === redirectUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Se não estiver aberta, abre uma nova janela
            if (clients.openWindow) {
                return clients.openWindow(redirectUrl);
            }
        }).catch(error => {
            console.error('Erro ao redirecionar:', error);
        })
    );
});
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
    console.log('[SW] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cache aberto, adicionando arquivos...');
                return cache.addAll(urlsToCache);
            })
            .catch(error => console.error('[SW] Erro ao cachear arquivos:', error))
            .then(() => self.skipWaiting())
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
        }).then(() => self.clients.claim())
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

// Clicar na notificação: redirecionar para a URL especificada
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notificação clicada:', event.notification);
    event.notification.close();

    // Usa a URL do campo `data.url` da notificação ou um fallback
    const redirectUrl = event.notification.data?.url || 'https://adm.acertosonline.com/index.html';
    console.log('[SW] Redirecionando para:', redirectUrl);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                console.log('[SW] Clientes encontrados:', windowClients.length);
                for (let client of windowClients) {
                    if (client.url.includes('index.html') && 'focus' in client) {
                        console.log('[SW] Focando janela existente');
                        client.navigate(redirectUrl); // Atualiza a URL
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    console.log('[SW] Abrindo nova janela:', redirectUrl);
                    return clients.openWindow(redirectUrl);
                }
                console.log('[SW] clients.openWindow não disponível');
            })
            .catch(error => console.error('[SW] Erro ao redirecionar:', error))
    );
});
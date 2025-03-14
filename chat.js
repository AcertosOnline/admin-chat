let clienteSelecionado = null;

function criarClienteHTML(id, nome, online, unreadCount, selecionado) {
    const na = nome.length > 10 ? nome.substring(0, 10) + '...' : nome;
    const cl = online ? 'online' : 'offline';
    const ui = unreadCount > 0 && id !== clienteSelecionado ? '<i class="fas fa-envelope unread-icon"></i>' : '';
    return `<div class="cliente ${cl} ${selecionado ? 'selecionado' : ''}" data-id="${id}" onclick="selecionarCliente('${id}')">
        <span class="cliente-id">${na}${ui}</span>
        <span><button class="rename-action" onclick="renomearCliente('${id}', event)">Renomear</button>
        <button class="delete-action" onclick="deletarCliente('${id}', event)"><i class="fas fa-times"></i></button></span>
    </div>`;
}

function iniciarPainel() {
    const adminStatusRef = db.ref('status/admin');
    adminStatusRef.set({ online: true, isTyping: false });
    window.onunload = () => adminStatusRef.set({ online: false, isTyping: false });

    const debouncedTyping = debounce(() => adminStatusRef.update({ isTyping: false }), 1000);
    elementos.mensagem.addEventListener('input', function () {
        const l = this.value.length;
        elementos.charCount.textContent = `${l}/500`;
        elementos.charCount.classList.toggle('warning', l >= 450);
        adminStatusRef.update({ isTyping: true });
        debouncedTyping();
    });

    elementos.mensagem.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensagem();
        }
    });

    const statusRef = db.ref('status');
    statusRef.on('value', s => {
        elementos.loadingScreen.style.display = 'block';
        const c = s.val() || {}, online = [], offline = [];
        elementos.clientesLista.innerHTML = '';
        for (let id in c) {
            if (id !== 'admin') {
                const item = criarClienteHTML(id, c[id].nome || id, c[id].online, c[id].unreadCount || 0, id === clienteSelecionado);
                c[id].online ? online.push(item) : offline.push(item);
            }
        }
        elementos.clientesLista.innerHTML = online.join('') + offline.join('');
        elementos.loadingScreen.style.display = 'none';
    });

    // Correção da barra de busca
    if (!elementos.buscaClientes) {
        console.error('Elemento #busca-clientes não encontrado!');
        return;
    }
    elementos.buscaClientes.addEventListener('input', function (e) {
        const debouncedSearch = debounce(() => {
            const termo = e.target.value.toLowerCase();
            const clientes = document.querySelectorAll('.cliente');
            clientes.forEach(cliente => {
                const nomeCliente = cliente.querySelector('.cliente-id').textContent.toLowerCase();
                cliente.style.display = nomeCliente.includes(termo) ? '' : 'none';
            });
        }, 300);
        debouncedSearch();
    });

    // Monitorar mensagens de todos os clientes para notificações
    const mensagensRef = db.ref('mensagens');
    mensagensRef.on('child_changed', snapshot => {
        const clienteId = snapshot.key;
        const mensagens = snapshot.val();
        const ultimaMensagem = mensagens[Object.keys(mensagens).sort((a, b) => mensagens[a].timestamp - mensagens[b].timestamp).pop()];
        
        // Verificar se a mensagem é do cliente e não do admin
        if (ultimaMensagem && ultimaMensagem.de !== 'admin') {
            if (document.visibilityState === 'hidden') {
                // Aba inativa: tocar som e piscar título
                playNotificationSound();
                startTitleBlink('Nova Mensagem!');
            }
            // Incrementar unreadCount se não for o cliente selecionado
            if (clienteId !== clienteSelecionado) {
                db.ref('status/' + clienteId).child('unreadCount').transaction(count => (count || 0) + 1);
            }
        }
    });

    // Parar o título piscante quando a aba voltar a ficar ativa
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            stopTitleBlink();
        }
    });
}

function atualizarChat(id) {
    const mr = db.ref('mensagens/' + id);
    const sr = db.ref('status/' + id);
    mr.off();
    sr.off();

    sr.on('value', s => {
        const cd = s.val() || {};
        elementos.chatTitle.textContent = `Chat com ${cd.nome || id}`;
        elementos.chatStatus.textContent = cd.online ? 'online' : 'offline';
        elementos.chatStatus.className = `chat-status ${cd.online ? 'online' : 'offline'}`;
        elementos.typingIndicator.style.display = cd.isTyping ? 'block' : 'none';

        mr.on('value', ms => {
            const m = ms.val() || {};
            elementos.chat.innerHTML = Object.keys(m).length ? '' : '<p>Sem mensagens ainda.</p>';
            let html = '', lastSender = null;
            const sortedKeys = Object.keys(m).sort((a, b) => m[a].timestamp - m[b].timestamp);
            for (let k of sortedKeys) {
                const msg = m[k], cl = msg.de === 'admin' ? 'admin-msg' : 'cliente-msg',
                    ts = formatarTimestamp(msg.timestamp),
                    label = lastSender !== msg.de ? (msg.de === 'admin' ? 'Você:' : 'Cliente:') : '';
                html += `<div class="mensagem ${cl}" data-msg-id="${k}">${label ? `<b>${label}</b> ` : ''}${msg.texto}<span class="timestamp">${ts}</span></div>`;
                lastSender = msg.de;
            }
            elementos.chat.innerHTML = html;
            elementos.chat.scrollTop = elementos.chat.scrollHeight;
        });
    });
}

function selecionarCliente(id) {
    if (clienteSelecionado !== id) {
        clienteSelecionado = id;
        document.querySelectorAll('.cliente').forEach(c => c.classList.remove('selecionado'));
        const s = document.querySelector(`[data-id="${id}"]`);
        if (s) s.classList.add('selecionado');
        db.ref('status/' + id).update({ unreadCount: 0 });
        atualizarChat(id);
    }
}

function enviarMensagem() {
    const texto = elementos.mensagem.value.trim();
    if (!clienteSelecionado) return customAlert('Selecione um cliente primeiro!');
    if (!texto) return;
    if (texto.length > 500) return customAlert('A mensagem não pode exceder 500 caracteres!');
    db.ref('mensagens/' + clienteSelecionado).push({ texto, de: 'admin', timestamp: Date.now() })
        .then(() => {
            elementos.mensagem.value = '';
            elementos.charCount.textContent = '0/500';
            db.ref('status/admin').update({ isTyping: false });
        }).catch(e => customAlert('Erro ao enviar mensagem: ' + e.message));
}

function deletarCliente(id, e) {
    e.stopPropagation();
    customConfirm(`Deseja deletar o chat do cliente ${id}?`, c => {
        if (c) {
            Promise.all([
                db.ref('status/' + id).remove(),
                db.ref('mensagens/' + id).remove()
            ]).then(() => {
                if (clienteSelecionado === id) {
                    clienteSelecionado = null;
                    elementos.chat.innerHTML = '';
                    elementos.chatTitle.textContent = '';
                    elementos.chatStatus.textContent = '';
                    elementos.typingIndicator.style.display = 'none';
                }
            }).catch(e => customAlert('Erro ao deletar cliente: ' + e.message));
        }
    });
}

function deletarClientesInativos() {
    customConfirm("Deseja apagar TODOS os clientes inativos? Essa ação não pode ser desfeita!", c => {
        if (c) db.ref('status').once('value', s => {
            const cl = s.val() || {};
            for (let id in cl) {
                if (id !== 'admin' && !cl[id].online) {
                    db.ref('status/' + id).remove();
                    db.ref('mensagens/' + id).remove();
                }
            }
            if (clienteSelecionado && !cl[clienteSelecionado]?.online) {
                clienteSelecionado = null;
                elementos.chat.innerHTML = '';
                elementos.chatTitle.textContent = '';
                elementos.chatStatus.textContent = '';
                elementos.typingIndicator.style.display = 'none';
            }
        });
    });
}

function renomearCliente(id, e) {
    e.stopPropagation();
    db.ref('status/' + id).once('value', s => {
        const cd = s.val() || {}, n = cd.nome || id;
        customPrompt(`Digite o novo nome para o cliente ${n}:`, n, nn => {
            if (nn && nn.trim()) {
                db.ref('status/' + id).update({ nome: nn.trim() })
                    .then(() => clienteSelecionado === id && atualizarChat(id))
                    .catch(e => customAlert('Erro ao renomear cliente: ' + e.message));
            }
        });
    });
}
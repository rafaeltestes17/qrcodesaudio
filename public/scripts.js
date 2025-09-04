let currentFiles = [];
let originalFiles = [];
let currentDescricao = '';
let originalDescricao = '';
let currentQrImage = '';
let originalQrImage = '';

const filesList = document.getElementById('audios-list'); 
const qrDescricaoInput = document.getElementById('qr-descricao');
const uploadInput = document.getElementById('upload-audio'); 
const uploadBtn = document.getElementById('upload-btn');
const uploadQRInput = document.getElementById('upload-qr');
const uploadQRBtn = document.getElementById('upload-qr-btn');
const qrImageLink = document.getElementById('qr-image-link');
const viewQrLinkBtn = document.getElementById('view-qr-link');

const saveBtn = document.getElementById('save-btn');
const rejectBtn = document.getElementById('reject-btn');
const backBtn = document.getElementById('back-btn');

// --------------------------
// Pega o ID da URL
// --------------------------
function getQrIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// --------------------------
// Renderiza arquivos
// --------------------------
function renderFiles() {
    filesList.innerHTML = '';
    currentFiles.forEach((file, i) => {
        const li = document.createElement('li');
        li.className = 'audio-card';

        const row = document.createElement('div');
        row.className = 'audio-row';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = file.nome || `Arquivo ${i+1}`;
        input.addEventListener('input', () => currentFiles[i].nome = input.value);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remover';
        removeBtn.classList.add('files-btn');
        removeBtn.onclick = () => { currentFiles.splice(i, 1); renderFiles(); };

        row.appendChild(input);
        row.appendChild(removeBtn);
        li.appendChild(row);

        const urlSpan = document.createElement('span');
        urlSpan.innerHTML = `<strong>Tipo:</strong> ${file.tipo} - <a href="${file.url}" target="_blank">${file.nome}</a>`;
        li.appendChild(urlSpan);

        filesList.appendChild(li);
    });
}

// --------------------------
// Cria botão Ver QR Code
// --------------------------
function createQrButton(url) {
    qrImageLink.innerHTML = ''; // limpa conteúdo antigo
    if (!url) return;

    const btn = document.createElement('button');
    btn.textContent = 'Ver QR Code';
    btn.classList.add('files-btn'); // mesma classe de estilo que outros botões
    btn.addEventListener('click', () => window.open(url, '_blank'));

    qrImageLink.appendChild(btn);
}

// --------------------------
// Carrega dados do QR code
// --------------------------
function loadQr() {
    const id = getQrIdFromUrl();
    if (!id) return alert('ID do QR Code não especificado!');

    fetch(`/api/files/${id}`)
        .then(r => r.json())
        .then(data => {
            currentFiles = data.arquivos || [];
            originalFiles = JSON.parse(JSON.stringify(currentFiles));

            currentDescricao = data.descricao || '';
            originalDescricao = currentDescricao;

            currentQrImage = data.qrImage || '';
            originalQrImage = currentQrImage;

            qrDescricaoInput.value = currentDescricao;
            createQrButton(currentQrImage);
            renderFiles();
        })
        .catch(e => { console.error(e); alert('Erro ao carregar QR Code'); });
}

// --------------------------
// Upload de qualquer arquivo
// --------------------------
uploadBtn.addEventListener('click', () => {
    const file = uploadInput.files[0];
    if (!file) return alert('Escolha um arquivo');

    const form = new FormData();
    form.append('file', file);
    form.append('id', getQrIdFromUrl());

    fetch('/upload-file', { method: 'POST', body: form })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                currentFiles.push(data.file);
                renderFiles();
                alert('Upload concluído!');
                uploadInput.value = '';
            } else alert('Erro no upload: ' + data.error);
        }).catch(e => { console.error(e); alert('Erro no upload'); });
});

// --------------------------
// Upload QR Code
// --------------------------
uploadQRBtn.addEventListener('click', () => {
    const file = uploadQRInput.files[0];
    if (!file) return alert('Escolha uma imagem de QR Code');

    const form = new FormData();
    form.append('qr', file);
    form.append('id', getQrIdFromUrl());

    fetch('/upload-qr', { method: 'POST', body: form })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                currentQrImage = data.url;
                createQrButton(data.url);
                alert('Upload concluído!');
                uploadQRInput.value = '';
            } else alert('Erro no upload QR Code');
        }).catch(e => { console.error(e); alert('Erro no upload QR Code'); });
});

// --------------------------
// Consultar link do QR Code
// --------------------------
viewQrLinkBtn.addEventListener('click', () => {
    const id = getQrIdFromUrl();
    if (!id) return alert('ID do QR Code não especificado!');
    window.open(`/qrcode.html?id=${id}`, '_blank');
});

// --------------------------
// Salvar alterações
// --------------------------
saveBtn.addEventListener('click', () => {
    const id = getQrIdFromUrl();
    fetch(`/api/files/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arquivos: currentFiles, descricao: qrDescricaoInput.value, qrImage: currentQrImage })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                alert('QR Code atualizado!');
                originalFiles = JSON.parse(JSON.stringify(currentFiles));
                originalDescricao = qrDescricaoInput.value;
                originalQrImage = currentQrImage;
            } else alert('Erro ao salvar');
        }).catch(e => { console.error(e); alert('Erro ao salvar'); });
});

// --------------------------
// Rejeitar alterações
// --------------------------
rejectBtn.addEventListener('click', () => {
    currentFiles = JSON.parse(JSON.stringify(originalFiles));
    currentDescricao = originalDescricao;
    currentQrImage = originalQrImage;

    qrDescricaoInput.value = currentDescricao;
    createQrButton(currentQrImage);
    renderFiles();
});

// --------------------------
// Voltar à listagem
// --------------------------
backBtn.addEventListener('click', () => {
    window.location.href = '/gestor.html';
});

// --------------------------
// Inicializa
// --------------------------
loadQr();

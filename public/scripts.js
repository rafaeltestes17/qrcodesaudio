let currentAudios = [];

const qrSelect = document.getElementById('qr-id');
const audiosList = document.getElementById('audios-list');
const newAudioInput = document.getElementById('new-audio');
const addAudioBtn = document.getElementById('add-audio');
const saveBtn = document.getElementById('save-audios');

const uploadInput = document.getElementById('upload-audio');
const uploadBtn = document.getElementById('upload-btn');
const addQrBtn = document.getElementById('add-qrcode'); // botão para criar novo QR code
const viewQrBtn = document.getElementById('view-qr-link'); // botão para ver link
const qrLinkDisplay = document.getElementById('qr-link');

// --------------------------
// Renderiza a lista de áudios
// --------------------------
function renderAudios() {
    audiosList.innerHTML = '';
    currentAudios.forEach((audio, index) => {
        const li = document.createElement('li');
        li.textContent = audio;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remover';
        removeBtn.onclick = () => {
            currentAudios.splice(index, 1);
            renderAudios();
        };
        li.appendChild(removeBtn);
        audiosList.appendChild(li);
    });
}

// --------------------------
// Carrega os áudios quando muda o QR code
// --------------------------
qrSelect.addEventListener('change', () => {
    const id = qrSelect.value;
    fetch(`/api/audios/${id}`)
        .then(res => res.json())
        .then(data => {
            currentAudios = data.audios;
            renderAudios();
        });
});

// --------------------------
// Adicionar novo áudio via URL
// --------------------------
addAudioBtn.addEventListener('click', () => {
    const url = newAudioInput.value.trim();
    if (url) {
        currentAudios.push(url);
        newAudioInput.value = '';
        renderAudios();
    }
});

// --------------------------
// Upload de arquivo MP3
// --------------------------
uploadBtn.addEventListener('click', () => {
    const file = uploadInput.files[0];
    if (!file) return alert('Escolha um arquivo .mp3');

    const formData = new FormData();
    formData.append('audio', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            currentAudios.push(data.url);
            renderAudios();
            alert('Upload concluído!');
            uploadInput.value = '';
        } else {
            alert('Erro no upload');
        }
    })
    .catch(err => {
        console.error(err);
        alert('Erro no upload');
    });
});

// --------------------------
// Salvar alterações no servidor
// --------------------------
saveBtn.addEventListener('click', () => {
    const id = qrSelect.value;
    fetch(`/api/audios/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audios: currentAudios })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) alert('Áudios atualizados com sucesso!');
        else alert('Erro ao salvar.');
    })
    .catch(err => {
        console.error(err);
        alert('Erro ao salvar.');
    });
});

// --------------------------
// Carregar QR codes do servidor
// --------------------------
function loadQrCodes() {
    fetch('/api/qrcodes')
        .then(res => res.json())
        .then(data => {
            qrSelect.innerHTML = '';
            data.qrCodes.forEach(id => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `QR Code ${id}`;
                qrSelect.appendChild(option);
            });
            if (qrSelect.options.length > 0) {
                qrSelect.dispatchEvent(new Event('change'));
            }
        });
}

// --------------------------
// Adicionar novo QR code
// --------------------------
addQrBtn.addEventListener('click', () => {
    const existingIds = Array.from(qrSelect.options).map(o => parseInt(o.value));
    let newId = 1;
    while (existingIds.includes(newId)) newId++;

    const option = document.createElement('option');
    option.value = newId;
    option.textContent = `QR Code ${newId}`;
    qrSelect.appendChild(option);
    qrSelect.value = newId;

    currentAudios = [];
    renderAudios();
});

// --------------------------
// Gerar link do QR code selecionado
// --------------------------
viewQrBtn.addEventListener('click', () => {
    const id = qrSelect.value;
    const link = `${window.location.origin}/qrcode.html?id=${id}`;
    qrLinkDisplay.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
});

// --------------------------
// Inicialização
// --------------------------
loadQrCodes();

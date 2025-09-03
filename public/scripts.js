let currentAudios = [];
let currentDescricao = '';

const qrSelect = document.getElementById('qr-id');
const audiosList = document.getElementById('audios-list');
const saveBtn = document.getElementById('save-audios');

const uploadInput = document.getElementById('upload-audio');
const uploadBtn = document.getElementById('upload-btn');
const addQrBtn = document.getElementById('add-qrcode');
const viewQrBtn = document.getElementById('view-qr-link');
const deleteQrBtn = document.getElementById('delete-qr');
const qrLinkDisplay = document.getElementById('qr-link');
const qrDescricaoInput = document.getElementById('qr-descricao');

// --------------------------
// Renderiza a lista de áudios
// --------------------------
function renderAudios() {
    audiosList.innerHTML = '';
    currentAudios.forEach((audio, index) => {
        const li = document.createElement('li');
        li.className = 'audio-card';

        const row = document.createElement('div');
        row.className = 'audio-row';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = audio.nome || `Áudio ${index + 1}`;
        nameInput.placeholder = 'Nome do áudio';
        nameInput.addEventListener('input', () => {
            currentAudios[index].nome = nameInput.value;
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remover';
        removeBtn.onclick = () => {
            currentAudios.splice(index, 1);
            renderAudios();
        };

        row.appendChild(nameInput);
        row.appendChild(removeBtn);
        li.appendChild(row);

        const urlSpan = document.createElement('span');
        urlSpan.textContent = audio.url;
        li.appendChild(urlSpan);

        audiosList.appendChild(li);
    });
}

// --------------------------
// Carrega os áudios e descrição quando muda o QR code
// --------------------------
qrSelect.addEventListener('change', () => {
    const id = qrSelect.value;
    fetch(`/api/audios/${id}`)
        .then(res => res.json())
        .then(data => {
            currentAudios = (data.audios || []).map(a => {
                if (typeof a === 'string') return { url: a, nome: '' };
                return a;
            });
            currentDescricao = data.descricao || '';
            qrDescricaoInput.value = currentDescricao;
            renderAudios();
        });
});

// --------------------------
// Atualiza a descrição do QR code
// --------------------------
qrDescricaoInput.addEventListener('input', () => {
    currentDescricao = qrDescricaoInput.value;
});

// --------------------------
// Upload de arquivo de áudio (qualquer formato suportado pelo navegador)
// --------------------------
uploadBtn.addEventListener('click', () => {
    const file = uploadInput.files[0];
    if (!file) return alert('Escolha um arquivo de áudio');

    // Validação do tipo MIME
    if (!file.type.startsWith('audio/')) {
        return alert('Por favor, escolha apenas arquivos de áudio válidos');
    }

    const formData = new FormData();
    formData.append('audio', file);

    fetch('/upload', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentAudios.push({ url: data.url, nome: '' });
                renderAudios();
                alert('Upload concluído!');
                uploadInput.value = '';
            } else {
                alert('Erro no upload');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Erro no upload.');
        });
});

// --------------------------
// Salvar alterações (áudios + descrição)
// --------------------------
saveBtn.addEventListener('click', () => {
    const id = qrSelect.value;
    fetch(`/api/audios/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audios: currentAudios, descricao: currentDescricao })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('QR Code atualizado com sucesso!');
            loadQrCodes();
        } else {
            alert('Erro ao salvar.');
        }
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
            data.qrCodes.forEach(qr => {
                const option = document.createElement('option');
                option.value = qr.id;
                option.textContent = `QR Code ${qr.id} - ${qr.descricao || ''}`;
                qrSelect.appendChild(option);
            });
            if (qrSelect.options.length > 0) qrSelect.dispatchEvent(new Event('change'));
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
    currentDescricao = '';
    qrDescricaoInput.value = '';
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
// Eliminar QR code selecionado
// --------------------------
deleteQrBtn.addEventListener('click', () => {
    if (!confirm('Tem certeza que deseja eliminar este QR Code?')) return;

    const id = qrSelect.value;
    fetch(`/api/qrcodes/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('QR Code eliminado com sucesso!');
                loadQrCodes();
                currentAudios = [];
                currentDescricao = '';
                qrDescricaoInput.value = '';
                qrLinkDisplay.innerHTML = '';
            } else {
                alert('Erro ao eliminar QR Code.');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao eliminar QR Code.');
        });
});

// --------------------------
// Inicialização
// --------------------------
loadQrCodes();

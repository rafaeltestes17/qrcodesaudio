const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Configuração do multer para uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --------------------------
// Rota para pegar os áudios + descrição de um QR code
// --------------------------
app.get('/api/audios/:id', (req, res) => {
    const id = req.params.id;
    let data = {};
    try {
        data = JSON.parse(fs.readFileSync('audios.json', 'utf8'));
    } catch (err) {
        data = {};
    }

    const qrData = data[id] || { descricao: '', audios: [] };
    res.json(qrData);
});

// --------------------------
// Rota para atualizar os dados de um QR code (audios + descricao)
// --------------------------
app.post('/api/audios/:id', (req, res) => {
    const id = req.params.id;
    const { audios, descricao } = req.body;

    if (!Array.isArray(audios)) {
        return res.status(400).json({ error: 'audios precisa ser um array' });
    }

    let data = {};
    try {
        data = JSON.parse(fs.readFileSync('audios.json', 'utf8'));
    } catch (err) {
        data = {};
    }

    data[id] = {
        descricao: descricao || '',
        audios: audios
    };

    fs.writeFileSync('audios.json', JSON.stringify(data, null, 2));
    res.json({ success: true, ...data[id] });
});

// --------------------------
// Endpoint para upload de áudio
// --------------------------
app.post('/upload', upload.single('audio'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
});

// --------------------------
// Rota para listar todos os QR codes (com id + descricao)
// --------------------------
app.get('/api/qrcodes', (req, res) => {
    let data = {};
    try {
        data = JSON.parse(fs.readFileSync('audios.json', 'utf8'));
    } catch (err) {
        data = {};
    }

    const qrCodes = Object.keys(data).map(id => ({
        id,
        descricao: data[id].descricao || ''
    }));

    res.json({ qrCodes });
});

// --------------------------
// Rota para deletar um QR code
// --------------------------
app.delete('/api/qrcodes/:id', (req, res) => {
    const id = req.params.id;

    let data = {};
    try {
        data = JSON.parse(fs.readFileSync('audios.json', 'utf8'));
    } catch (err) {
        data = {};
    }

    if (!data[id]) {
        return res.status(404).json({ error: 'QR code não encontrado' });
    }

    delete data[id];
    fs.writeFileSync('audios.json', JSON.stringify(data, null, 2));
    res.json({ success: true });
});

// --------------------------
// Iniciar o servidor
// --------------------------
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

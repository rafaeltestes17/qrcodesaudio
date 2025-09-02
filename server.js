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
        cb(null, 'public/uploads'); // salva em public/uploads
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// --------------------------
// Rota para pegar os áudios de um QR code
// --------------------------
app.get('/api/audios/:id', (req, res) => {
    const id = req.params.id;
    let data = {};
    try {
        data = JSON.parse(fs.readFileSync('audios.json', 'utf8'));
    } catch (err) {
        // se audios.json não existir, retorna vazio
        data = {};
    }
    const audios = data[id] || [];
    res.json({ audios });
});

// --------------------------
// Rota para atualizar os áudios de um QR code (via painel)
// --------------------------
app.post('/api/audios/:id', (req, res) => {
    const id = req.params.id;
    const newAudios = req.body.audios; // deve ser um array de URLs

    if (!Array.isArray(newAudios)) {
        return res.status(400).json({ error: 'audios precisa ser um array' });
    }

    let data = {};
    try {
        data = JSON.parse(fs.readFileSync('audios.json', 'utf8'));
    } catch (err) {
        data = {};
    }

    data[id] = newAudios;
    fs.writeFileSync('audios.json', JSON.stringify(data, null, 2));

    res.json({ success: true, audios: data[id] });
});

// --------------------------
// Endpoint para upload de áudio
// --------------------------
app.post('/upload', upload.single('audio'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    // URL que será usada no frontend
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
});

// --------------------------
// Rota para listar todos os QR codes existentes
// --------------------------
app.get('/api/qrcodes', (req, res) => {
    let data = {};
    try {
        data = JSON.parse(fs.readFileSync('audios.json', 'utf8'));
    } catch (err) {
        data = {};
    }
    const qrCodes = Object.keys(data); // retorna ["1","2","3",...]
    res.json({ qrCodes });
});

// --------------------------
// Iniciar o servidor
// --------------------------
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

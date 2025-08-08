const express = require('express');
const router = express.Router();
require('dotenv').config();
const path = require('path');


// RAM’de tutmak için basit obje
const veriler = {};

// POST: veriyi güncelle
router.post('/:isletme/current_song', (req, res) => {
    const isletme = req.params.isletme;
    const apiKeyHeader = req.headers['x-api-key'];
    const expectedKey = process.env[isletme];
    console.log("isletme parametresi:", isletme);
    console.log("Env'den çekilen:", process.env[isletme]);

    if (!expectedKey || apiKeyHeader !== expectedKey) {
        return res.status(403).json({ error: 'Geçersiz API Key' });
    }

    const { text } = req.body;
    if (typeof text !== 'string') {
        return res.status(400).json({ error: 'text alanı zorunlu ve string olmalı.' });
    }

    veriler[isletme] = { current_song: text };
    res.json({ success: true });
});

// GET: veriyi döndür
router.get('/:isletme/current_song', (req, res) => {
    const isletme = req.params.isletme;
    const data = veriler[isletme];

    if (!data || !data.current_song) {
        return res.status(404).json({ error: 'current_song verisi yok!' });
    }

    res.json({ current_song: data.current_song });
});



// POST: veriyi güncelle
router.post('/:isletme/random_3_songs', (req, res) => {
    const isletme = req.params.isletme;
    const apiKeyHeader = req.headers['x-api-key'];
    const expectedKey = process.env[isletme];

    if (!expectedKey || apiKeyHeader !== expectedKey) {
        return res.status(403).json({ error: 'Geçersiz API Key' });
    }

    const songs = req.body.songs || req.body; // Hem songs objesi hem de doğrudan dizi kabul et

    if (!Array.isArray(songs) || songs.length !== 3) {
        return res.status(400).json({ error: 'Tam olarak 3 şarkı içeren bir JSON dizisi gönderin.' });
    }

    const invalid = songs.find(s => !s || typeof s.title !== 'string' || typeof s.url !== 'string');
    if (invalid) {
        return res.status(400).json({ error: 'Her şarkının "title" ve "url" alanı olmalı.' });
    }

    if (!veriler[isletme]) veriler[isletme] = {};
    veriler[isletme].random_3_songs = songs;

    res.json({ success: true });
});



// GET: veriyi döndür
router.get('/:isletme/random_3_songs', (req, res) => {
    const isletme = req.params.isletme;
    const data = veriler[isletme];

    if (!data || !data.random_3_songs) {
        return res.status(404).json({ error: 'random_3_songs verisi yok!' });
    }

    res.json({ random_3_songs: data.random_3_songs });
});



router.post('/:isletme/vote/:index', (req, res) => {
    const isletme = req.params.isletme;
    const index = Number(req.params.index);

    if (!gecerliIndis(index)) {
        return res.status(400).json({ hata: 'index 0‑2 aralığında olmalı.' });
    }
    if (!veriler[isletme] || !veriler[isletme].sayac) {
        return res.status(404).json({ hata: 'Veri bulunamadı.' });
    }

    veriler[isletme].sayac[index] += 1;

    res.json({
        mesaj: `#${index + 1}. şarkıya oy verildi`,
        sayac: veriler[isletme].sayac,
    });
});


router.get('/:isletme/sayac', (req, res) => {
    const { isletme } = req.params;

    if (!veriler[isletme] || !veriler[isletme].sayac) {
        return res.status(404).json({ hata: 'Sayaç verisi bulunamadı.' });
    }

    res.json({ sayac: veriler[isletme].sayac });
});




router.get('/yazilimci_minikler', (req, res) => {
    // 'public' klasörü bir üstteyse, '..' ile yukarı çık
    res.sendFile(path.join(__dirname, '..', 'public', 'yazilimci_minikler.html'));
});


router.get('/yazilimci_minikler/abdullah', (req, res) => {
    // 'public' klasörü bir üstteyse, '..' ile yukarı çık
    res.sendFile(path.join(__dirname, '..', 'public', 'abdullah.html'));
});


//! AŞAĞIDA ":" İŞARETİ VAR , YANİ BURAYA NE YAZARSAN YAZ SANA İNDEX.HTML İ DÖNECEKTİR
router.get('/:isletme', (req, res) => {
    // 'public' klasörü bir üstteyse, '..' ile yukarı çık
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


module.exports = router;

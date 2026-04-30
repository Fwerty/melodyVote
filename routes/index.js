const express = require("express");
const router = express.Router();
require("dotenv").config();
const path = require("path");

// RAM’de tutmak için basit obje
const veriler = {};

// 🎵 Şu an çalan şarkı POST
router.post("/:isletme/current_song", (req, res) => {
  const isletme = req.params.isletme;
  const apiKeyHeader = req.headers["x-api-key"];
  const expectedKey = process.env[isletme];

  if (!expectedKey || apiKeyHeader !== expectedKey) {
    return res.status(403).json({ error: "Geçersiz API Key" });
  }

  const { text } = req.body;
  if (typeof text !== "string") {
    return res
      .status(400)
      .json({ error: "text alanı zorunlu ve string olmalı." });
  }

  veriler[isletme] = { ...veriler[isletme], current_song: text };
  res.json({ success: true });
});

// 🎵 Şu an çalan şarkı GET
router.get("/:isletme/current_song", (req, res) => {
  const isletme = req.params.isletme;
  const data = veriler[isletme];

  if (!data || !data.current_song) {
    return res.status(404).json({ error: "current_song verisi yok!" });
  }

  res.json({ current_song: data.current_song });
});

// 🎶 Rastgele 3 şarkı POST
router.post("/:isletme/random_3_songs", (req, res) => {
  const isletme = req.params.isletme;
  const apiKeyHeader = req.headers["x-api-key"];
  const expectedKey = process.env[isletme];

  if (!expectedKey || apiKeyHeader !== expectedKey) {
    return res.status(403).json({ error: "Geçersiz API Key" });
  }

  const songs = req.body.songs || req.body;

  if (!Array.isArray(songs) || songs.length < 3) {
    return res.status(400).json({
      error: "En az 3 şarkı içeren bir JSON dizisi gönderin.",
    });
  }

  const invalid = songs.find(
    (s) => !s || typeof s.title !== "string" || typeof s.url !== "string",
  );

  if (invalid) {
    return res.status(400).json({
      error: 'Her şarkının "title" ve "url" alanı olmalı.',
    });
  }

  veriler[isletme] = {
    ...veriler[isletme],
    random_3_songs: songs,
    sayac: new Array(songs.length).fill(0),
  };

  res.json({ success: true });
});

// 🎶 Rastgele 3 şarkı GET
router.get("/:isletme/random_3_songs", (req, res) => {
  const isletme = req.params.isletme;
  const data = veriler[isletme];

  if (!data || !data.random_3_songs) {
    return res.status(404).json({ error: "random_3_songs verisi yok!" });
  }

  res.json({ random_3_songs: data.random_3_songs });
});

// 🗳️ Oy verme endpoint'leri
router.post("/:isletme/vote/:index", (req, res) => {
  const isletme = req.params.isletme;
  const index = parseInt(req.params.index);

  if (!veriler[isletme] || !veriler[isletme].sayac) {
    return res.status(404).json({ mesaj: "Veri bulunamadı" });
  }
  if (isNaN(index) || index < 0 || index >= veriler[isletme].sayac.length) {
    return res.status(400).json({
      mesaj: "Geçersiz oy indexi.",
    });
  }
  veriler[isletme].sayac[index]++;
  res.json({
    mesaj: `${index + 1}. şarkıya oy verildi`,
    sayac: veriler[isletme].sayac,
  });
});

// 📊 Oy sayacı GET
router.get("/:isletme/sayac", (req, res) => {
  const isletme = req.params.isletme;

  if (!veriler[isletme] || !veriler[isletme].sayac) {
    return res.status(404).json({ mesaj: "Sayac verisi bulunamadı" });
  }

  res.json({ sayac: veriler[isletme].sayac });
});

// 📄 Statik HTML dosyaları
router.get("/yazilimci_minikler", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "..",
      "public",
      "yazilimci_minikler",
      "yazilimci_minikler.html",
    ),
  );
});

router.get("/yazilimci_minikler/omer", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "yazilimci_minikler", "omer.html"),
  );
});

router.get("/yazilimci_minikler/ecem", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "yazilimci_minikler", "ecem.html"),
  );
});

// 🏠 Varsayılan index.html
router.get("/:isletme", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

module.exports = router;

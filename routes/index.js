const express = require("express");
const router = express.Router();
require("dotenv").config();
const path = require("path");

// RAM’de tutmak için basit obje
const veriler = {};

// -------------------------------------------
// 💬 Anonim Chat (RAM + TTL)
// -------------------------------------------
const CHAT_TTL_MS = 2 * 60 * 1000; // 2 dk
const CHAT_MAX_MESSAGES_PER_ROOM = 120;
const CHAT_FETCH_LIMIT_DEFAULT = 50;
const CHAT_MESSAGE_MAX_LEN = 300;
const CHAT_RATE_LIMIT_MS = 2000; // IP başına 2 sn'de 1 mesaj

// roomId -> [{ id, text, ts }]
const chatRooms = new Map();
// `${roomId}:${ip}` -> lastSentTs
const chatRateLimit = new Map();

function _getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) {
    return xf.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "unknown";
}

function _cleanupRoom(roomId, now = Date.now()) {
  const messages = chatRooms.get(roomId);
  if (!messages || messages.length === 0) return [];

  const cutoff = now - CHAT_TTL_MS;
  const filtered = messages.filter((m) => m && typeof m.ts === "number" && m.ts >= cutoff);

  const trimmed =
    filtered.length > CHAT_MAX_MESSAGES_PER_ROOM
      ? filtered.slice(filtered.length - CHAT_MAX_MESSAGES_PER_ROOM)
      : filtered;

  chatRooms.set(roomId, trimmed);
  return trimmed;
}

function _makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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

  const songs =
    req.body?.random_3_songs || req.body?.songs || req.body;

  if (!Array.isArray(songs) || (songs.length !== 3 && songs.length !== 4)) {
    return res.status(400).json({
      error: "Tam olarak 3 veya 4 şarkı içeren bir JSON dizisi gönderin.",
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

// -------------------------------------------
// 💬 Chat endpoints (anonim, kalıcı değil)
// -------------------------------------------
router.get("/:isletme/chat/messages", (req, res) => {
  const roomId = req.params.isletme;
  const afterRaw = req.query.after;
  const limitRaw = req.query.limit;

  const now = Date.now();
  const messages = _cleanupRoom(roomId, now);

  const after = typeof afterRaw === "string" ? Number(afterRaw) : null;
  const limit = typeof limitRaw === "string" ? Number(limitRaw) : CHAT_FETCH_LIMIT_DEFAULT;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : CHAT_FETCH_LIMIT_DEFAULT;

  let result = messages;
  if (Number.isFinite(after)) {
    result = messages.filter((m) => m.ts > after);
  }
  if (result.length > safeLimit) {
    result = result.slice(result.length - safeLimit);
  }

  res.json({
    roomId,
    now,
    messages: result,
  });
});

router.post("/:isletme/chat/messages", (req, res) => {
  const roomId = req.params.isletme;
  const ip = _getClientIp(req);
  const now = Date.now();

  const key = `${roomId}:${ip}`;
  const lastSent = chatRateLimit.get(key);
  if (typeof lastSent === "number" && now - lastSent < CHAT_RATE_LIMIT_MS) {
    return res.status(429).json({ error: "Cok hizli mesaj gonderiyorsun. Biraz yavasla." });
  }

  const textRaw = req.body?.text;
  if (typeof textRaw !== "string") {
    return res.status(400).json({ error: '"text" alani zorunlu ve string olmali.' });
  }

  const text = textRaw.trim();
  if (!text) {
    return res.status(400).json({ error: "Bos mesaj gonderilemez." });
  }
  if (text.length > CHAT_MESSAGE_MAX_LEN) {
    return res.status(400).json({ error: `Mesaj cok uzun. Max ${CHAT_MESSAGE_MAX_LEN} karakter.` });
  }

  const messages = _cleanupRoom(roomId, now);
  const msg = { id: _makeId(), text, ts: now };
  messages.push(msg);
  chatRooms.set(roomId, messages);
  chatRateLimit.set(key, now);

  res.json({ success: true, message: msg });
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

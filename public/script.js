const parts = location.pathname.split("/");
const isletme = parts[1];

let currentSongTitles = [];
let chatLastTs = 0;
let chatTimer = null;

// Mevcut fonksiyon
async function loadSong() {
  try {
    const res = await fetch(`/${isletme}/current_song`);
    if (!res.ok) throw new Error("Sunucudan veri gelmedi");
    const json = await res.json();

    const songText = json.current_song || "—";
    document.getElementById("song").textContent = songText;
  } catch (e) {
    document.getElementById("song").textContent = "Veri alınamadı";
    console.error(e);
  }
}

function generateSongSetKey(songs) {
  const key = songs.map((song) => song.title).join("|");
  console.log("🎼 Oluşturulan şarkı seti anahtarı:", key);
  return key;
}

// 🆕 Yeni fonksiyon: random_3_songs
async function loadRandomSongs() {
  try {
    const res = await fetch(`/${isletme}/random_3_songs`);
    console.log("📡 Şarkı verisi isteniyor...");
    if (!res.ok) throw new Error("Sunucudan rastgele şarkılar gelmedi");
    const json = await res.json();
    console.log("✅ Şarkı verisi alındı:", json);

    const randomSongs = Array.isArray(json.random_3_songs)
      ? json.random_3_songs
      : [];
    currentSongTitles = randomSongs.map((song) => song.title);

    const list = document.getElementById("randomSongs");
    list.innerHTML = "";

    const songSetKey = generateSongSetKey(randomSongs);
    const voteStatusRaw = localStorage.getItem("voteStatus");
    console.log("📦 localStorage.voteStatus:", voteStatusRaw);

    const voteStatus = JSON.parse(voteStatusRaw || "{}");

    const voteEntry = voteStatus[songSetKey];
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    const hasVoted =
      voteEntry && voteEntry.voted && now - voteEntry.time < fiveMinutes;

    console.log("🔍 Bu şarkı seti için oy verilmiş mi?", hasVoted);

    randomSongs.forEach((song, index) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = song.title;

      span.style.cursor = "pointer";
      span.style.color = "white";

      span.addEventListener("click", async () => {
        console.log(`🖱️ ${song.title} tıklandı (index: ${index})`);

        if (voteStatus[songSetKey]) {
          console.warn("🚫 Oy zaten verilmiş, işlem durduruldu");
          alert(
            "Bu şarkı seti için zaten oy verdiniz. Yeni şarkılar gelene kadar tekrar oy veremezsiniz.",
          );
          return;
        }

        try {
          console.log(`📨 Oy gönderiliyor: /${isletme}/vote/${index}`);
          await fetch(`/${isletme}/vote/${index}`, {
            method: "POST",
          });
          console.log("✅ Oy başarıyla gönderildi");

          voteStatus[songSetKey] = {
            voted: true,
            time: Date.now(),
          };
          localStorage.setItem("voteStatus", JSON.stringify(voteStatus));

          console.log("💾 Oy durumu güncellendi:", voteStatus);

          span.style.fontWeight = "bold";
          span.textContent += " ✅ Oy verildi!";
          loadVoteCounts();
        } catch (e) {
          console.error("❌ Oy gönderilemedi:", e);
        }
      });

      li.appendChild(span);
      list.appendChild(li);
    });

    if (randomSongs.length === 0) {
      list.innerHTML = "<li>Şarkı listesi boş</li>";
    }
  } catch (e) {
    console.error("❌ Şarkılar yüklenemedi:", e);
    document.getElementById("randomSongs").innerHTML =
      "<li>Veri alınamadı</li>";
  }
}

// 🆕 Oy sayacı verisini yükle
async function loadVoteCounts() {
  try {
    const res = await fetch(`/${isletme}/sayac`);
    if (!res.ok) throw new Error("Oy sayacı verisi alınamadı");
    const json = await res.json();
    const sayac = Array.isArray(json.sayac) ? json.sayac : [];

    const list = document.getElementById("voteCounts");
    list.innerHTML = "";

    const rowCount = Math.max(currentSongTitles.length, sayac.length);

    for (let index = 0; index < rowCount; index++) {
      const count = sayac[index] || 0;
      const li = document.createElement("li");
      li.style.listStyle = "none";
      li.style.color = "white";
      li.style.fontSize = "18px";
      li.style.fontWeight = "bold";

      const title = currentSongTitles[index] || `Şarkı ${index + 1}`;
      li.textContent = `${title} (${count} oy)`;
      list.appendChild(li);
    }
  } catch (e) {
    document.getElementById("voteCounts").innerHTML =
      '<li style="list-style:none; color:white;">Veri alınamadı</li>';
    console.error(e);
  }
}

function cleanOldVotes() {
  const now = Date.now();
  const fiveMinutes = 6 * 60 * 1000; // 5 dakika milisaniye cinsinden
  const voteStatusRaw = localStorage.getItem("voteStatus");
  console.log("🧾 Temizlik başlıyor. voteStatusRaw:", voteStatusRaw);

  if (!voteStatusRaw) {
    console.log("ℹ️ Temizlenecek veri bulunamadı (boş localStorage).");
    return;
  }

  try {
    const voteStatus = JSON.parse(voteStatusRaw);
    let updated = false;

    Object.keys(voteStatus).forEach((key) => {
      const entry = voteStatus[key];
      console.log(`🔍 Kontrol edilen anahtar: "${key}", entry:`, entry);

      if (entry && typeof entry === "object" && entry.time) {
        const elapsedTime = now - entry.time;
        console.log(`⏳ Geçen süre: ${elapsedTime}ms`);

        if (elapsedTime > fiveMinutes) {
          console.log(`🧹 Siliniyor: "${key}" (${elapsedTime}ms geçmiş)`);
          delete voteStatus[key];
          updated = true;
        }
      } else {
        console.log(`❌ Geçersiz entry: "${key}", siliniyor...`);
        delete voteStatus[key];
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem("voteStatus", JSON.stringify(voteStatus));
      console.log("✅ Güncellenmiş voteStatus:", voteStatus);
    } else {
      console.log("ℹ️ Temizlenecek veri bulunamadı.");
    }
  } catch (e) {
    console.error("❌ localStorage verisi parse edilemedi, sıfırlanıyor:", e);
    localStorage.removeItem("voteStatus");
  }
}

// -------------------------------------------
// 💬 Chat (anonim, polling)
// -------------------------------------------
function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function setChatStatus(text) {
  const el = document.getElementById("chatStatus");
  if (!el) return;
  el.textContent = text || "";
}

function appendChatMessages(messages) {
  const box = document.getElementById("chatMessages");
  if (!box) return;

  const shouldStickToBottom =
    Math.abs(box.scrollHeight - box.scrollTop - box.clientHeight) < 10;

  for (const msg of messages) {
    const p = document.createElement("p");
    p.className = "chat-message";

    const time = document.createElement("span");
    time.className = "chat-message-time";
    time.textContent = formatTime(msg.ts);

    const text = document.createElement("span");
    text.textContent = msg.text;

    p.appendChild(time);
    p.appendChild(text);
    box.appendChild(p);

    if (typeof msg.ts === "number" && msg.ts > chatLastTs) {
      chatLastTs = msg.ts;
    }
  }

  // Basit limit: DOM büyümesin
  while (box.childNodes.length > 200) {
    box.removeChild(box.firstChild);
  }

  if (shouldStickToBottom) {
    box.scrollTop = box.scrollHeight;
  }
}

async function pollChat() {
  try {
    const res = await fetch(
      `/${isletme}/chat/messages?after=${encodeURIComponent(chatLastTs)}&limit=50`,
    );
    if (!res.ok) {
      setChatStatus("Sohbet baglantisi kurulamadı.");
      return;
    }
    const json = await res.json();
    const messages = Array.isArray(json.messages) ? json.messages : [];
    if (messages.length) {
      appendChatMessages(messages);
    }
    setChatStatus("");
  } catch (e) {
    setChatStatus("Sohbet baglantisi kurulamadı.");
    console.error(e);
  }
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;

  const text = String(input.value || "").trim();
  if (!text) return;

  input.value = "";
  setChatStatus("Gonderiliyor...");

  try {
    const res = await fetch(`/${isletme}/chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (res.status === 429) {
      setChatStatus("Cok hizli yaziyorsun. 2 saniye bekle.");
      return;
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      setChatStatus(errJson?.error || "Mesaj gonderilemedi.");
      return;
    }

    const json = await res.json();
    if (json && json.message) {
      appendChatMessages([json.message]);
    }
    setChatStatus("");
  } catch (e) {
    setChatStatus("Mesaj gonderilemedi.");
    console.error(e);
  }
}

function initChat() {
  const sendBtn = document.getElementById("chatSendBtn");
  const input = document.getElementById("chatInput");

  if (sendBtn) {
    sendBtn.addEventListener("click", () => sendChatMessage());
  }
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  pollChat();
  if (chatTimer) clearInterval(chatTimer);
  chatTimer = setInterval(pollChat, 1000);
}

// İlk yükleme
loadSong();
loadRandomSongs();
loadVoteCounts();
cleanOldVotes();
initChat();

// Periyodik güncelleme
setInterval(() => {
  loadSong();
  loadRandomSongs();
  loadVoteCounts();
  cleanOldVotes();
}, 5000);

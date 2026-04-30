const parts = location.pathname.split("/");
const isletme = parts[1];

let currentSongTitles = [];

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

    currentSongTitles = json.random_3_songs.map((song) => song.title);

    const list = document.getElementById("randomSongs");
    list.innerHTML = "";

    const songSetKey = generateSongSetKey(json.random_3_songs);
    const voteStatusRaw = localStorage.getItem("voteStatus");
    console.log("📦 localStorage.voteStatus:", voteStatusRaw);

    const voteStatus = JSON.parse(voteStatusRaw || "{}");

    const voteEntry = voteStatus[songSetKey];
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    const hasVoted =
      voteEntry && voteEntry.voted && now - voteEntry.time < fiveMinutes;

    console.log("🔍 Bu şarkı seti için oy verilmiş mi?", hasVoted);

    json.random_3_songs.forEach((song, index) => {
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

    const list = document.getElementById("voteCounts");
    list.innerHTML = "";

    json.sayac.forEach((count, index) => {
      const li = document.createElement("li");
      li.style.listStyle = "none";
      li.style.color = "white";
      li.style.fontSize = "18px";
      li.style.fontWeight = "bold";

      const title = currentSongTitles[index] || `Şarkı ${index + 1}`;
      li.textContent = `${title} (${count} oy)`;
      list.appendChild(li);
    });
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

// İlk yükleme
loadSong();
loadRandomSongs();
loadVoteCounts();
cleanOldVotes();

// Periyodik güncelleme
setInterval(() => {
  loadSong();
  loadRandomSongs();
  loadVoteCounts();
  cleanOldVotes();
}, 5000);

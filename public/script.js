const parts = location.pathname.split('/');
const isletme = parts[1];

// Mevcut fonksiyon
async function loadSong() {
    try {
        const res = await fetch(`/${isletme}/current_song`);
        if (!res.ok) throw new Error('Sunucudan veri gelmedi');
        const json = await res.json();

        const songText = json.current_song || '—';
        document.getElementById('song').textContent = songText;
        document.getElementById('updated').textContent =
            'Güncellendi: ' + new Date().toLocaleTimeString('tr-TR');
    } catch (e) {
        document.getElementById('song').textContent = 'Veri alınamadı';
        console.error(e);
    }
}

// 🆕 Yeni fonksiyon: random_3_songs
async function loadRandomSongs() {
    try {
        const res = await fetch(`/${isletme}/random_3_songs`);
        if (!res.ok) throw new Error('Sunucudan rastgele şarkılar gelmedi');
        const json = await res.json();

        const list = document.getElementById('randomSongs');
        list.innerHTML = ''; // Eski listeyi temizle

        for (const song of json.random_3_songs) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = song.url;
            a.textContent = song.title;
            a.target = '_blank'; // Yeni sekmede aç
            li.appendChild(a);
            list.appendChild(li);
        }
    } catch (e) {
        document.getElementById('randomSongs').innerHTML = '<li>Veri alınamadı</li>';
        console.error(e);
    }
}

// İlk yükleme
loadSong();
loadRandomSongs();

// Periyodik güncelleme
setInterval(() => {
    loadSong();
    loadRandomSongs();
}, 5000);

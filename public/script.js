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
        list.innerHTML = ''; // Önceki listeyi temizle

        json.random_3_songs.forEach((song, index) => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = song.title;
            span.style.cursor = 'pointer';
            span.style.textDecoration = 'underline';
            span.style.color = '#007bff';

            // 🗳️ Tıklanınca oy gönder
            span.addEventListener('click', async () => {
                try {
                    await fetch(`/${isletme}/vote/${index}`, {
                        method: 'POST'
                    });
                    console.log(`${index}. şarkıya oy verildi`);
                    loadVoteCounts(); // Oy sayısını güncelle
                } catch (e) {
                    console.error('Oy gönderilemedi:', e);
                }
            });

            li.appendChild(span);
            list.appendChild(li);
        });
    } catch (e) {
        document.getElementById('randomSongs').innerHTML = '<li>Veri alınamadı</li>';
        console.error(e);
    }
}


// 🆕 Oy sayacı verisini yükle
async function loadVoteCounts() {
    try {
        const res = await fetch(`/${isletme}/sayac`);
        if (!res.ok) throw new Error('Oy sayacı verisi alınamadı');
        const json = await res.json();

        const list = document.getElementById('voteCounts');
        list.innerHTML = ''; // Önceki verileri temizle

        json.sayac.forEach((count, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. şarkı: ${count} oy`;
            list.appendChild(li);
        });
    } catch (e) {
        document.getElementById('voteCounts').innerHTML = '<li>Veri alınamadı</li>';
        console.error(e);
    }
}


// İlk yükleme
loadSong();
loadRandomSongs();
loadVoteCounts();

// Periyodik güncelleme
setInterval(() => {
    loadSong();
    loadRandomSongs();
    loadVoteCounts();
}, 5000);


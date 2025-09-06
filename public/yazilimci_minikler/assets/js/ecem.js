const questions = [
    // Genel Kültür
    {
        question: "Türkiye'nin en yüksek dağı hangisidir?",
        options: ["Erciyes Dağı", "Ağrı Dağı", "Uludağ", "Palandöken"],
        answer: 1,
        category: "Genel Kültür"
    },
    {
        question: "Hangi gezegen 'Kızıl Gezegen' olarak bilinir?",
        options: ["Venüs", "Mars", "Jüpiter", "Satürn"],
        answer: 1,
        category: "Genel Kültür"
    },
    {
        question: "İnsan vücudundaki en büyük organ hangisidir?",
        options: ["Kalp", "Beyin", "Deri", "Karaciğer"],
        answer: 2,
        category: "Genel Kültür"
    },

    // Bilim ve Teknoloji
    {
        question: "Suyun kimyasal formülü nedir?",
        options: ["H2O", "CO2", "O2", "N2"],
        answer: 0,
        category: "Bilim ve Teknoloji"
    },
    {
        question: "Hangi element periyodik tabloda 'Fe' sembolü ile gösterilir?",
        options: ["Flor", "Demir", "Fosfor", "Fermiyum"],
        answer: 1,
        category: "Bilim ve Teknoloji"
    },
    {
        question: "İnternet'in temel protokolü hangisidir?",
        options: ["HTTP", "FTP", "TCP/IP", "SMTP"],
        answer: 2,
        category: "Bilim ve Teknoloji"
    },

    // Tarih
    {
        question: "İstanbul'un fetih tarihi nedir?",
        options: ["1453", "1454", "1452", "1455"],
        answer: 0,
        category: "Tarih"
    },
    {
        question: "Türkiye Cumhuriyeti hangi tarihte kurulmuştur?",
        options: ["29 Ekim 1923", "23 Nisan 1920", "30 Ağustos 1922", "19 Mayıs 1919"],
        answer: 0,
        category: "Tarih"
    },
    {
        question: "I. Dünya Savaşı hangi yıllar arasında gerçekleşmiştir?",
        options: ["1914-1918", "1915-1919", "1913-1917", "1916-1920"],
        answer: 0,
        category: "Tarih"
    },

    // Coğrafya
    {
        question: "Türkiye'nin en büyük gölü hangisidir?",
        options: ["Van Gölü", "Tuz Gölü", "Beyşehir Gölü", "İznik Gölü"],
        answer: 0,
        category: "Coğrafya"
    },
    {
        question: "Hangi şehir 'Türkiye'nin Paris'i' olarak bilinir?",
        options: ["İzmir", "Bursa", "Antalya", "Eskişehir"],
        answer: 0,
        category: "Coğrafya"
    },
    {
        question: "Türkiye'nin en kalabalık şehri hangisidir?",
        options: ["Ankara", "İzmir", "İstanbul", "Bursa"],
        answer: 2,
        category: "Coğrafya"
    },

    // Matematik
    {
        question: "Bir üçgenin iç açıları toplamı kaç derecedir?",
        options: ["90", "180", "270", "360"],
        answer: 1,
        category: "Matematik"
    },
    {
        question: "2'nin 3. kuvveti kaçtır?",
        options: ["6", "8", "4", "5"],
        answer: 1,
        category: "Matematik"
    },
    {
        question: "Bir dairenin çevresi nasıl hesaplanır?",
        options: ["2πr", "πr²", "πd", "2πd"],
        answer: 0,
        category: "Matematik"
    },

    // Edebiyat ve Dil
    {
        question: "Hangi yazar 'Çalıkuşu' romanının yazarıdır?",
        options: ["Halide Edip Adıvar", "Reşat Nuri Güntekin", "Yakup Kadri Karaosmanoğlu", "Ömer Seyfettin"],
        answer: 1,
        category: "Edebiyat ve Dil"
    },
    {
        question: "Türkçe hangi dil ailesine aittir?",
        options: ["Hint-Avrupa", "Ural-Altay", "Sami", "Çin-Tibet"],
        answer: 1,
        category: "Edebiyat ve Dil"
    },
    {
        question: "Hangi kelime türü isimleri niteleyen kelimelerdir?",
        options: ["Fiil", "Sıfat", "Zamir", "Zarf"],
        answer: 1,
        category: "Edebiyat ve Dil"
    },

    // Spor ve Sanat
    {
        question: "Futbolda bir maç kaç dakika sürer?",
        options: ["80 dakika", "85 dakika", "90 dakika", "95 dakika"],
        answer: 2,
        category: "Spor ve Sanat"
    },
    {
        question: "Hangi renk ana renklerden biri değildir?",
        options: ["Kırmızı", "Mavi", "Yeşil", "Sarı"],
        answer: 2,
        category: "Spor ve Sanat"
    },
    {
        question: "Türkiye'nin milli marşının bestecisi kimdir?",
        options: ["Osman Zeki Üngör", "Mehmet Akif Ersoy", "Zeki Müren", "Münir Nurettin Selçuk"],
        answer: 0,
        category: "Spor ve Sanat"
    }
];

let currentQuestion = 0;
let score = 0;
let categoryScores = {};

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const nextBtn = document.getElementById("next-btn");
const resultEl = document.getElementById("result");
const restartBtn = document.getElementById("restart-btn");

// Kategori skorlarını başlat
function initializeCategoryScores() {
    const categories = [...new Set(questions.map(q => q.category))];
    categories.forEach(category => {
        categoryScores[category] = { correct: 0, total: 0 };
    });
}

function showQuestion() {
    const q = questions[currentQuestion];
    questionEl.innerHTML = `
        <h2>${q.question}</h2>
        <p class="category">Kategori: ${q.category}</p>
        <div class="progress-bar">
            <div class="progress" style="width: ${((currentQuestion + 1) / questions.length) * 100}%"></div>
        </div>
        <p class="question-counter">Soru ${currentQuestion + 1} / ${questions.length}</p>
    `;

    optionsEl.innerHTML = "";

    q.options.forEach((option, index) => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.classList.add("option");
        btn.onclick = () => checkAnswer(index);
        optionsEl.appendChild(btn);
    });

    resultEl.textContent = "";
    nextBtn.style.display = "none";
}

function checkAnswer(selected) {
    const q = questions[currentQuestion];
    const correct = q.answer;
    const options = document.querySelectorAll(".option");

    // Kategori skorunu güncelle
    categoryScores[q.category].total++;
    if (selected === correct) {
        score++;
        categoryScores[q.category].correct++;
    }

    options.forEach((btn, index) => {
        btn.disabled = true;
        if (index === correct) {
            btn.classList.add("correct");
            btn.innerHTML += " ✓";
        } else if (index === selected) {
            btn.classList.add("wrong");
            btn.innerHTML += " ✗";
        }
    });

    nextBtn.style.display = "inline-block";
}

nextBtn.onclick = () => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
        showQuestion();
    } else {
        showResult();
    }
};

restartBtn.onclick = () => {
    currentQuestion = 0;
    score = 0;
    initializeCategoryScores();
    restartBtn.style.display = "none";
    showQuestion();
};

function showResult() {
    const percentage = Math.round((score / questions.length) * 100);

    questionEl.innerHTML = `
        <h2>Quiz Bitti! 🎉</h2>
        <div class="final-score">
            <h3>Genel Puan: ${score} / ${questions.length} (${percentage}%)</h3>
        </div>
    `;

    optionsEl.innerHTML = "";

    let performanceMessage = "";
    if (percentage >= 90) {
        performanceMessage = "Mükemmel! Sen gerçek bir bilgi hazinesisin! 🌟";
    } else if (percentage >= 80) {
        performanceMessage = "Harika! Çok iyi bir bilgi birikimine sahipsin! 🎯";
    } else if (percentage >= 70) {
        performanceMessage = "İyi! Bilgi seviyen oldukça yüksek! 👍";
    } else if (percentage >= 60) {
        performanceMessage = "Fena değil! Biraz daha çalışarak daha da iyi olabilirsin! 💪";
    } else if (percentage >= 50) {
        performanceMessage = "Orta seviye! Daha fazla okuma yaparak gelişebilirsin! 📚";
    } else {
        performanceMessage = "Biraz daha çalışmaya ihtiyacın var! Hadi tekrar dene! 🔄";
    }

    // Kategori bazlı analiz
    let categoryAnalysis = "<div class='category-analysis'><h4>Kategori Bazlı Performans:</h4>";
    Object.keys(categoryScores).forEach(category => {
        const catScore = categoryScores[category];
        const catPercentage = Math.round((catScore.correct / catScore.total) * 100);
        let emoji = catPercentage >= 80 ? "🟢" : catPercentage >= 60 ? "🟡" : "🔴";
        categoryAnalysis += `<p>${emoji} ${category}: ${catScore.correct}/${catScore.total} (${catPercentage}%)</p>`;
    });
    categoryAnalysis += "</div>";

    resultEl.innerHTML = `
        <div class="result-message">${performanceMessage}</div>
        ${categoryAnalysis}
        <div class="suggestions">
            <h4>Öneriler:</h4>
            <ul>
                <li>📖 Düzenli kitap okuma alışkanlığı edin</li>
                <li>🌍 Güncel olayları takip et</li>
                <li>🔬 Bilim ve teknoloji haberlerini oku</li>
                <li>📚 Farklı konularda araştırma yap</li>
            </ul>
        </div>
    `;

    nextBtn.style.display = "none";
    restartBtn.style.display = "inline-block";
}

// Başlat
initializeCategoryScores();
showQuestion();

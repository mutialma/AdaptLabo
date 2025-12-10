// ========================================
// AdaptLabo - Main Application JavaScript
// ========================================

// Storage keys
const STORAGE_KEYS = {
    USER: 'adaptlabo_user',
    ASSESSMENT: 'adaptlabo_assessment',
    SHARE: 'adaptlabo_share',
    MODULES: 'adaptlabo_modules',
    PROFILES: 'adaptlabo_profiles'
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// ========================================
// App Initialization
// ========================================

function initializeApp() {
    // Initialize user data if not exists
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
        const defaultUser = {
            id: 'guru_demo',
            name: 'Pak/Bu Guru',
            modulesTotal: 12,
            modulesDone: 0,
            streak: 0,
            completed: {},
            competencies: {
                'AI Dasar': 0,
                'Etika AI': 0,
                'Prompting': 0,
                'Integrasi di Kelas': 0,
                'Penilaian Otomatis': 0
            },
            history7: [0, 0, 0, 0, 0, 0, 0]
        };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
    }

    // Initialize modules list
    if (!localStorage.getItem(STORAGE_KEYS.MODULES)) {
        const modules = [
            {id:'m1', title:'Dasar AI', minutes:30},
            {id:'m2', title:'Etika AI', minutes:45},
            {id:'m3', title:'Prompting', minutes:40},
            {id:'m4', title:'Studi Kasus', minutes:90}
        ];
        localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    }
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    // Logo click - return to home
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => navigateToHome());
    }

    // Feature card clicks
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        const button = card.querySelector('.btn-feature');
        if (button) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const page = card.dataset.page;
                if (page) navigateTo(page);
            });
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && !this.hasAttribute('onclick')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// ========================================
// Navigation Functions
// ========================================

function navigateToHome() {
    const pageContainer = document.getElementById('pageContainer');
    pageContainer.style.display = 'none';
    pageContainer.innerHTML = '';
    window.scrollTo(0, 0);
}

function navigateTo(page) {
    const pageContainer = document.getElementById('pageContainer');
    pageContainer.style.display = 'block';
    pageContainer.classList.add('active');
    
    // Load appropriate page
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'modul-literasi':
            loadModulLiterasi();
            break;
        case 'generator-bahan':
            loadGeneratorBahan();
            break;
        case 'asisten-penilaian':
            loadAsistenPenilaian();
            break;
        case 'ruang-berbagi':
            loadRuangBerbagi();
            break;
        default:
            navigateToHome();
    }
    
    window.scrollTo(0, 0);
}

// ========================================
// Dashboard Module
// ========================================

function loadDashboard() {
    const container = document.getElementById('pageContainer');
    container.innerHTML = getDashboardHTML();
    
    // Initialize dashboard
    setTimeout(() => {
        initDashboardCharts();
        updateDashboardProgress();
        renderDashboardRecommendations();
    }, 100);
}

function getDashboardHTML() {
    return `
        <div class="page-header">
            <div class="container">
                <div style="display:flex;align-items:center;gap:.6rem">
                    <i class="fas fa-tachometer-alt"></i>
                    <strong>Dashboard Pembelajaran Adaptif</strong>
                </div>
                <button onclick="navigateToHome()" class="backlink" style="background:none;border:none;cursor:pointer;font-size:1rem;">
                    ← Kembali ke Home
                </button>
            </div>
        </div>
        
        <main class="container">
            <section class="card">
                <h2 class="section-title">Dashboard Pembelajaran</h2>
                <p class="small">Menampilkan progress belajar, rekomendasi modul personal, dan visualisasi kompetensi real-time.</p>

                <div class="grid" style="margin-top:1rem">
                    <div>
                        <div class="card">
                            <h3 class="small">Progress Belajar</h3>
                            <div style="display:flex;gap:1rem;align-items:center;margin-top:.6rem">
                                <div style="flex:1">
                                    <div class="progress-bar">
                                        <div id="totalProgressFill" class="progress-fill"></div>
                                    </div>
                                    <div style="display:flex;justify-content:space-between;margin-top:.5rem">
                                        <span id="totalProgressText" class="small">0%</span>
                                        <span class="small">Modul: <strong id="modulesDone">0</strong>/<span id="modulesTotal">0</span></span>
                                    </div>
                                </div>
                                <div style="width:110px;text-align:center">
                                    <div id="streak" style="font-weight:700;font-size:1.1rem">0</div>
                                    <div class="small">hari aktif</div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <h3 class="small">Visualisasi Kompetensi</h3>
                            <div class="chart-wrap"><canvas id="competencyRadar"></canvas></div>
                        </div>

                        <div class="card">
                            <h3 class="small">Riwayat Pencapaian (7 hari)</h3>
                            <div class="chart-wrap"><canvas id="historyBar"></canvas></div>
                        </div>
                    </div>

                    <aside>
                        <div class="card">
                            <h3 class="small">Rekomendasi Personal</h3>
                            <div id="recommendations" style="margin-top:.6rem"></div>
                            <button id="refreshRec" class="outline" style="width:100%;margin-top:.8rem">Segarkan</button>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    `;
}

let radarChart, barChart;

function initDashboardCharts() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    
    // Radar chart
    const radarCtx = document.getElementById('competencyRadar');
    if (radarCtx) {
        const compLabels = Object.keys(user.competencies);
        const compValues = Object.values(user.competencies);
        
        if (radarChart) radarChart.destroy();
        radarChart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: compLabels,
                datasets: [{
                    label: 'Skor Kompetensi',
                    data: compValues,
                    fill: true,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Bar chart
    const barCtx = document.getElementById('historyBar');
    if (barCtx) {
        if (barChart) barChart.destroy();
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['-6', '-5', '-4', '-3', '-2', '-1', 'Hari Ini'],
                datasets: [{
                    label: 'Aktivitas (%)',
                    data: user.history7,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Setup refresh button
    const refreshBtn = document.getElementById('refreshRec');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', renderDashboardRecommendations);
    }
}

function updateDashboardProgress() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    const percent = Math.round((user.modulesDone / user.modulesTotal) * 100);
    
    const fillEl = document.getElementById('totalProgressFill');
    const textEl = document.getElementById('totalProgressText');
    const doneEl = document.getElementById('modulesDone');
    const totalEl = document.getElementById('modulesTotal');
    const streakEl = document.getElementById('streak');
    
    if (fillEl) fillEl.style.width = percent + '%';
    if (textEl) textEl.textContent = percent + '%';
    if (doneEl) doneEl.textContent = user.modulesDone;
    if (totalEl) totalEl.textContent = user.modulesTotal;
    if (streakEl) streakEl.textContent = user.streak;
}

function renderDashboardRecommendations() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    const recs = [];
    
    // Recommend based on low competencies
    for (const [k, v] of Object.entries(user.competencies)) {
        if (v < 50) {
            recs.push({
                title: `Tingkatkan: ${k}`,
                reason: `Skor ${v}%. Perkuat kompetensi ini.`,
                action: 'modul-literasi'
            });
        }
    }
    
    // Suggest next module
    if (user.modulesDone < user.modulesTotal) {
        recs.unshift({
            title: `Modul #${user.modulesDone + 1}`,
            reason: 'Lanjutkan pembelajaran Anda.',
            action: 'modul-literasi'
        });
    }
    
    if (recs.length === 0) {
        recs.push({
            title: 'Tantangan Lanjutan',
            reason: 'Cobalah proyek mini untuk praktik.',
            action: 'generator-bahan'
        });
    }
    
    const container = document.getElementById('recommendations');
    if (container) {
        container.innerHTML = recs.map(r => `
            <div class="rec-item">
                <div>
                    <strong>${escapeHtml(r.title)}</strong>
                    <div class="small">${escapeHtml(r.reason)}</div>
                </div>
                <button class="btn btn-feature" onclick="navigateTo('${r.action}')">Buka</button>
            </div>
        `).join('');
    }
}

// ========================================
// Module Literasi
// ========================================

function loadModulLiterasi() {
    const container = document.getElementById('pageContainer');
    container.innerHTML = getModulLiterasiHTML();
    
    setTimeout(() => {
        initModulLiterasi();
    }, 100);
}

function getModulLiterasiHTML() {
    return `
        <div class="page-header">
            <div class="container">
                <div style="display:flex;align-items:center;gap:.6rem">
                    <i class="fas fa-brain"></i>
                    <strong>Modul Literasi AI untuk Guru</strong>
                </div>
                <button onclick="navigateToHome()" class="backlink" style="background:none;border:none;cursor:pointer;font-size:1rem;">
                    ← Kembali ke Home
                </button>
            </div>
        </div>
        
        <main class="container">
            <section class="card">
                <h1>Modul Literasi AI</h1>
                <p class="small">Seri modul untuk membekali guru dengan dasar AI, etika, prompting, dan implementasi di kelas.</p>
                <div style="display:flex;gap:1rem;margin-top:.8rem;align-items:center">
                    <div style="flex:1">
                        <div class="small">Progress keseluruhan</div>
                        <div class="progress-bar" style="margin-top:.4rem;height:10px">
                            <i id="overallBar" style="display:block;height:100%;background:linear-gradient(90deg,#667eea,#764ba2);width:0"></i>
                        </div>
                    </div>
                    <div style="width:150px;text-align:right">
                        <div class="small">Selesai: <strong id="doneCount">0</strong>/<span id="totalCount">0</span></div>
                    </div>
                </div>
            </section>

            <div class="card">
                <h3>Daftar Modul</h3>
                <div id="modulesContainer" style="margin-top:.6rem"></div>
            </div>
        </main>
    `;
}

function initModulLiterasi() {
    const modules = [
        {
            id: 'm1',
            title: 'Dasar AI',
            minutes: 30,
            objectives: ['Memahami pengertian AI', 'Membedakan ML vs rule-based', 'Contoh penerapan di pendidikan'],
            activities: ['Presentasi 15 menit', 'Demo chatbot 15 menit']
        },
        {
            id: 'm2',
            title: 'Etika AI',
            minutes: 45,
            objectives: ['Memahami isu bias', 'Privasi data siswa', 'Tanggung jawab penggunaan AI'],
            activities: ['Diskusi studi kasus 30 menit', 'Refleksi 15 menit']
        },
        {
            id: 'm3',
            title: 'Prompting',
            minutes: 40,
            objectives: ['Menulis prompt yang jelas', 'Mengontrol format output', 'Membuat rubrik menggunakan AI'],
            activities: ['Latihan menulis prompt 30 menit', 'Peer-review 10 menit']
        },
        {
            id: 'm4',
            title: 'Studi Kasus',
            minutes: 90,
            objectives: ['Analisis kasus penerapan', 'Merancang intervensi berbasis AI', 'Mengevaluasi efek pembelajaran'],
            activities: ['Presentasi 30 menit', 'Rancang proyek 60 menit']
        }
    ];

    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    const container = document.getElementById('modulesContainer');
    
    if (container) {
        container.innerHTML = modules.map(m => {
            const done = !!user.completed[m.id];
            return `
                <div class="module">
                    <div class="meta">
                        <strong>${escapeHtml(m.title)}</strong>
                        <div class="small">Durasi: ${m.minutes} menit</div>
                    </div>
                    <button class="btn btn-feature" onclick="openModule('${m.id}')">${done ? 'Selesai ✓' : 'Buka'}</button>
                </div>
            `;
        }).join('');
    }

    updateModulProgress();
}

function openModule(id) {
    const modules = [
        {
            id: 'm1',
            title: 'Dasar AI',
            objectives: ['Memahami pengertian AI', 'Membedakan ML vs rule-based', 'Contoh penerapan di pendidikan'],
            content: 'Modul ini memperkenalkan konsep dasar AI dan penerapannya dalam pendidikan.'
        },
        {
            id: 'm2',
            title: 'Etika AI',
            objectives: ['Memahami isu bias', 'Privasi data siswa', 'Tanggung jawab penggunaan AI'],
            content: 'Membahas pertimbangan etis dalam penggunaan AI di kelas.'
        },
        {
            id: 'm3',
            title: 'Prompting',
            objectives: ['Menulis prompt yang jelas', 'Mengontrol format output', 'Membuat rubrik menggunakan AI'],
            content: 'Belajar teknik prompting efektif untuk hasil AI yang optimal.'
        },
        {
            id: 'm4',
            title: 'Studi Kasus',
            objectives: ['Analisis kasus penerapan', 'Merancang intervensi berbasis AI', 'Mengevaluasi efek pembelajaran'],
            content: 'Analisis kasus nyata implementasi AI dalam pembelajaran.'
        }
    ];

    const m = modules.find(x => x.id === id);
    if (!m) return;

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style='background:#fff;border-radius:12px;padding:2rem;max-width:720px;width:90%;max-height:90vh;overflow:auto;'>
            <h3>${escapeHtml(m.title)}</h3>
            <h4>Tujuan</h4>
            <ul>${m.objectives.map(o => `<li>${escapeHtml(o)}</li>`).join('')}</ul>
            <h4>Konten</h4>
            <p>${escapeHtml(m.content)}</p>
            <div style='display:flex;gap:.5rem;margin-top:1rem;justify-content:flex-end'>
                <button id='markDone' class='btn btn-primary'>Tandai Selesai</button>
                <button id='closeModal' class='btn btn-secondary'>Tutup</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('closeModal').addEventListener('click', () => modal.remove());
    document.getElementById('markDone').addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
        user.completed[id] = true;
        user.modulesDone = Object.keys(user.completed).filter(k => user.completed[k]).length;
        
        // Update random competency
        const compKeys = Object.keys(user.competencies);
        const randomKey = compKeys[Math.floor(Math.random() * compKeys.length)];
        user.competencies[randomKey] = Math.min(100, user.competencies[randomKey] + 10);
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        modal.remove();
        initModulLiterasi();
    });
}

function updateModulProgress() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    const doneCount = Object.keys(user.completed).filter(k => user.completed[k]).length;
    const totalCount = 4;
    const pct = Math.round((doneCount / totalCount) * 100);

    const doneEl = document.getElementById('doneCount');
    const totalEl = document.getElementById('totalCount');
    const barEl = document.getElementById('overallBar');

    if (doneEl) doneEl.textContent = doneCount;
    if (totalEl) totalEl.textContent = totalCount;
    if (barEl) barEl.style.width = pct + '%';
}

// ========================================
// Generator Bahan Ajar
// ========================================

function loadGeneratorBahan() {
    const container = document.getElementById('pageContainer');
    container.innerHTML = `
        <div class="page-header">
            <div class="container">
                <div style="display:flex;align-items:center;gap:.6rem">
                    <i class="fas fa-file-powerpoint"></i>
                    <strong>Generator Bahan Ajar</strong>
                </div>
                <button onclick="navigateToHome()" class="backlink" style="background:none;border:none;cursor:pointer;font-size:1rem;">
                    ← Kembali ke Home
                </button>
            </div>
        </div>
        
        <main class="container">
            <section class="card">
                <h1>Generator Bahan Ajar</h1>
                <p class="small">Buat slide, LKPD, artikel, evaluasi, dan rubrik penilaian otomatis.</p>
                
                <div class="grid" style="margin-top:.8rem">
                    <div>
                        <div class="card">
                            <label>Judul / Topik</label>
                            <input id="topic" placeholder="Contoh: Pengenalan AI untuk Kelas X" />
                            
                            <label>Level / Kelas</label>
                            <input id="grade" placeholder="Contoh: Kelas X / SMA" />
                            
                            <label>Tujuan Pembelajaran</label>
                            <input id="objectives" placeholder="Memahami konsep AI; Menggunakan chatbot" />
                            
                            <label>Durasi (menit)</label>
                            <input id="duration" type="number" value="45" />
                            
                            <div style="display:flex;gap:.6rem;margin-top:.8rem;flex-wrap:wrap">
                                <button class="btn btn-primary" onclick="generateContent('slide')">Buat Slide</button>
                                <button class="btn btn-primary" onclick="generateContent('lkpd')">Buat LKPD</button>
                                <button class="btn btn-primary" onclick="generateContent('article')">Buat Artikel</button>
                            </div>
                        </div>
                    </div>
                    
                    <aside>
                        <div class="card preview">
                            <h4>Pratinjau</h4>
                            <div id="previewArea" class="small">Isi form lalu klik tombol untuk generate.</div>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    `;
}

function generateContent(type) {
    const topic = document.getElementById('topic').value || 'Topik';
    const grade = document.getElementById('grade').value || 'Kelas X';
    const objectives = document.getElementById('objectives').value || 'Tujuan pembelajaran';
    const duration = document.getElementById('duration').value || '45';

    let content = '';
    let filename = '';

    if (type === 'slide') {
        content = `<!doctype html><html><head><meta charset="utf-8"><title>${topic}</title></head><body><h1>${topic}</h1><p>Kelas: ${grade}</p><p>Durasi: ${duration} menit</p><p>Tujuan: ${objectives}</p></body></html>`;
        filename = `${topic.replace(/\s+/g, '_')}_slides.html`;
    } else if (type === 'lkpd') {
        content = `<!doctype html><html><head><meta charset="utf-8"><title>LKPD ${topic}</title></head><body><h1>LKPD: ${topic}</h1><p>Kelas: ${grade}</p><p>Tujuan: ${objectives}</p></body></html>`;
        filename = `${topic.replace(/\s+/g, '_')}_LKPD.html`;
    } else if (type === 'article') {
        content = `# ${topic}\n\n**Kelas:** ${grade}\n**Durasi:** ${duration} menit\n\n## Tujuan\n${objectives}\n\n## Konten\nIsi artikel...`;
        filename = `${topic.replace(/\s+/g, '_')}_article.md`;
    }

    const preview = document.getElementById('previewArea');
    if (preview) {
        preview.textContent = content.substring(0, 500) + '...';
    }

    downloadFile(filename, content);
}

// ========================================
// Asisten Penilaian
// ========================================

function loadAsistenPenilaian() {
    const container = document.getElementById('pageContainer');
    container.innerHTML = `
        <div class="page-header">
            <div class="container">
                <div style="display:flex;align-items:center;gap:.6rem">
                    <i class="fas fa-clipboard-check"></i>
                    <strong>Asisten Penilaian</strong>
                </div>
                <button onclick="navigateToHome()" class="backlink" style="background:none;border:none;cursor:pointer;font-size:1rem;">
                    ← Kembali ke Home
                </button>
            </div>
        </div>
        
        <main class="container">
            <section class="card">
                <h1>Asisten Penilaian</h1>
                <p class="small">Buat bank soal, kumpulkan jawaban, dan dapatkan penilaian otomatis dengan feedback.</p>
                
                <div class="card" style="margin-top:1rem">
                    <h3>Fitur Penilaian</h3>
                    <ul>
                        <li>Buat soal dengan berbagai level kesulitan (Mudah/Sedang/Sulit)</li>
                        <li>Kumpulkan jawaban siswa secara terstruktur</li>
                        <li>Analisis nilai dan berikan feedback otomatis</li>
                        <li>Statistik kelas untuk evaluasi pembelajaran</li>
                    </ul>
                    <p class="small" style="margin-top:1rem">Sistem ini menggunakan localStorage untuk demo. Implementasi lengkap tersedia dalam file terpisah.</p>
                </div>
            </section>
        </main>
    `;
}

// ========================================
// Ruang Berbagi
// ========================================

function loadRuangBerbagi() {
    const container = document.getElementById('pageContainer');
    container.innerHTML = `
        <div class="page-header">
            <div class="container">
                <div style="display:flex;align-items:center;gap:.6rem">
                    <i class="fas fa-users"></i>
                    <strong>Ruang Berbagi Praktik Baik</strong>
                </div>
                <button onclick="navigateToHome()" class="backlink" style="background:none;border:none;cursor:pointer;font-size:1rem;">
                    ← Kembali ke Home
                </button>
            </div>
        </div>
        
        <main class="container">
            <section class="card">
                <h1>Ruang Berbagi Praktik Baik</h1>
                <p class="small">Berbagi pengalaman, studi kasus, dan bangun jejaring profesional dengan sesama guru.</p>
                
                <div class="grid" style="margin-top:1rem">
                    <div class="card">
                        <h3>Buat Postingan</h3>
                        <label>Judul</label>
                        <input id="postTitle" placeholder="Judul pengalaman" />
                        
                        <label>Ringkasan</label>
                        <input id="postSummary" placeholder="Ringkasan singkat" />
                        
                        <label>Isi</label>
                        <textarea id="postContent" rows="4" placeholder="Ceritakan praktik Anda..."></textarea>
                        
                        <button class="btn btn-primary" onclick="publishPost()" style="margin-top:.6rem">Publikasikan</button>
                        
                        <div id="postsList" style="margin-top:1rem"></div>
                    </div>
                    
                    <aside class="card">
                        <h3>Panduan</h3>
                        <ol class="small">
                            <li>Bagikan pengalaman singkat & jelas</li>
                            <li>Sertakan konteks, langkah, dan hasil</li>
                            <li>Gunakan untuk kolaborasi lebih lanjut</li>
                        </ol>
                    </aside>
                </div>
            </section>
        </main>
    `;
    
    loadPosts();
}

function publishPost() {
    const title = document.getElementById('postTitle').value.trim();
    const summary = document.getElementById('postSummary').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (!title || !content) {
        alert('Judul dan isi harus diisi');
        return;
    }
    
    let posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHARE) || '{"posts":[]}');
    if (!posts.posts) posts.posts = [];
    
    posts.posts.unshift({
        id: 'p' + Date.now(),
        title,
        summary,
        content
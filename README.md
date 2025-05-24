
# ⚽ Advanced-Football-Simulator

**Advanced Football Simulator** adalah proyek simulator sepak bola modern yang menekankan pada mekanisme umpan realistis (📌 **Pro Passing System**). Proyek ini bertujuan memberikan pengalaman simulasi permainan sepak bola yang cerdas, responsif, dan menyenangkan baik untuk pemain tunggal maupun multipemain lokal.

---

## 🚀 Fitur Utama

### 🎯 Pro Passing System
- **Umpan Pendek**: Akurat dan cepat antar pemain terdekat.
- **Umpan Panjang**: Berguna untuk membelah pertahanan lawan.
- **Umpan Terobosan**: AI membantu mengarahkan bola ke ruang kosong.
- **Umpan Silang**: Efektif untuk peluang di depan gawang dari sisi lapangan.
- **Tekanan Umpan Dinamis**: Semakin lama tombol ditekan, semakin kuat dan jauh umpan dilakukan.

### 🧠 Kecerdasan Buatan Pemain
- Pemain mengatur posisi otomatis berdasarkan taktik tim.
- Penyesuaian perilaku terhadap bola, lawan, dan rekan satu tim.

### 🎮 Kontrol Intuitif
- Dirancang agar mudah dipelajari namun sulit dikuasai.
- Sistem kontrol berbasis keyboard/gamepad.

### 📊 Statistik dan Analisis
- Real-time match stats: akurasi passing, penguasaan bola, shots on goal, dll.
- Rekapitulasi pasca pertandingan dengan heatmap dan grafik performa.

---

## 🖥️ Persyaratan Sistem

| Komponen           | Minimum                     | Direkomendasikan              |
|-------------------|-----------------------------|-------------------------------|
| OS                | Windows 10 / Linux / macOS  | Windows 11 / Ubuntu 22.04+    |
| CPU               | Dual Core 2.0 GHz           | Quad Core 3.0 GHz             |
| RAM               | 4 GB                        | 8 GB                          |
| GPU               | Intel HD / Radeon Vega      | Dedicated GPU (NVIDIA/AMD)    |
| Python            | 3.8+                        | 3.10+                         |

---

## ⚙️ Instalasi

1. **Clone repositori**
```bash
git clone https://github.com/username/Advanced-Football-Simulator.git
cd Advanced-Football-Simulator
````

2. **Install dependensi Python**

```bash
pip install -r requirements.txt
```

3. **Jalankan game**

```bash
python main.py
```

> ✅ *Pastikan Python dan pip sudah terinstall di sistem Anda.*

---

## 🎮 Kontrol Permainan

| Tombol Keyboard | Fungsi                |
| --------------- | --------------------- |
| W/A/S/D         | Gerak pemain          |
| Space           | Umpan pendek          |
| Left Shift      | Umpan panjang         |
| Q               | Umpan satu-dua        |
| E               | Umpan silang          |
| Enter           | Ganti pemain terdekat |
| Esc             | Pause / Menu          |

> 🎮 Dukungan untuk kontroler gamepad tersedia (gunakan mapping standar Xbox/PlayStation).

---

## 📁 Struktur Proyek

```
Advanced-Football-Simulator/
├── assets/             # Gambar, audio, sprite
├── core/
│   ├── game.py         # Logika utama permainan
│   ├── player.py       # Modul pemain
│   ├── ai.py           # AI untuk lawan dan rekan tim
│   └── ball.py         # Fisika dan interaksi bola
├── ui/                 # Antarmuka dan menu
├── config/             # Konfigurasi dan pengaturan
├── main.py             # Titik masuk aplikasi
└── README.md           # Dokumentasi proyek
```

---

## 🛠️ Roadmap Fitur

* [x] Sistem Pro Passing
* [x] Statistik pertandingan
* [ ] Mode Multiplayer Lokal
* [ ] Mode Karier dengan manajemen tim
* [ ] Turnamen dan Liga
* [ ] Komentator Suara Dinamis
* [ ] Dukungan Mod (Kostum, Stadion, Tim)

---

## 🤝 Kontribusi

Kontribusi sangat terbuka!

1. Fork repositori ini
2. Buat cabang fitur/bugfix baru
3. Lakukan perubahan & commit
4. Kirim Pull Request

> Baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan lengkap kontribusi.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi **MIT License**. Lihat [LICENSE](LICENSE) untuk detail selengkapnya.

---



---

Terima kasih telah mendukung pengembangan **Advanced Football Simulator**! 🙌

```

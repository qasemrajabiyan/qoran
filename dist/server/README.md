# 🕌 BarakatHub Karbala — Backend Server

## راه‌اندازی سریع

### ۱. نصب Node.js (حداقل نسخه 20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### ۲. نصب ffmpeg
```bash
sudo apt-get install -y ffmpeg
```

### ۳. نصب وابستگی‌ها
```bash
cd server
npm install
```

### ۴. تنظیم متغیرها
```bash
cp .env.example .env
nano .env   # کلیدهای API را وارد کنید
```

### ۵. اجرا
```bash
# حالت توسعه
npm run dev

# حالت production با PM2
npm install -g pm2
npm run pm2
```

---

## API Endpoints

| روش | آدرس | توضیح |
|-----|------|-------|
| GET  | `/health` | وضعیت سرور |
| GET  | `/api/quran/health` | وضعیت سرویس‌ها |
| POST | `/api/quran/upload-video` | آپلود ویدیو اصلی |
| POST | `/api/quran/extract-audio` | استخراج صوت از ویدیو |
| POST | `/api/quran/dub-video` | شروع دوبله ۷ زبان |
| GET  | `/api/quran/status/:jobId` | وضعیت دوبله |
| GET  | `/api/quran/ayahs` | لیست تدبرات |
| POST | `/api/quran/ayahs` | ذخیره تدبر جدید |

---

## سرویس‌های مورد نیاز (بعداً)

| سرویس | کاربرد | قیمت تقریبی |
|-------|--------|-------------|
| ElevenLabs | دوبله صدا با صدای استاد | از $5/ماه |
| OpenAI Whisper | استخراج متن از ویدیو | $0.006/دقیقه |
| Claude API | ترجمه متن | $3/میلیون token |
| Cloudflare R2 | ذخیره ویدیو | $0.015/GB/ماه |
| VPS Hetzner | اجرای سرور | از €4/ماه |

---

## جریان کار دوبله

```
ادمین ویدیو فارسی آپلود می‌کند
        ↓
ffmpeg صوت را استخراج می‌کند
        ↓
Whisper متن فارسی را می‌خواند
        ↓
Claude متن را به ۷ زبان ترجمه می‌کند
        ↓
ElevenLabs با صدای استاد TTS می‌سازد
        ↓
ffmpeg صدا + ویدیو را ادغام می‌کند
        ↓
Cloudflare R2 فایل نهایی را ذخیره می‌کند
        ↓
کاربر ویدیو/صوت به زبان خودش می‌بیند
```

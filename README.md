# 📁 BarakatHub — مستندات زیرساخت (قسمت ۱)

## ساختار فایل‌ها

```
project/
├── index.html                    ← قالب اصلی HTML
├── manifest.json                 ← PWA manifest
└── assets/
    ├── css/
    │   ├── 01-tokens.css         ← Design Tokens (رنگ، فضا، فونت، سایه)
    │   ├── 02-reset.css          ← CSS Reset + Base + چندزبانگی
    │   ├── 03-layout.css         ← Grid, Flex, Container, Section
    │   ├── 04-components.css     ← Button, Card, Badge, Input, Avatar...
    │   ├── 05-navbar.css         ← Navbar + Search + Language Selector
    │   └── 06-footer.css         ← Footer + Skip Link
    └── js/
        ├── i18n.js               ← موتور چندزبانگی (۷ زبان)
        ├── theme.js              ← Dark/Light Mode Manager
        └── app.js                ← نقطه ورود اپلیکیشن
```

---

## 🎨 سیستم رنگ

| نام | رنگ | کاربرد |
|-----|-----|--------|
| Primary (Deep Teal) | `#2a9d8f` | برند اصلی، لینک، دکمه |
| Secondary (Warm Amber) | `#f4a261` | accent، هشدار، خبرهای فوری |
| Neutral (Warm Gray) | `#faf9f7 → #100d0a` | پس‌زمینه، متن |

**منبع:** ترندهای 2025-2026 — Pantone Mocha Mousse + Deep Teal + Warm Amber  
**استاندارد:** WCAG AA (contrast ratio ≥ 4.5:1 برای متن)

---

## 🔤 فونت‌ها

| زبان | Display (تیتر) | Body (متن) | توضیح |
|------|---------------|------------|-------|
| **فارسی** | Lalezar | Vazirmatn | بهترین فونت مدرن فارسی، variable |
| **عربی** | Lalezar | Noto Naskh Arabic | پشتیبانی کامل عربی |
| **اردو** | Gulzar | Noto Nastaliq Urdu | نستعلیق، line-height بیشتر |
| **آذری / ترکی** | Playfair Display | DM Sans | LTR، خوانایی بالا |
| **روسی** | Playfair Display | PT Serif | طراحی‌شده برای Cyrillic |
| **انگلیسی** | Playfair Display | DM Sans | مدرن، variable |

---

## 🌍 زبان‌های پشتیبانی‌شده

| کد | زبان | جهت | قالب تاریخ | سیستم عدد |
|----|------|-----|------------|-----------|
| `fa` | فارسی | RTL | شمسی | ۱۲۳ |
| `ar` | عربی | RTL | میلادی | ١٢٣ |
| `ur` | اردو | RTL | میلادی | ۱۲۳ |
| `az` | آذری | LTR | میلادی | 123 |
| `tr` | ترکی | LTR | میلادی | 123 |
| `ru` | روسی | LTR | میلادی | 123 |
| `en` | انگلیسی | LTR | میلادی | 123 |

---

## 📋 راهنمای هر فایل

### `01-tokens.css`
**تنها فایلی که باید برای تغییر رنگ یا اندازه ویرایش شود.**
- تمام رنگ‌ها به صورت CSS custom properties
- Dark mode فقط با override توکن‌های semantic
- هر تغییر اینجا به کل سایت اعمال می‌شود

### `02-reset.css`
- CSS Reset مدرن
- فونت‌ها به ازای هر زبان با `:lang()` تنظیم می‌شود
- RTL/LTR خودکار
- `direction`, `text-align` برای هر زبان جداگانه

### `03-layout.css`
- Container با max-width های مختلف
- Grid system responsive (auto-fill + fixed columns)
- Flex utilities
- Section spacing
- Masonry layout برای گالری

### `04-components.css`
- Button (variants: primary, secondary, outline, ghost, danger)
- Card + article-card
- Badge + Tag
- Input + Textarea + Select
- Avatar
- Skeleton loader
- Tooltip
- Keyframe animations

### `05-navbar.css`
- Navbar ثابت با shadow هنگام اسکرول
- Language dropdown با animation
- Search overlay
- Mobile menu

### `i18n.js`
```javascript
import { i18n, t, setLang, formatDate, timeAgo } from './i18n.js';

// ترجمه
t('nav.home')              // → 'خانه' (فارسی)
t('btn.readMore')          // → 'ادامه مطلب'

// تغییر زبان
setLang('ar');             // عربی — DOM را هم آپدیت می‌کند

// فرمت تاریخ
formatDate(new Date())     // → '۱۴۰۴ فروردین ۸' (فارسی)

// زمان نسبی
timeAgo(new Date('2025-01-01'))  // → '۳ ماه پیش'
```

### `theme.js`
```javascript
import { theme } from './theme.js';

theme.toggle()             // تغییر بین dark/light
theme.set('dark')          // تنظیم مستقیم
theme.current              // 'dark' | 'light'
theme.isDark               // true | false
theme.onChange(fn)         // subscribe به تغییرات
theme.bindToggleBtn(btn)   // اتصال یک دکمه
```

### `app.js`
- Navbar و Footer را inject می‌کند
- Event listener های عمومی
- `showToast(message, type)` برای نوتیفیکیشن

---

## 🔧 نحوه افزودن زبان جدید

در `i18n.js` به `LANG_CONFIG` اضافه کنید:
```javascript
de: {
  name: 'Deutsch',
  nativeName: 'Deutsch',
  dir: 'ltr',
  locale: 'de-DE',
  font: 'ltr',
  flag: '🇩🇪',
  numberSystem: 'latn',
},
```
سپس ترجمه‌ها را به `TRANSLATIONS` اضافه کنید.  
در `index.html` یک `hreflang` جدید اضافه کنید.

---

## 🔧 نحوه افزودن صفحه جدید

1. یک فایل CSS مثل `page-article.css` بسازید
2. آن را در `index.html` لود کنید
3. محتوا را در `#page-root` رندر کنید

---

## ✅ Security Headers (پیشنهاد سرور)
```
Content-Security-Policy: default-src 'self'; font-src fonts.gstatic.com; style-src fonts.googleapis.com 'self';
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 📈 Performance
- فونت‌ها با `font-display: swap` لود می‌شوند (بدون FOUT)
- Dark mode بدون flash با Critical CSS inline
- CSS custom properties: بدون JS برای تم
- `prefers-reduced-motion` رعایت شده

---

> **قسمت ۲** (به زودی): Navbar کامل، Article Card، Sidebar، Hero Section، Search Page

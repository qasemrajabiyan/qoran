/**
 * FILE: feedback.js
 * ROLE: صفحه بازخورد — گزارش مشکل و پیشنهاد
 * PROJECT: BarakatHub
 * VERSION: 1.0.0
 */

import { i18n } from './i18n.js';

const T = {
  pageTitle:    { fa:'گزارش مشکل / پیشنهاد', ar:'الإبلاغ عن مشكلة / اقتراح', ur:'مسئلہ رپورٹ / تجویز', az:'Problem Bildir / Təklif', tr:'Sorun Bildir / Öneri', ru:'Сообщить о проблеме / Предложение', en:'Report an Issue / Suggest', id:'Laporkan Masalah / Saran' },
  pageSubtitle: { fa:'نظرات و پیشنهادات شما به بهبود برکت هاب کمک می‌کند', ar:'آراؤكم واقتراحاتكم تساعد في تحسين برکت هاب', ur:'آپ کی آراء اور تجاویز برکت ہب کو بہتر بنانے میں مدد کرتی ہیں', az:'Rəy və təklifləriniz BarakatHub-u inkişaf etdirməyə kömək edir', tr:'Görüş ve önerileriniz BarakatHub\'u geliştirmeye yardımcı olur', ru:'Ваши отзывы и предложения помогают улучшить BarakatHub', en:'Your feedback and suggestions help improve BarakatHub', id:'Masukan dan saran Anda membantu meningkatkan BarakatHub' },
  typeBug:      { fa:'🐛 گزارش باگ', ar:'🐛 الإبلاغ عن خطأ', ur:'🐛 باگ رپورٹ', az:'🐛 Xəta bildirişi', tr:'🐛 Hata Bildirimi', ru:'🐛 Сообщить об ошибке', en:'🐛 Bug Report', id:'🐛 Laporan Bug' },
  typeSuggest:  { fa:'💡 پیشنهاد', ar:'💡 اقتراح', ur:'💡 تجویز', az:'💡 Təklif', tr:'💡 Öneri', ru:'💡 Предложение', en:'💡 Suggestion', id:'💡 Saran' },
  typeOther:    { fa:'💬 سایر', ar:'💬 أخرى', ur:'💬 دیگر', az:'💬 Digər', tr:'💬 Diğer', ru:'💬 Другое', en:'💬 Other', id:'💬 Lainnya' },
  labelType:    { fa:'نوع بازخورد', ar:'نوع الملاحظة', ur:'بازخورد کی قسم', az:'Rəy növü', tr:'Geri bildirim türü', ru:'Тип обратной связи', en:'Feedback type', id:'Jenis masukan' },
  labelSubject: { fa:'موضوع', ar:'الموضوع', ur:'موضوع', az:'Mövzu', tr:'Konu', ru:'Тема', en:'Subject', id:'Subjek' },
  labelMessage: { fa:'توضیحات', ar:'التفاصيل', ur:'تفصیلات', az:'Təfərrüatlar', tr:'Açıklama', ru:'Описание', en:'Description', id:'Deskripsi' },
  labelEmail:   { fa:'ایمیل (اختیاری)', ar:'البريد الإلكتروني (اختياري)', ur:'ای میل (اختیاری)', az:'E-poçt (ixtiyari)', tr:'E-posta (isteğe bağlı)', ru:'Эл. почта (необязательно)', en:'Email (optional)', id:'Email (opsional)' },
  labelPage:    { fa:'صفحه مربوطه (اختیاری)', ar:'الصفحة المعنية (اختياري)', ur:'متعلقہ صفحہ (اختیاری)', az:'Müvafiq səhifə (ixtiyari)', tr:'İlgili sayfa (isteğe bağlı)', ru:'Страница (необязательно)', en:'Related page (optional)', id:'Halaman terkait (opsional)' },
  phSubject:    { fa:'خلاصه مشکل یا پیشنهاد...', ar:'ملخص المشكلة أو الاقتراح...', ur:'مسئلے یا تجویز کا خلاصہ...', az:'Problemi qısaca yazın...', tr:'Sorun veya öneriyi özetleyin...', ru:'Кратко опишите проблему...', en:'Summarize the issue or suggestion...', id:'Ringkasan masalah atau saran...' },
  phMessage:    { fa:'جزئیات بیشتری بنویسید...', ar:'اكتب مزيداً من التفاصيل...', ur:'مزید تفصیلات لکھیں...', az:'Daha ətraflı yazın...', tr:'Daha fazla detay yazın...', ru:'Напишите подробнее...', en:'Write more details...', id:'Tulis lebih detail...' },
  phPage:       { fa:'مثلاً: صفحه قرآن', ar:'مثال: صفحة القرآن', ur:'مثلاً: قرآن صفحہ', az:'Məsələn: Quran səhifəsi', tr:'Örn: Kuran sayfası', ru:'Напр.: страница Корана', en:'e.g.: Quran page', id:'mis: halaman Quran' },
  btnSubmit:    { fa:'ارسال بازخورد', ar:'إرسال الملاحظة', ur:'بازخورد بھیجیں', az:'Rəy göndər', tr:'Geri bildirim gönder', ru:'Отправить отзыв', en:'Send Feedback', id:'Kirim Masukan' },
  btnSending:   { fa:'در حال ارسال...', ar:'جارٍ الإرسال...', ur:'بھیجا جا رہا ہے...', az:'Göndərilir...', tr:'Gönderiliyor...', ru:'Отправка...', en:'Sending...', id:'Mengirim...' },
  successTitle: { fa:'✅ بازخورد شما ثبت شد!', ar:'✅ تم تسجيل ملاحظتك!', ur:'✅ آپ کا بازخورد درج ہو گیا!', az:'✅ Rəyiniz qeydə alındı!', tr:'✅ Geri bildiriminiz alındı!', ru:'✅ Ваш отзыв принят!', en:'✅ Your feedback was received!', id:'✅ Masukan Anda diterima!' },
  successMsg:   { fa:'با تشکر از شما! تیم برکت هاب بازخورد شما را بررسی خواهد کرد.', ar:'شكراً لك! سيراجع فريق برکت هاب ملاحظتك.', ur:'شکریہ! برکت ہب ٹیم آپ کی رائے کا جائزہ لے گی.', az:'Təşəkkür edirik! BarakatHub komandası rəyinizi nəzərdən keçirəcək.', tr:'Teşekkürler! BarakatHub ekibi geri bildiriminizi inceleyecek.', ru:'Спасибо! Команда BarakatHub рассмотрит ваш отзыв.', en:'Thank you! The BarakatHub team will review your feedback.', id:'Terima kasih! Tim BarakatHub akan meninjau masukan Anda.' },
  errRequired:  { fa:'لطفاً موضوع و توضیحات را وارد کنید', ar:'يرجى إدخال الموضوع والتفاصيل', ur:'براہ کرم موضوع اور تفصیلات درج کریں', az:'Mövzu və təfərrüatları daxil edin', tr:'Lütfen konu ve açıklama girin', ru:'Пожалуйста, заполните тему и описание', en:'Please enter subject and description', id:'Harap masukkan subjek dan deskripsi' },
};

function _t(key) {
  const lang = i18n.lang || 'fa';
  return T[key]?.[lang] || T[key]?.['en'] || key;
}

export function renderFeedbackPage(root) {
  if (!root) return;

  root.innerHTML = `
    <section style="padding:var(--space-16) 0 var(--space-20);">
      <div class="container" style="max-width:680px;">

        <div style="text-align:center;margin-bottom:var(--space-10);">
          <div style="font-size:48px;margin-bottom:var(--space-4);">📬</div>
          <h1 style="font-size:var(--text-3xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-3);">${_t('pageTitle')}</h1>
          <p style="font-size:var(--text-base);color:var(--text-muted);line-height:1.7;">${_t('pageSubtitle')}</p>
        </div>

        <div class="card" style="padding:var(--space-8);" id="feedback-card">

          <div style="margin-bottom:var(--space-6);">
            <label style="display:block;font-size:var(--text-sm);font-weight:500;color:var(--text-secondary);margin-bottom:var(--space-3);">${_t('labelType')}</label>
            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;" id="type-btns">
              <button class="btn btn--primary feedback-type-btn" data-type="bug">${_t('typeBug')}</button>
              <button class="btn btn--outline feedback-type-btn" data-type="suggest">${_t('typeSuggest')}</button>
              <button class="btn btn--outline feedback-type-btn" data-type="other">${_t('typeOther')}</button>
            </div>
          </div>

          <div style="margin-bottom:var(--space-5);">
            <label for="fb-subject" style="display:block;font-size:var(--text-sm);font-weight:500;color:var(--text-secondary);margin-bottom:var(--space-2);">${_t('labelSubject')} *</label>
            <input type="text" id="fb-subject" class="input" placeholder="${_t('phSubject')}" style="width:100%;"/>
          </div>

          <div style="margin-bottom:var(--space-5);">
            <label for="fb-message" style="display:block;font-size:var(--text-sm);font-weight:500;color:var(--text-secondary);margin-bottom:var(--space-2);">${_t('labelMessage')} *</label>
            <textarea id="fb-message" class="input" rows="5" placeholder="${_t('phMessage')}" style="width:100%;resize:vertical;"></textarea>
          </div>

          <div style="margin-bottom:var(--space-5);">
            <label for="fb-page" style="display:block;font-size:var(--text-sm);font-weight:500;color:var(--text-secondary);margin-bottom:var(--space-2);">${_t('labelPage')}</label>
            <input type="text" id="fb-page" class="input" placeholder="${_t('phPage')}" style="width:100%;"/>
          </div>

          <div style="margin-bottom:var(--space-8);">
            <label for="fb-email" style="display:block;font-size:var(--text-sm);font-weight:500;color:var(--text-secondary);margin-bottom:var(--space-2);">${_t('labelEmail')}</label>
            <input type="email" id="fb-email" class="input" placeholder="example@email.com" style="width:100%;"/>
          </div>

          <button class="btn btn--primary" id="fb-submit" style="width:100%;padding:var(--space-4);">${_t('btnSubmit')}</button>
        </div>

        <div id="feedback-success" style="display:none;text-align:center;padding:var(--space-12);">
          <div style="font-size:64px;margin-bottom:var(--space-4);">🎉</div>
          <h2 style="font-size:var(--text-2xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-3);">${_t('successTitle')}</h2>
          <p style="color:var(--text-muted);font-size:var(--text-base);line-height:1.7;">${_t('successMsg')}</p>
          <a href="./index.html" class="btn btn--primary" style="margin-top:var(--space-6);">${{fa:'بازگشت به خانه',ar:'العودة إلى الرئيسية',ur:'گھر واپس',az:'Ana səhifəyə qayıt',tr:'Ana sayfaya dön',ru:'На главную',en:'Back to Home',id:'Kembali ke Beranda'}[i18n.lang]??'Back'}</a>
        </div>

      </div>
    </section>
  `;

  _bindEvents(root);
}

function _bindEvents(root) {
  let selectedType = 'bug';

  root.querySelectorAll('.feedback-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.feedback-type-btn').forEach(b => {
        b.classList.remove('btn--primary');
        b.classList.add('btn--outline');
      });
      btn.classList.remove('btn--outline');
      btn.classList.add('btn--primary');
      selectedType = btn.dataset.type;
    });
  });

  root.querySelector('#fb-submit')?.addEventListener('click', async () => {
    const subject = root.querySelector('#fb-subject')?.value?.trim();
    const message = root.querySelector('#fb-message')?.value?.trim();
    const email   = root.querySelector('#fb-email')?.value?.trim();
    const page    = root.querySelector('#fb-page')?.value?.trim();

    if (!subject || !message) {
      _showToast(_t('errRequired'), false);
      return;
    }

    const btn = root.querySelector('#fb-submit');
    btn.disabled = true;
    btn.textContent = _t('btnSending');

    try {
      const feedbacks = JSON.parse(localStorage.getItem('mh_feedbacks') || '[]');
      feedbacks.push({ id:'fb_'+Date.now(), type:selectedType, subject, message, email:email||null, page:page||null, lang:i18n.lang, date:new Date().toISOString(), status:'new' });
      localStorage.setItem('mh_feedbacks', JSON.stringify(feedbacks));

      try {
        await fetch('/api/feedback', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ type:selectedType, subject, message, email, page, lang:i18n.lang }),
        });
      } catch { /* ذخیره در localStorage انجام شد */ }

      root.querySelector('#feedback-card').style.display = 'none';
      root.querySelector('#feedback-success').style.display = 'block';

    } catch (err) {
      btn.disabled = false;
      btn.textContent = _t('btnSubmit');
      _showToast('❌ ' + err.message, false);
    }
  });
}

function _showToast(msg, success = true) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.style.cssText = `pointer-events:auto;background:${success?'var(--color-success-500,#16a34a)':'var(--color-error-500,#dc2626)'};color:white;padding:12px 20px;border-radius:8px;font-size:14px;`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'assets', 'js', 'admin-router.js');

if (!fs.existsSync(filePath)) {
  console.log('ERROR: file not found: ' + filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('meeting-location')) {
  console.log('ALREADY PATCHED - meeting-location exists');
  process.exit(0);
}

const oldBtn = `          <button class="btn btn--primary" id="save-meeting-btn">💾 ذخیره</button>`;

if (!content.includes(oldBtn)) {
  console.log('ERROR: could not find save button text in file');
  console.log('File length: ' + content.length);
  process.exit(1);
}

const newFields = `          <div class="admin-field">
            <label class="admin-label" for="meeting-location">📍 لوکیشن / آدرس دیدار</label>
            <input type="text" class="admin-input" id="meeting-location"
              placeholder="کربلا، خیابان امام حسین، نزدیک حرم"
              value="${config?.location??''}"/>
          </div>
          <div class="admin-field">
            <label class="admin-label" for="meeting-map-url">🗺️ لینک نقشه Google Maps</label>
            <input type="url" class="admin-input" id="meeting-map-url"
              placeholder="https://maps.google.com/..."
              value="${config?.mapUrl??''}"/>
          </div>
          <button class="btn btn--primary" id="save-meeting-btn">💾 ذخیره</button>`;

content = content.replace(oldBtn, newFields);

const oldSave = `      confirmMsg:  document.getElementById('confirm-msg')?.value,\n    };`;
const newSave = `      confirmMsg:  document.getElementById('confirm-msg')?.value,\n      location:    document.getElementById('meeting-location')?.value,\n      mapUrl:      document.getElementById('meeting-map-url')?.value,\n    };`;

content = content.replace(oldSave, newSave);

fs.writeFileSync(filePath, content, 'utf8');

if (content.includes('meeting-location')) {
  console.log('SUCCESS: patch applied!');
} else {
  console.log('FAILED');
  process.exit(1);
}

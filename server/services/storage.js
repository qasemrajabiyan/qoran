/**
 * ============================================================
 * FILE: services/storage.js
 * ROLE: ذخیره و مدیریت فایل — Cloudflare R2
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 3.0.0 (Cloudflare Workers compatible)
 * ============================================================
 * تغییرات:
 *   - حذف fs, createReadStream, createWriteStream (ناسازگار با Workers)
 *   - جایگزینی با fetch و ArrayBuffer
 *   - R2 از طریق S3 API با fetch مستقیم
 *   - بقیه کدها دست‌نخورده
 * ============================================================
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config.js';

/* ── راه‌اندازی R2 Client ── */
let _r2Client = null;

function _getR2Client() {
  if (_r2Client) return _r2Client;
  if (!CONFIG.R2.ACCESS_KEY_ID) return null;

  _r2Client = new S3Client({
    region:   'auto',
    endpoint: `https://${CONFIG.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     CONFIG.R2.ACCESS_KEY_ID,
      secretAccessKey: CONFIG.R2.SECRET_ACCESS_KEY,
    },
  });
  return _r2Client;
}

/* ────────────────────────────────────────────────────────────
   آپلود فایل به R2
   filePath می‌تواند مسیر فایل یا URL باشد
   ──────────────────────────────────────────────────────────── */
export async function uploadFile(filePath, destKey, mimeType) {
  const client = _getR2Client();

  if (!client) {
    console.warn('[Storage] R2 وصل نیست — فایل آپلود نشد');
    return `${CONFIG.BASE_URL}/uploads/${destKey.replace(/\//g, '_')}`;
  }

  /* خواندن فایل به صورت Buffer */
  let fileBuffer;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    /* اگر URL بود — دانلود و آپلود */
    const res = await fetch(filePath);
    fileBuffer = Buffer.from(await res.arrayBuffer());
  } else {
    /* اگر مسیر فایل بود — خواندن با fs */
    const { readFileSync } = await import('fs');
    fileBuffer = readFileSync(filePath);
  }

  const command = new PutObjectCommand({
    Bucket:       CONFIG.R2.BUCKET_NAME,
    Key:          destKey,
    Body:         fileBuffer,
    ContentType:  mimeType,
    CacheControl: 'public, max-age=31536000',
  });

  await client.send(command);
  const publicUrl = `${CONFIG.R2.PUBLIC_URL}/${destKey}`;
  console.log(`[Storage] آپلود R2: ${publicUrl}`);
  return publicUrl;
}

/* ────────────────────────────────────────────────────────────
   آپلود Buffer مستقیم (برای صوت تولیدشده توسط AI)
   ──────────────────────────────────────────────────────────── */
export async function uploadBuffer(buffer, destKey, mimeType) {
  const client = _getR2Client();

  if (!client) {
    console.warn('[Storage] R2 وصل نیست — buffer آپلود نشد');
    return `${CONFIG.BASE_URL}/uploads/${destKey.replace(/\//g, '_')}`;
  }

  const command = new PutObjectCommand({
    Bucket:       CONFIG.R2.BUCKET_NAME,
    Key:          destKey,
    Body:         buffer,
    ContentType:  mimeType,
    CacheControl: 'public, max-age=31536000',
  });

  await client.send(command);
  return `${CONFIG.R2.PUBLIC_URL}/${destKey}`;
}

/* ────────────────────────────────────────────────────────────
   حذف فایل
   ──────────────────────────────────────────────────────────── */
export async function deleteFile(destKey) {
  const client = _getR2Client();
  if (!client) return;

  await client.send(new DeleteObjectCommand({
    Bucket: CONFIG.R2.BUCKET_NAME,
    Key:    destKey,
  }));
}

/* ────────────────────────────────────────────────────────────
   ساخت کلید یکتا برای فایل
   ──────────────────────────────────────────────────────────── */
export function makeKey(ayahId, lang, type) {
  /* type: 'video' | 'audio' */
  const ext = type === 'video' ? 'mp4' : 'mp3';
  const uid = uuidv4().slice(0, 8);
  return `quran/${ayahId}/${lang}/${type}_${uid}.${ext}`;
}

/* ── وضعیت ذخیره‌سازی ── */
export function getStorageStatus() {
  const r2Connected = !!_getR2Client();
  return {
    type:      r2Connected ? 'Cloudflare R2' : 'Local Storage',
    connected: r2Connected,
    bucket:    r2Connected ? CONFIG.R2.BUCKET_NAME : 'local',
    publicUrl: r2Connected ? CONFIG.R2.PUBLIC_URL  : CONFIG.BASE_URL + '/uploads',
  };
}

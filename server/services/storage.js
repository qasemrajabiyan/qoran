/**
 * ============================================================
 * FILE: services/storage.js
 * ROLE: ذخیره و مدیریت فایل — Cloudflare R2 + fallback محلی
 * PROJECT: BarakatHub Karbala Backend
 * ============================================================
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config.js';

/* ── راه‌اندازی R2 Client ── */
let _r2Client = null;

function _getR2Client() {
  if (_r2Client) return _r2Client;
  if (!CONFIG.R2.ACCESS_KEY_ID) return null;

  _r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${CONFIG.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     CONFIG.R2.ACCESS_KEY_ID,
      secretAccessKey: CONFIG.R2.SECRET_ACCESS_KEY,
    },
  });
  return _r2Client;
}

/* ── پوشه محلی موقت ── */
const LOCAL_DIR = join(process.cwd(), 'uploads');
if (!existsSync(LOCAL_DIR)) mkdirSync(LOCAL_DIR, { recursive: true });

/* ────────────────────────────────────────────────────────────
   آپلود فایل به R2 یا محلی
   ──────────────────────────────────────────────────────────── */
export async function uploadFile(filePath, destKey, mimeType) {
  const client = _getR2Client();

  /* اگر R2 وصل نیست — ذخیره محلی */
  if (!client) {
    const localPath = join(LOCAL_DIR, destKey.replace(/\//g, '_'));
    const { copyFileSync } = await import('fs');
    copyFileSync(filePath, localPath);
    const localUrl = `${CONFIG.BASE_URL}/uploads/${destKey.replace(/\//g, '_')}`;
    console.log(`[Storage] ذخیره محلی: ${localUrl}`);
    return localUrl;
  }

  /* آپلود به R2 */
  const fileStream = createReadStream(filePath);
  const command = new PutObjectCommand({
    Bucket:      CONFIG.R2.BUCKET_NAME,
    Key:         destKey,
    Body:        fileStream,
    ContentType: mimeType,
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
    const localPath = join(LOCAL_DIR, destKey.replace(/\//g, '_'));
    const { writeFileSync } = await import('fs');
    writeFileSync(localPath, buffer);
    return `${CONFIG.BASE_URL}/uploads/${destKey.replace(/\//g, '_')}`;
  }

  const command = new PutObjectCommand({
    Bucket:      CONFIG.R2.BUCKET_NAME,
    Key:         destKey,
    Body:        buffer,
    ContentType: mimeType,
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
  const ext  = type === 'video' ? 'mp4' : 'mp3';
  const uid  = uuidv4().slice(0, 8);
  return `quran/${ayahId}/${lang}/${type}_${uid}.${ext}`;
}

/* ── وضعیت ذخیره‌سازی ── */
export function getStorageStatus() {
  const r2Connected = !!_getR2Client();
  return {
    type:      r2Connected ? 'Cloudflare R2' : 'Local Storage',
    connected: r2Connected,
    bucket:    r2Connected ? CONFIG.R2.BUCKET_NAME : LOCAL_DIR,
    publicUrl: r2Connected ? CONFIG.R2.PUBLIC_URL  : CONFIG.BASE_URL + '/uploads',
  };
}

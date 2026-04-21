/**
 * ============================================================
 * FILE: server/db/client.js
 * ROLE: اتصال به Cloudflare D1 از طریق REST API
 * PROJECT: BarakatHub Karbala Backend
 * VERSION: 1.0.0
 * ============================================================
 * Cloudflare D1 در Workers اجرا می‌شود — برای اتصال از سرور
 * Node.js باید از D1 HTTP API استفاده کنیم.
 * ============================================================
 */

import { CONFIG } from '../config.js';

/* ── تنظیمات D1 از .env ── */
const D1_ACCOUNT_ID  = process.env.CF_ACCOUNT_ID;
const D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID;
const D1_API_TOKEN   = process.env.CF_D1_API_TOKEN;
const D1_BASE_URL    = `https://api.cloudflare.com/client/v4/accounts/${D1_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}`;

/* ════════════════════════════════════════════════════════════
   ۱. اجرای یک query
   ════════════════════════════════════════════════════════════ */
export async function dbQuery(sql, params = []) {
  if (!D1_ACCOUNT_ID || !D1_DATABASE_ID || !D1_API_TOKEN) {
    throw new Error('D1 credentials تنظیم نشده — CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_D1_API_TOKEN را در .env قرار دهید');
  }

  const res = await fetch(`${D1_BASE_URL}/query`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${D1_API_TOKEN}`,
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`D1 HTTP Error ${res.status}: ${err}`);
  }

  const json = await res.json();

  if (!json.success) {
    const msg = json.errors?.map(e => e.message).join(', ') || 'D1 query failed';
    throw new Error(`D1 Error: ${msg}`);
  }

  /* D1 همیشه آرایه‌ای از result برمی‌گرداند */
  return json.result?.[0] ?? { results: [], meta: {} };
}

/* ════════════════════════════════════════════════════════════
   ۲. اجرای چند query در یک تراکنش (batch)
   ════════════════════════════════════════════════════════════ */
export async function dbBatch(queries) {
  /* queries: [ { sql, params }, ... ] */
  if (!D1_ACCOUNT_ID || !D1_DATABASE_ID || !D1_API_TOKEN) {
    throw new Error('D1 credentials تنظیم نشده');
  }

  const res = await fetch(`${D1_BASE_URL}/query`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${D1_API_TOKEN}`,
    },
    body: JSON.stringify(queries.map(q => ({ sql: q.sql, params: q.params ?? [] }))),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`D1 Batch HTTP Error ${res.status}: ${err}`);
  }

  const json = await res.json();

  if (!json.success) {
    const msg = json.errors?.map(e => e.message).join(', ') || 'D1 batch failed';
    throw new Error(`D1 Batch Error: ${msg}`);
  }

  return json.result ?? [];
}

/* ════════════════════════════════════════════════════════════
   ۳. اجرای schema (راه‌اندازی اول)
   ════════════════════════════════════════════════════════════ */
export async function dbExecFile(sqlContent) {
  /* SQL را به statement های جداگانه تقسیم کن */
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('PRAGMA'));

  const queries = statements.map(sql => ({ sql: sql + ';', params: [] }));
  return dbBatch(queries);
}

/* ════════════════════════════════════════════════════════════
   ۴. ابزارهای کمکی
   ════════════════════════════════════════════════════════════ */

/** یک ردیف — null اگر پیدا نشد */
export async function dbGet(sql, params = []) {
  const result = await dbQuery(sql, params);
  return result.results?.[0] ?? null;
}

/** همه ردیف‌ها */
export async function dbAll(sql, params = []) {
  const result = await dbQuery(sql, params);
  return result.results ?? [];
}

/** فقط اجرا — برای INSERT/UPDATE/DELETE */
export async function dbRun(sql, params = []) {
  const result = await dbQuery(sql, params);
  return result.meta ?? {};
}

/* ════════════════════════════════════════════════════════════
   ۵. بررسی اتصال
   ════════════════════════════════════════════════════════════ */
export async function dbHealthCheck() {
  try {
    await dbQuery('SELECT 1 AS ok');
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

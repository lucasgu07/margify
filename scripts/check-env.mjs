#!/usr/bin/env node
/**
 * Verifica variables de entorno para Margify (local o CI).
 * Uso: node scripts/check-env.mjs
 * Carga .env.local si existe (sin dependencias extra).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const envPath = resolve(root, ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(envPath);

const ok = (k) => Boolean(process.env[k]?.trim());
const warn = (k) => !ok(k);

const groups = [
  {
    title: "CORE (MVP — login + persistencia)",
    items: [
      {
        key: "NEXT_PUBLIC_SUPABASE_URL",
        hint: "https://xxx.supabase.co (Settings → API → Project URL)",
        critical: true,
      },
      {
        key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        hint: "anon public (eyJ…), NO service_role",
        critical: true,
        validate: (v) =>
          v.startsWith("eyJ") || v.startsWith("sb_publishable_")
            ? null
            : "Parece service_role o clave incorrecta (debería ser anon public)",
      },
      {
        key: "SUPABASE_SERVICE_ROLE_KEY",
        hint: "Settings → API → service_role",
        critical: true,
      },
      { key: "NEXT_PUBLIC_SITE_URL", hint: "http://localhost:3000 o https://margify.app", critical: true },
      { key: "CRON_SECRET", hint: "openssl rand -hex 32 (crons en Vercel)", critical: false },
    ],
  },
  {
    title: "IA",
    items: [
      { key: "ANTHROPIC_API_KEY", hint: "IA Advisor (Claude)", critical: false },
      { key: "OPENAI_API_KEY", hint: "Chat Margify AI", critical: false },
    ],
  },
  {
    title: "Al menos UNA tienda (elegí una)",
    items: [
      { key: "TIENDANUBE_APP_ID", hint: "Partner Portal TiendaNube", critical: false, group: "tn" },
      { key: "TIENDANUBE_CLIENT_SECRET", hint: "Partner Portal TiendaNube", critical: false, group: "tn" },
      { key: "SHOPIFY_API_KEY", hint: "Shopify Partners", critical: false, group: "shopify" },
      { key: "SHOPIFY_API_SECRET", hint: "Shopify Partners", critical: false, group: "shopify" },
    ],
  },
  {
    title: "Billing",
    items: [
      { key: "DODO_PAYMENTS_API_KEY", hint: "Checkout Pro/Scale", critical: false },
      { key: "DODO_PAYMENTS_WEBHOOK_KEY", hint: "Webhook en prod", critical: false },
    ],
  },
  {
    title: "Alertas (opcional)",
    items: [
      { key: "RESEND_API_KEY", hint: "Email", critical: false },
      { key: "WHATSAPP_API_TOKEN", hint: "Meta Cloud API", critical: false },
      { key: "WHATSAPP_PHONE_NUMBER_ID", hint: "Meta Business", critical: false },
    ],
  },
];

let errors = 0;
let warnings = 0;

console.log("\n Margify — check de variables de entorno\n");
if (!existsSync(envPath)) {
  console.log("  ⚠  No se encontró .env.local — copiá desde .env.example\n");
  warnings += 1;
} else {
  console.log(`  Archivo: .env.local\n`);
}

for (const group of groups) {
  console.log(`── ${group.title} ──`);
  for (const item of group.items) {
    const val = process.env[item.key]?.trim() ?? "";
    const set = val.length > 0;
    let extra = "";
    if (set && item.validate) {
      const err = item.validate(val);
      if (err) {
        extra = ` ⚠ ${err}`;
        warnings += 1;
      }
    }
    if (set) {
      console.log(`  ✓ ${item.key}${extra}`);
    } else if (item.critical) {
      console.log(`  ✗ ${item.key} — FALTA — ${item.hint}`);
      errors += 1;
    } else {
      console.log(`  ○ ${item.key} — vacío — ${item.hint}`);
      warnings += 1;
    }
  }
  console.log("");
}

const tnOk = ok("TIENDANUBE_APP_ID") && ok("TIENDANUBE_CLIENT_SECRET");
const shopifyOk = ok("SHOPIFY_API_KEY") && ok("SHOPIFY_API_SECRET");
if (!tnOk && !shopifyOk) {
  console.log("── Tienda ──");
  console.log("  ✗ Necesitás TiendaNube O Shopify configurado para ver datos reales\n");
  errors += 1;
} else {
  console.log(`── Tienda ──\n  ✓ ${tnOk ? "TiendaNube" : "Shopify"} listo para OAuth\n`);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
if (supabaseUrl.includes("supabase.com/dashboard")) {
  console.log("  ✗ NEXT_PUBLIC_SUPABASE_URL apunta al dashboard, no a la API (.supabase.co)\n");
  errors += 1;
}

console.log("── SQL Supabase ──");
console.log("  Ejecutá manualmente: supabase/schema-v2.sql en SQL Editor\n");

console.log("── Resumen ──");
if (errors === 0 && warnings === 0) {
  console.log("  Todo OK para desarrollo local.\n");
} else {
  console.log(`  ${errors} bloqueante(s) · ${warnings} pendiente(s)\n`);
  console.log("  Guía: docs/TU-PARTE.md\n");
}

process.exit(errors > 0 ? 1 : 0);

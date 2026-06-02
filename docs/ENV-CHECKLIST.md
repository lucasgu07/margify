# Checklist de variables de entorno — Margify

Estado basado en tu `.env.local` actual. Actualizá este doc cuando completes cada ítem.

**Leyenda:** ✅ configurado · ⬜ vacío · ⚠️ revisar · 🔴 bloqueante para MVP

---

## Fase 0 — Infra mínima (sin esto nada “real” funciona)

| Variable | Estado | Para qué | Dónde obtenerla |
|----------|--------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠️ | Auth + cliente | Supabase → **Settings → API → Project URL** (`https://xxx.supabase.co`). **No** uses la URL del dashboard. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ | Auth cliente | Supabase → **Settings → API → anon public**. Debe ser la clave **pública**, no `service_role`. |
| `SUPABASE_SERVICE_ROLE_KEY` | ⬜ 🔴 | OAuth tokens, alertas, costos, IA cache | Supabase → **Settings → API → service_role** |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Redirects OAuth | `http://localhost:3000` (dev) / `https://margify.app` (prod) |
| `CRON_SECRET` | ⬜ 🔴 | Alertas automáticas, sync, IA advisor cron | String aleatorio largo; mismo valor en Vercel |

### SQL en Supabase (una sola vez)

Ejecutá en **SQL Editor**:

1. `supabase/schema.sql` (opcional, legacy)
2. **`supabase/schema-v2.sql`** ← obligatorio (`user_integrations`, `user_costs`, `user_alerts_*`, `ai_recommendations`)

### Redirect URLs en Supabase Auth

Authentication → URL Configuration:

- `http://localhost:3000/auth/callback`
- `https://margify.app/auth/callback`

---

## Fase 1 — MVP con una tienda + dashboard real

| Variable | Estado | Para qué |
|----------|--------|----------|
| **TiendaNube** `TIENDANUBE_APP_ID` | ⬜ 🔴 | Conectar tienda |
| **TiendaNube** `TIENDANUBE_CLIENT_SECRET` | ⬜ 🔴 | OAuth |
| **TiendaNube** `TIENDANUBE_REDIRECT_URI` | ✅ (dev) | Debe coincidir con Partner Portal |
| **TiendaNube** `TIENDANUBE_USER_AGENT` | ✅ | Header obligatorio API |

**Alternativa:** Shopify (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_REDIRECT_URI`).

| Variable | Estado | Para qué |
|----------|--------|----------|
| `ANTHROPIC_API_KEY` | ✅ | IA Advisor con Claude |
| `OPENAI_API_KEY` | ⬜ | Chat Margify AI (producto aparte del Advisor) |

**Probar:** login → `/dashboard/integraciones` → conectar TiendaNube → dashboard con ventas reales.

---

## Fase 2 — Alertas

| Variable | Estado | Para qué |
|----------|--------|----------|
| `RESEND_API_KEY` | ⬜ | Emails de alerta |
| `RESEND_FROM_EMAIL` | ⬜ (default en .env.example) | Remitente |
| `WHATSAPP_API_TOKEN` | ⬜ | Meta Cloud API (no Twilio) |
| `WHATSAPP_PHONE_NUMBER_ID` | ⬜ | ID del número en Meta Business |
| `WHATSAPP_ALERT_TEMPLATE_NAME` | ⬜ (default `margify_alert`) | Plantilla aprobada en Meta |
| `CRON_SECRET` | ⬜ 🔴 | Cron `/api/cron/evaluate-alerts` (cada hora) |

---

## Fase 3 — Publicidad

| Plataforma | Variables | Estado |
|------------|-----------|--------|
| Meta Ads | `META_APP_ID`, `META_APP_SECRET` | ⬜ |
| Google Ads | `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN` | ⬜ |
| TikTok | `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET` | ⬜ |
| MercadoLibre ventas | `MERCADOLIBRE_APP_ID`, `MERCADOLIBRE_CLIENT_SECRET` | ⬜ |

Redirect OAuth en cada portal:

```
http://localhost:3000/api/auth/{meta|google|tiktok|mercadolibre|shopify|tiendanube}/callback
https://margify.app/api/auth/.../callback
```

---

## Fase 4 — Billing

| Variable | Estado | Para qué |
|----------|--------|----------|
| `DODO_PAYMENTS_API_KEY` | ✅ | Checkout Pro/Scale |
| `DODO_PAYMENTS_WEBHOOK_KEY` | ⬜ 🔴 | Webhook `https://margify.app/api/webhooks/dodo` |

---

## Fase 5 — Contacto (landing)

| Variable | Estado |
|----------|--------|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ✅ `59898323308` |

---

## Vercel — copiar todo lo de arriba

En **Project → Settings → Environment Variables**:

- Todas las de servidor **sin** prefijo `NEXT_PUBLIC_` → solo Production + Preview si aplica
- `NEXT_PUBLIC_*` → Production, Preview, Development
- En prod: `NEXT_PUBLIC_SITE_URL=https://margify.app`
- Redirect URIs de integraciones apuntando a **margify.app**, no localhost

Crons ya definidos en `vercel.json`:

- `/api/cron/evaluate-alerts` — cada hora
- `/api/cron/sync-data` — cada 6 h
- `/api/cron/ai-advisor` — cada 6 h

Requieren `CRON_SECRET` + `Authorization: Bearer {CRON_SECRET}`.

---

## Orden recomendado (MVP lo antes posible)

1. ⚠️ Corregir `NEXT_PUBLIC_SUPABASE_URL` y verificar **anon key** en Supabase
2. 🔴 `SUPABASE_SERVICE_ROLE_KEY` + ejecutar `schema-v2.sql`
3. 🔴 TiendaNube **o** Shopify (app + env + conectar en integraciones)
4. ✅ `ANTHROPIC_API_KEY` (ya tenés) — probar IA Advisor
5. 🔴 `CRON_SECRET` en Vercel
6. `RESEND_API_KEY` — alertas por email
7. Meta Ads — segunda integración visible
8. `DODO_PAYMENTS_WEBHOOK_KEY` — billing en prod
9. WhatsApp Meta — plan Pro+
10. Google / TikTok / ML — según prioridad comercial

---

## Verificación rápida local

```bash
npm run dev
```

| Prueba | URL / acción | Esperado |
|--------|----------------|----------|
| Registro | `/auth/register` | Usuario en Supabase Auth |
| Dashboard vacío | `/dashboard` (logueado, sin tienda) | Métricas en 0 |
| Demo | `/dashboard?demo=1` | Datos mock |
| Integraciones | `/dashboard/integraciones` | OAuth TiendaNube/Shopify |
| IA Advisor | `/dashboard` → card Margify AI | “Análisis generado con Claude” si key OK |
| Alertas | `/dashboard/alertas` → Guardar | Persiste si service role OK |

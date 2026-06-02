# Lo que tenés que hacer vos (Margify)

El código, scripts y `.env.local` base ya están listos. Esto **no lo puede hacer el agente** porque requiere tus cuentas y secretos.

Corré primero:

```bash
npm run check:env
```

Te marca qué falta. Después seguí esta lista en orden.

---

## 1. Supabase (15 min) — obligatorio

1. Entrá a [supabase.com/dashboard](https://supabase.com/dashboard) → proyecto **nglrsihpupnvysjsxwfy**.
2. **Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` (termina en `.supabase.co`)
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (JWT `eyJ…`, no service_role)
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
3. **Authentication → URL Configuration** → agregá:
   - `http://localhost:3000/auth/callback`
   - `https://margify.app/auth/callback`
4. **SQL Editor** → pegá y ejecutá todo `supabase/schema-v2.sql`.

**Probar:** `npm run dev` → `/auth/register` → usuario aparece en Authentication → Users.

---

## 2. TiendaNube o Shopify (30–60 min) — obligatorio para datos reales

### Opción A — TiendaNube

1. [partners.tiendanube.com](https://partners.tiendanube.com) → crear app.
2. Redirect URI:
   - Dev: `http://localhost:3000/api/auth/tiendanube/callback`
   - Prod: `https://margify.app/api/auth/tiendanube/callback`
3. En `.env.local`:
   ```
   TIENDANUBE_APP_ID=...
   TIENDANUBE_CLIENT_SECRET=...
   ```
4. Reiniciá `npm run dev` → login → **Integraciones** → Conectar TiendaNube.

### Opción B — Shopify

1. [partners.shopify.com](https://partners.shopify.com) → Create app.
2. Redirect: `http://localhost:3000/api/auth/shopify/callback` (+ prod en margify.app).
3. `SHOPIFY_API_KEY` + `SHOPIFY_API_SECRET` en `.env.local`.

**Probar:** dashboard con ventas ≠ 0.

---

## 3. Vercel / producción (20 min)

1. Subí el repo o conectá GitHub en Vercel.
2. **Settings → Environment Variables**: copiá **todas** las de `.env.local`.
3. En Production cambiá:
   - `NEXT_PUBLIC_SITE_URL=https://margify.app`
   - Redirect URIs de integraciones → `https://margify.app/api/auth/.../callback`
4. Mismo `CRON_SECRET` que en local (ya generado en tu `.env.local`).
5. Deploy.

---

## 4. Lo que ya está hecho en el repo (no hace falta que lo hagas)

- `CRON_SECRET` generado en `.env.local`
- URL Supabase corregida a formato API
- Redirect URIs de dev prellenados en `.env.local`
- Onboarding TiendaNube usa OAuth (no URL/token falso)
- Script `npm run check:env`
- Checklist: `docs/ENV-CHECKLIST.md`

---

## 5. Después del MVP (cuando quieras)

| Tarea | Dónde |
|-------|--------|
| Anthropic | Ya tenés key — probar IA Advisor en `/dashboard` |
| OpenAI | platform.openai.com → `OPENAI_API_KEY` → chat en `/dashboard/margify-ai` |
| Resend | resend.com → alertas email |
| WhatsApp alertas | Meta Business + plantilla `margify_alert` |
| Meta / Google / TikTok / ML ads | Developers de cada plataforma |
| Dodo webhook | Panel Dodo → `DODO_PAYMENTS_WEBHOOK_KEY` |

Detalle de cada una: sección correspondiente en la guía anterior del chat o `docs/ENV-CHECKLIST.md`.

---

## Comando útil

```bash
npm run check:env   # qué falta
npm run dev         # probar local
npm run build       # verificar que compila
```

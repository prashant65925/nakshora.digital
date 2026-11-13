# Vedashila Lifestyle Hub (`vedashila-lifestyle-hub`)

**Marketplace Pro — Everything You Love. One Smart Destination.**  
GitHub Owner: `prashantsharma659-collab` · Repository: `vedashila-lifestyle-hub`

> Note: This is an independent platform. `vedashila.in` is never used, and `https://vedashila.com` is integrated strictly as an external Factori.com merchant destination. Supplied Amazon reference `https://link.amazon/B0eJUJQ2I` is stored separately from verified Associates tracking credentials.

## Architecture Overview
- **Frontend (Marketplace Pro Theme)**: React 19, TypeScript, Tailwind CSS v4 (`Plus Jakarta Sans` + `Manrope` + `JetBrains Mono`), Vite, `vite-plugin-pwa` (installable PWA + offline fallback)
- **16-Section Marketplace Homepage & Catalogue**: Sticky 3-zone header, universal search + location selector + interactive category mega-menu, promotional hero carousel, 13+ configurable categories, Vedashila Direct & Vedashila.com featured products, Amazon discovery collection, Indore-only `Annapurna Orbit` grocery PIN verifier, verified deals, Gemini AI Saathi recommendations, real first-party trending search analytics (`/api/analytics/*`), buying guides, consent-verified newsletter (`/api/newsletter/subscribe`), abandoned direct-cart opt-in, and brand/category/merchant/sort/pagination catalogue filters
- **Backend API**: Express (`server.ts`, port `3000`) with server-side Gemini `@google/genai` (`gemini-4-hydrogen`), Razorpay SDK order creation, HMAC-SHA256 signature & webhook verification, rate limiting, and CSV/JSON feed validation
- **Firebase**: Cloud Firestore (strict 8-pillar `firestore.rules` + `firestore.indexes.json` + `firebase-blueprint.json`), Firebase Google Auth with RBAC (`/admins/{uid}` + bootstrapped super admin `prashantsharma659@gmail.com`)
- **Geographical Controls**: Annapurna Orbit groceries restricted strictly to Indore, MP with Firestore PIN-code serviceability lookup; all other shopping universes operate Pan-India

## How to Login to the Admin Console
1. Click **Admin Console** in the top utility bar or **Admin Console Login** in the footer (or visit `/admin` directly).
2. Click **Sign In with Google for Admin Console**.
3. Sign in with `prashantsharma659@gmail.com` (bootstrapped Super Admin) or any verified Google account whose Firebase UID is authorized inside the Admin **Security Centre** tab (`/admins/{uid}`).
4. Click **Initialize Firestore Catalogue** on the Overview tab to populate Firestore with universes, nested categories, product variants, merchants, affiliate links, and Indore PIN codes.

## Hostinger + Cloud Run / Firebase Deployment Guide
Hostinger shared hosting serves static builds (`dist/`), while Node.js APIs (`/api/ai/*`, `/api/razorpay/*`, `/api/imports/*`, `/api/newsletter/*`, `/api/analytics/*`) require Node.js hosting (Google Cloud Run or Hostinger Node VPS):
1. Configure environment variables from `.env.example` (`GEMINI_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, optional `FACTORI_API_ENDPOINT`, `AMAZON_PARTNER_TAG`).
2. Run `npm ci && npm test && npm run build`.
3. **Hostinger Shared Hosting (Static SPA)**: Upload `dist/` contents to `public_html/` and include a `.htaccess` SPA fallback:
   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```
   Deploy `server.ts` on Google Cloud Run (`npm start` on port `3000`) and reverse-proxy `/api/*` to the Cloud Run service.
4. **Hostinger VPS / Cloud Run Full-Stack**: Run `npm start` (`node server.ts`) on port `3000` behind HTTPS/Nginx.

## Verification Commands
- `npm run lint` — TypeScript typecheck (`tsc --noEmit`)
- `npm run lint:rules` — Firebase Security Rules ESLint validation
- `npm test` — Automated Marketplace Pro taxonomy, domain & commerce boundary tests (`tsx --test tests/marketplace.test.ts`)
- `npm run build` — Production Vite + PWA bundle

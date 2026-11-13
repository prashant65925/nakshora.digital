import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import Razorpay from 'razorpay';
import {
  buildAmazonAffiliateUrl,
  getIntegrationStatus,
  validateFeedRows,
} from './server/integrations.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(
  express.json({
    limit: '8mb',
    verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Sliding-window API rate limiter
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = rateBuckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }
    bucket.count += 1;
    next();
  };
}

// Persistent Affiliate Link Click & Impression Store
interface LinkMetric {
  impressions: number;
  clicks: number;
  lastEventAt?: string;
}
const metricsDir = path.join(__dirname, '.data');
const metricsFile = path.join(metricsDir, 'affiliate_metrics.json');
function readAffiliateMetrics(): Record<string, LinkMetric> {
  try {
    if (fs.existsSync(metricsFile)) {
      return JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    }
  } catch {
    // Fallback to empty metrics store
  }
  return {};
}
function writeAffiliateMetrics(data: Record<string, LinkMetric>) {
  try {
    if (!fs.existsSync(metricsDir)) fs.mkdirSync(metricsDir, { recursive: true });
    fs.writeFileSync(metricsFile, JSON.stringify(data, null, 2));
  } catch {
    // Non-fatal in read-only environments
  }
}

app.get('/api/affiliate/metrics', (_req, res) => {
  res.json({ metrics: readAffiliateMetrics() });
});

app.post('/api/affiliate/track', rateLimit(60, 60_000), (req, res) => {
  const { linkId, eventType = 'click' } = req.body || {};
  if (!linkId || typeof linkId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(linkId)) {
    return res.status(400).json({ error: 'Valid linkId is required.' });
  }
  const metrics = readAffiliateMetrics();
  const current = metrics[linkId] || { impressions: 0, clicks: 0 };
  if (eventType === 'impression') {
    current.impressions += 1;
  } else {
    current.clicks += 1;
    if (current.impressions < current.clicks) {
      current.impressions = current.clicks;
    }
  }
  current.lastEventAt = new Date().toISOString();
  metrics[linkId] = current;
  writeAffiliateMetrics(metrics);
  return res.json({ linkId, metric: current });
});

// Consent-verified Newsletter Signup & Real First-Party Search Analytics
const newsletterFile = path.join(metricsDir, 'newsletter_subscribers.json');
const searchAnalyticsFile = path.join(metricsDir, 'search_analytics.json');

function readJsonMap<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
    }
  } catch {
    // Fallback cleanly
  }
  return fallback;
}

function writeJsonMap(filePath: string, data: unknown) {
  try {
    if (!fs.existsSync(metricsDir)) fs.mkdirSync(metricsDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch {
    // Non-fatal in read-only environments
  }
}

app.post('/api/newsletter/subscribe', rateLimit(15, 60_000), (req, res) => {
  const { email, consent, city = 'Indore, MP', language = 'en' } = req.body || {};
  if (consent !== true) {
    return res.status(400).json({ error: 'Explicit opt-in consent is required.' });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 160) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  const normalized = email.trim().toLowerCase();
  const list = readJsonMap<{ email: string; city: string; language: string; consentedAt: string }[]>(newsletterFile, []);
  if (!list.some((item) => item.email === normalized)) {
    list.push({
      email: normalized,
      city: String(city).slice(0, 80),
      language: language === 'hi' ? 'hi' : 'en',
      consentedAt: new Date().toISOString(),
    });
    writeJsonMap(newsletterFile, list);
  }
  return res.json({ subscribed: true, message: 'Subscribed with verified consent.' });
});

app.get('/api/analytics/trending', (_req, res) => {
  const counts = readJsonMap<Record<string, { term: string; count: number; lastSearchedAt: string }>>(searchAnalyticsFile, {});
  const trending = Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  return res.json({ trending });
});

app.post('/api/analytics/search', rateLimit(60, 60_000), (req, res) => {
  const { query: rawTerm } = req.body || {};
  if (!rawTerm || typeof rawTerm !== 'string') {
    return res.status(400).json({ error: 'Search term is required.' });
  }
  const term = rawTerm.trim().slice(0, 80);
  if (term.length < 2) {
    return res.status(400).json({ error: 'Search term too short.' });
  }
  const key = term.toLowerCase();
  const counts = readJsonMap<Record<string, { term: string; count: number; lastSearchedAt: string }>>(searchAnalyticsFile, {});
  const current = counts[key] || { term, count: 0, lastSearchedAt: '' };
  current.count += 1;
  current.lastSearchedAt = new Date().toISOString();
  counts[key] = current;
  writeJsonMap(searchAnalyticsFile, counts);
  const trending = Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  return res.json({ trending });
});

// Gemini Server Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Razorpay Server Client (Direct Vedashila Lifestyle Hub Sales ONLY)
function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const configured = Boolean(keyId && keySecret);
  return { keyId, keySecret, webhookSecret, configured };
}

const processedWebhookIds = new Set<string>();

app.get('/api/health', (_req, res) => {
  const status = getIntegrationStatus();
  res.json({
    ok: true,
    geminiConfigured: status.geminiAi.enabled,
    razorpayConfigured: status.razorpayDirect.enabled,
    factoriConfigured: status.factoriApi.enabled,
    amazonApiConfigured: status.amazonAssociates.paApiEnabled,
    amazonPartnerTagConfigured: status.amazonAssociates.partnerTagConfigured,
    integrations: status,
  });
});

// Integration readiness report (booleans and safe status messages only; secrets stay strictly on backend)
app.get('/api/integrations/status', (_req, res) => {
  return res.json({ integrations: getIntegrationStatus() });
});

// Construct manual Amazon Associates affiliate links using verified AMAZON_PARTNER_TAG (no PA-API keys required)
app.post('/api/integrations/amazon/build-link', rateLimit(40, 60_000), (req, res) => {
  const { destinationUrl, partnerTag } = req.body || {};
  if (!destinationUrl || typeof destinationUrl !== 'string') {
    return res.status(400).json({ ok: false, error: 'destinationUrl is required.' });
  }
  const result = buildAmazonAffiliateUrl(
    destinationUrl,
    typeof partnerTag === 'string' ? partnerTag : undefined
  );
  if (!result.ok) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// Disabled API integration modules until valid credentials and permissions are configured
app.post('/api/integrations/factori/sync', rateLimit(10, 60_000), (_req, res) => {
  const status = getIntegrationStatus();
  if (!status.factoriApi.enabled) {
    return res.status(503).json({
      enabled: false,
      mode: status.factoriApi.mode,
      error: status.factoriApi.message,
    });
  }
  return res.status(501).json({
    enabled: true,
    error: 'Factori live sync requires explicit feed schema verification before activation.',
  });
});

app.post('/api/integrations/amazon/paapi-lookup', rateLimit(10, 60_000), (_req, res) => {
  const status = getIntegrationStatus();
  if (!status.amazonAssociates.paApiEnabled) {
    return res.status(503).json({
      enabled: false,
      mode: status.amazonAssociates.mode,
      error: status.amazonAssociates.message,
    });
  }
  return res.status(501).json({
    enabled: true,
    error: 'Amazon PA-API 5.0 signed request adapter requires verified Associates PA-API approval.',
  });
});

// 1. Vedashila AI Saathi — Conversational Shopping, Gift Finder, Grocery Assistant & Comparison
app.post('/api/ai/saathi', rateLimit(30, 60_000), async (req, res) => {
  try {
    const {
      message,
      language = 'en',
      city = 'Indore, MP',
      pincode = '',
      mode = 'chat',
      catalogueSummary = [],
      compareProductIds = [],
    } = req.body || {};

    if (!message || typeof message !== 'string' || message.length > 1200) {
      return res.status(400).json({ error: 'Please provide a valid query under 1200 characters.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server yet. Please configure GEMINI_API_KEY in Secrets.',
      });
    }

    const isIndore = city.toLowerCase().includes('indore');
    const safeCatalogue = Array.isArray(catalogueSummary) ? catalogueSummary.slice(0, 40) : [];

    const systemInstruction = `You are "Vedashila AI Saathi", the intelligent bilingual shopping assistant for Vedashila Lifestyle Hub (Vedashila Nakshatra).
Respond in ${language === 'hi' ? 'Hindi (Devanagari, warm and clear)' : 'English (clear, helpful, refined)'}.
Customer Location: ${city}${pincode ? ` (PIN: ${pincode})` : ''}. Mode: ${mode}.

STRICT HONESTY & COMPLIANCE RULES:
1. Only recommend products from the PROVIDED AUTHORIZED CATALOGUE JSON below, or clearly state when a category is available via an external merchant (Vedashila.com, Amazon.in, Blinkit Indore).
2. NEVER invent prices, ratings, discounts, stock counts, or delivery times. If priceVerified is false or priceInr is missing (such as Amazon or Blinkit items), explicitly say "Check live price and availability on the merchant site."
3. GROCERY GEOGRAPHIC RULE: Annapurna Orbit grocery shopping is ONLY available in Indore, MP. If the customer is NOT in Indore (${isIndore ? 'Customer IS in Indore' : 'Customer is OUTSIDE Indore'}), politely explain that grocery delivery is restricted to Indore only and recommend nationwide universes instead.
4. PAYMENT BOUNDARY: Only Vedashila Direct items use Razorpay checkout. External items (Vedashila.com, Amazon, Blinkit) redirect to the respective merchant.
5. Keep responses concise, structured, and helpful (under 220 words).`;

    const prompt = `Authorized Catalogue Snapshot:
${JSON.stringify(safeCatalogue)}
${compareProductIds.length ? `\nRequested Comparison IDs: ${JSON.stringify(compareProductIds)}` : ''}

Customer Query: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: 'Helpful assistant response in requested language.' },
            recommendedProductIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'IDs of matching products from the provided catalogue snapshot.',
            },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 short follow-up prompts.',
            },
          },
          required: ['reply', 'recommendedProductIds', 'suggestedFollowUps'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim());
    return res.json(parsed);
  } catch (error) {
    console.error('AI Saathi Error:', error);
    return res.status(500).json({ error: 'Unable to process AI Saathi request right now.' });
  }
});

// 2. Visual Product Discovery
app.post('/api/ai/visual-search', rateLimit(15, 60_000), async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', language = 'en', catalogueSummary = [] } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Image data is required for visual discovery.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured.' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const safeCatalogue = Array.isArray(catalogueSummary) ? catalogueSummary.slice(0, 40) : [];

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this uploaded product image and identify visually related items from this authorized catalogue ONLY. Never claim an exact brand/SKU match unless verified. Respond in ${language === 'hi' ? 'Hindi' : 'English'}. Catalogue: ${JSON.stringify(safeCatalogue)}`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualSummary: { type: Type.STRING },
            matchedProductIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            disclaimer: { type: Type.STRING },
          },
          required: ['visualSummary', 'matchedProductIds', 'disclaimer'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim());
    return res.json(parsed);
  } catch (error) {
    console.error('Visual Search Error:', error);
    return res.status(500).json({ error: 'Visual discovery failed. Please try a smaller JPEG or PNG image.' });
  }
});

// 3. AI Administrative Content & Catalogue Assistant (Drafts require admin approval)
app.post('/api/ai/admin-assist', rateLimit(20, 60_000), async (req, res) => {
  try {
    const { taskType, topic, rawContext = '' } = req.body || {};
    if (!taskType || !topic) {
      return res.status(400).json({ error: 'taskType and topic are required.' });
    }
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Admin Task: ${taskType}\nTopic: ${topic}\nContext: ${String(rawContext).slice(0, 3000)}\nGenerate original, accurate, non-hallucinated editorial/catalogue draft content. Never invent merchant partnerships, commission rates, or unverified prices.`,
      config: {
        systemInstruction:
          'You are the Vedashila Admin Content & Quality Assistant. Output a structured draft marked for mandatory human admin review before publication.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            excerpt: { type: Type.STRING },
            body: { type: Type.STRING },
            qualityNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['title', 'excerpt', 'body', 'qualityNotes'],
        },
      },
    });

    return res.json({
      requiresAdminApproval: true,
      draft: JSON.parse((response.text || '{}').trim()),
    });
  } catch (error) {
    console.error('Admin Assist Error:', error);
    return res.status(500).json({ error: 'AI Admin Assistant request failed.' });
  }
});

// 4. Razorpay Direct-Sales Order Creation (Direct Products ONLY)
app.post('/api/razorpay/create-order', rateLimit(20, 60_000), async (req, res) => {
  try {
    const { amountInr, receiptId, items = [] } = req.body || {};
    if (!amountInr || typeof amountInr !== 'number' || amountInr <= 0) {
      return res.status(400).json({ error: 'Valid INR amount is required.' });
    }
    // Enforce Direct-only checkout boundary
    const hasExternalItem = Array.isArray(items) && items.some((item) => item.purchaseMode === 'external');
    if (hasExternalItem) {
      return res.status(400).json({
        error: 'External merchant items (Amazon, Blinkit, Vedashila.com) cannot be processed through Razorpay.',
      });
    }

    const rzp = getRazorpayConfig();
    if (!rzp.configured) {
      return res.status(200).json({
        configured: false,
        message: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not configured in server environment.',
      });
    }

    const instance = new Razorpay({ key_id: rzp.keyId, key_secret: rzp.keySecret });
    const order = await instance.orders.create({
      amount: Math.round(amountInr * 100),
      currency: 'INR',
      receipt: String(receiptId || `vs_${Date.now()}`).slice(0, 40),
    });

    return res.json({
      configured: true,
      keyId: rzp.keyId,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    return res.status(500).json({ error: 'Failed to create Razorpay order.' });
  }
});

// 5. Razorpay Payment Signature Verification
app.post('/api/razorpay/verify-payment', rateLimit(30, 60_000), (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    const rzp = getRazorpayConfig();
    if (!rzp.configured) {
      return res.status(400).json({ verified: false, error: 'Razorpay credentials not configured on server.' });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: 'Missing payment verification parameters.' });
    }
    const generatedSignature = crypto
      .createHmac('sha256', rzp.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const verified = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf8'),
      Buffer.from(String(razorpay_signature), 'utf8')
    );

    if (!verified) {
      return res.status(400).json({ verified: false, error: 'Invalid Razorpay payment signature.' });
    }
    return res.json({ verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    return res.status(500).json({ verified: false, error: 'Verification error.' });
  }
});

// 6. Razorpay Webhook Endpoint (Idempotent + HMAC Verified)
app.post('/api/razorpay/webhook', (req: Request & { rawBody?: Buffer }, res) => {
  const rzp = getRazorpayConfig();
  const signature = req.headers['x-razorpay-signature'];
  if (!rzp.webhookSecret || !signature || !req.rawBody) {
    return res.status(400).json({ error: 'Webhook verification unavailable.' });
  }
  const expected = crypto.createHmac('sha256', rzp.webhookSecret).update(req.rawBody).digest('hex');
  if (expected !== String(signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature.' });
  }
  const eventId = String(req.headers['x-razorpay-event-id'] || req.body?.payload?.payment?.entity?.id || '');
  if (eventId && processedWebhookIds.has(eventId)) {
    return res.json({ status: 'duplicate_ignored' });
  }
  if (eventId) processedWebhookIds.add(eventId);
  return res.json({ status: 'verified', event: req.body?.event || 'unknown' });
});

// 7. Razorpay Server-Side Refund Processing
app.post('/api/razorpay/refund', rateLimit(10, 60_000), async (req, res) => {
  try {
    const { paymentId, amountInr } = req.body || {};
    const rzp = getRazorpayConfig();
    if (!rzp.configured) {
      return res.status(200).json({
        configured: false,
        message: 'Razorpay credentials not configured. Refund recorded for manual reconciliation.',
      });
    }
    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required for Razorpay refund.' });
    }
    const instance = new Razorpay({ key_id: rzp.keyId, key_secret: rzp.keySecret });
    const refund = await instance.payments.refund(paymentId, {
      amount: amountInr ? Math.round(Number(amountInr) * 100) : undefined,
    });
    return res.json({ configured: true, refundId: refund.id, status: refund.status });
  } catch (error) {
    console.error('Razorpay Refund Error:', error);
    return res.status(500).json({ error: 'Failed to initiate Razorpay refund.' });
  }
});

// 8. Authorized CSV / JSON Product Feed Validation & Duplicate Detection
app.post('/api/imports/validate', rateLimit(20, 60_000), (req, res) => {
  try {
    const {
      sourceType = 'json',
      rawContent = '',
      existingIds = [],
      amazonPartnerTag = '',
    } = req.body || {};
    if (!rawContent || typeof rawContent !== 'string') {
      return res.status(400).json({ error: 'Feed payload is required.' });
    }
    const result = validateFeedRows({
      sourceType: sourceType === 'csv' ? 'csv' : 'json',
      rawContent,
      existingIds: Array.isArray(existingIds) ? existingIds : [],
      amazonPartnerTag: typeof amazonPartnerTag === 'string' ? amazonPartnerTag : '',
    });
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid feed format.' });
  }
});

async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        ...(process.env.DISABLE_HMR === 'true' ? { hmr: false } : {}),
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Vedashila Lifestyle Hub server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

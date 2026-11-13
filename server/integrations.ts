export interface IntegrationStatusReport {
  manualCatalogue: {
    enabled: boolean;
    mode: 'firestore_csv_active';
    message: string;
  };
  factoriApi: {
    enabled: boolean;
    endpointConfigured: boolean;
    keyConfigured: boolean;
    optionalInDev: boolean;
    mode: 'api_enabled' | 'disabled_manual_only';
    message: string;
  };
  amazonAssociates: {
    paApiEnabled: boolean;
    partnerTagConfigured: boolean;
    accessKeyConfigured: boolean;
    secretKeyConfigured: boolean;
    optionalInDev: boolean;
    manualLinksEnabled: boolean;
    mode: 'pa_api_enabled' | 'partner_tag_manual_only' | 'manual_links_only';
    message: string;
  };
  razorpayDirect: {
    enabled: boolean;
    webhookConfigured: boolean;
    message: string;
  };
  geminiAi: {
    enabled: boolean;
    message: string;
  };
}

function isNonEmptyEnv(val: string | undefined, placeholder?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (placeholder && trimmed === placeholder) return false;
  return true;
}

export function getIntegrationStatus(env: NodeJS.ProcessEnv = process.env): IntegrationStatusReport {
  const factoriEndpoint = isNonEmptyEnv(env.FACTORI_API_ENDPOINT);
  const factoriKey = isNonEmptyEnv(env.FACTORI_API_KEY);
  const factoriEnabled = factoriEndpoint && factoriKey;

  const amazonPartnerTag = isNonEmptyEnv(env.AMAZON_PARTNER_TAG);
  const amazonAccessKey = isNonEmptyEnv(env.AMAZON_ACCESS_KEY);
  const amazonSecretKey = isNonEmptyEnv(env.AMAZON_SECRET_KEY);
  const amazonPaApiEnabled = amazonPartnerTag && amazonAccessKey && amazonSecretKey;

  const razorpayEnabled = isNonEmptyEnv(env.RAZORPAY_KEY_ID) && isNonEmptyEnv(env.RAZORPAY_KEY_SECRET);
  const razorpayWebhook = isNonEmptyEnv(env.RAZORPAY_WEBHOOK_SECRET);
  const geminiEnabled = isNonEmptyEnv(env.GEMINI_API_KEY, 'MY_GEMINI_API_KEY');

  return {
    manualCatalogue: {
      enabled: true,
      mode: 'firestore_csv_active',
      message:
        'Manual Firestore product catalogue, merchant links, and CSV/JSON import are active with no external API keys required.',
    },
    factoriApi: {
      enabled: factoriEnabled,
      endpointConfigured: factoriEndpoint,
      keyConfigured: factoriKey,
      optionalInDev: true,
      mode: factoriEnabled ? 'api_enabled' : 'disabled_manual_only',
      message: factoriEnabled
        ? 'Factori / Vedashila.com API credentials detected on backend.'
        : 'Factori API integration is disabled (FACTORI_API_ENDPOINT / FACTORI_API_KEY are optional during development). Use Manual Catalogue & CSV Import for Vedashila.com products.',
    },
    amazonAssociates: {
      paApiEnabled: amazonPaApiEnabled,
      partnerTagConfigured: amazonPartnerTag,
      accessKeyConfigured: amazonAccessKey,
      secretKeyConfigured: amazonSecretKey,
      optionalInDev: true,
      manualLinksEnabled: true,
      mode: amazonPaApiEnabled
        ? 'pa_api_enabled'
        : amazonPartnerTag
        ? 'partner_tag_manual_only'
        : 'manual_links_only',
      message: amazonPaApiEnabled
        ? 'Amazon PA-API credentials and AMAZON_PARTNER_TAG configured on backend.'
        : amazonPartnerTag
        ? 'AMAZON_PARTNER_TAG configured on backend for manual Amazon Associates links. Amazon PA-API (AMAZON_ACCESS_KEY / AMAZON_SECRET_KEY) remains disabled until credentials and permissions are provided.'
        : 'Amazon PA-API (AMAZON_ACCESS_KEY / AMAZON_SECRET_KEY) is optional and disabled. Add your verified AMAZON_PARTNER_TAG in environment or Admin Merchant settings to tag manual Amazon Associates links.',
    },
    razorpayDirect: {
      enabled: razorpayEnabled,
      webhookConfigured: razorpayWebhook,
      message: razorpayEnabled
        ? 'Razorpay direct checkout credentials configured on backend.'
        : 'Razorpay credentials not configured yet. Direct orders save in awaiting_payment state until configured.',
    },
    geminiAi: {
      enabled: geminiEnabled,
      message: geminiEnabled
        ? 'Gemini API configured on backend for Vedashila AI Saathi.'
        : 'GEMINI_API_KEY not configured yet. Storefront and manual catalogue remain fully operational.',
    },
  };
}

export interface AmazonLinkBuildResult {
  ok: boolean;
  taggedUrl?: string;
  tagApplied?: string;
  source?: 'server_env' | 'admin_tag' | 'shortlink_preserved';
  note?: string;
  error?: string;
}

const AMAZON_FULL_HOSTS = new Set([
  'amazon.in',
  'www.amazon.in',
  'm.amazon.in',
  'amazon.com',
  'www.amazon.com',
]);

const AMAZON_SHORT_HOSTS = new Set(['amzn.to', 'link.amazon', 'amzn.in']);

export function buildAmazonAffiliateUrl(
  rawUrl: string,
  partnerTagOverride?: string,
  env: NodeJS.ProcessEnv = process.env
): AmazonLinkBuildResult {
  const trimmedUrl = (rawUrl || '').trim();
  if (!trimmedUrl) {
    return { ok: false, error: 'Please enter an Amazon product or store URL.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmedUrl);
  } catch {
    return { ok: false, error: 'Invalid URL format. Expected https://www.amazon.in/...' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: 'Only https:// URLs are permitted.' };
  }

  const host = parsed.hostname.toLowerCase();
  const isFullAmazonHost = AMAZON_FULL_HOSTS.has(host) || host.endsWith('.amazon.in') || host.endsWith('.amazon.com');
  const isShortAmazonHost = AMAZON_SHORT_HOSTS.has(host);

  if (!isFullAmazonHost && !isShortAmazonHost) {
    return {
      ok: false,
      error: 'URL must belong to an Amazon domain (e.g. amazon.in, amazon.com, amzn.to, or link.amazon).',
    };
  }

  const envTag = (env.AMAZON_PARTNER_TAG || '').trim();
  const overrideTag = (partnerTagOverride || '').trim();
  const effectiveTag = envTag || overrideTag;
  const source: 'server_env' | 'admin_tag' = envTag ? 'server_env' : 'admin_tag';

  if (isShortAmazonHost) {
    return {
      ok: true,
      taggedUrl: parsed.toString(),
      tagApplied: effectiveTag || undefined,
      source: 'shortlink_preserved',
      note: 'Shortened Amazon referral links are preserved verbatim so tracking redirects are not altered. Use a full https://www.amazon.in/dp/... URL to append ?tag= automatically.',
    };
  }

  if (!effectiveTag) {
    return {
      ok: false,
      error:
        'No verified AMAZON_PARTNER_TAG found in server environment or Admin Merchant settings. Enter your verified Partner Tag first (no PA-API access keys needed).',
    };
  }

  if (!/^[a-zA-Z0-9_-]{2,40}$/.test(effectiveTag)) {
    return {
      ok: false,
      error: 'Invalid AMAZON_PARTNER_TAG format. Expected alphanumeric/hyphen tag such as mystore-21.',
    };
  }

  parsed.protocol = 'https:';
  parsed.searchParams.set('tag', effectiveTag);

  return {
    ok: true,
    taggedUrl: parsed.toString(),
    tagApplied: effectiveTag,
    source,
    note:
      source === 'server_env'
        ? 'Applied server AMAZON_PARTNER_TAG cleanly without PA-API credentials.'
        : 'Applied verified Partner Tag without PA-API credentials.',
  };
}

/**
 * RFC-4180 compliant CSV parser supporting quoted values, embedded commas, and escaped double quotes.
 */
export function parseCsvRows(rawCsv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const text = rawCsv.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentField = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += ch;
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);

  if (rows.length < 2) {
    throw new Error('CSV must contain a header row and at least one product row.');
  }

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cols) => {
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) record[h] = (cols[idx] ?? '').trim();
    });
    return record;
  });
}

export interface ValidateFeedInput {
  sourceType: 'json' | 'csv';
  rawContent: string;
  existingIds?: string[];
  amazonPartnerTag?: string;
}

export function validateFeedRows(
  input: ValidateFeedInput,
  env: NodeJS.ProcessEnv = process.env
) {
  const { sourceType = 'json', rawContent = '', existingIds = [], amazonPartnerTag = '' } = input;
  const seen = new Set<string>(Array.isArray(existingIds) ? existingIds : []);
  let rows: Record<string, unknown>[] = [];

  if (sourceType === 'json') {
    const parsed = JSON.parse(rawContent);
    rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.products) ? parsed.products : [];
  } else {
    rows = parseCsvRows(rawContent);
  }

  const validProducts: Record<string, unknown>[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let duplicatesSkipped = 0;

  const allowedRights = new Set(['owned', 'licensed', 'merchant_permitted', 'pending_review']);
  const today = new Date().toISOString().slice(0, 10);

  rows.slice(0, 250).forEach((row, idx) => {
    const rowNum = idx + 1;
    const rawId = String(row.id || `manual_${Date.now()}_${rowNum}`).trim();
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
    if (!id) {
      errors.push(`Row ${rowNum}: invalid product id.`);
      return;
    }

    const titleEn = String(row.titleEn || row.title || '').trim();
    if (!titleEn) {
      errors.push(`Row ${rowNum}: missing titleEn/title.`);
      return;
    }

    if (seen.has(id)) {
      duplicatesSkipped += 1;
      return;
    }

    const purchaseMode = row.purchaseMode === 'direct' ? 'direct' : 'external';
    const merchantId = String(row.merchantId || (purchaseMode === 'direct' ? 'vedashila-direct' : 'vedashila-com')).trim();

    let externalUrl = String(row.externalUrl || '').trim();
    if (purchaseMode === 'external') {
      if (!externalUrl || !/^https?:\/\//i.test(externalUrl)) {
        errors.push(`Row ${rowNum} ("${titleEn}"): external products require an explicit https:// merchant link (externalUrl).`);
        return;
      }
      if (merchantId === 'amazon-associates-in') {
        const tagged = buildAmazonAffiliateUrl(externalUrl, amazonPartnerTag, env);
        if (tagged.ok && tagged.taggedUrl) {
          externalUrl = tagged.taggedUrl;
        }
      }
    } else if (externalUrl && !/^https?:\/\//i.test(externalUrl)) {
      errors.push(`Row ${rowNum}: unsafe non-https URL blocked.`);
      return;
    }

    let parsedPrice: number | undefined;
    if (row.priceInr !== undefined && row.priceInr !== null && String(row.priceInr).trim() !== '') {
      const numeric = Number(String(row.priceInr).replace(/,/g, ''));
      if (!Number.isFinite(numeric) || numeric <= 0) {
        errors.push(`Row ${rowNum} ("${titleEn}"): priceInr must be a positive number when provided.`);
        return;
      }
      parsedPrice = numeric;
    }

    if (purchaseMode === 'direct' && parsedPrice === undefined) {
      errors.push(`Row ${rowNum} ("${titleEn}"): direct Razorpay products require a verified numeric priceInr.`);
      return;
    }

    const requestedPriceVerified = row.priceVerified === true || String(row.priceVerified).toLowerCase() === 'true';
    // Never treat external Amazon/Blinkit prices as verified locally
    const priceVerified =
      purchaseMode === 'direct'
        ? parsedPrice !== undefined
        : merchantId === 'amazon-associates-in' || merchantId === 'blinkit-indore'
        ? false
        : requestedPriceVerified && parsedPrice !== undefined;

    const rawImage = String(row.imageUrl || '').trim();
    let safeImageUrl = '';
    if (rawImage) {
      if (/^(https?:\/\/|\/src\/assets\/|\/assets\/|\/brand\/)/i.test(rawImage)) {
        safeImageUrl = rawImage.slice(0, 500);
      } else {
        errors.push(`Row ${rowNum} ("${titleEn}"): imageUrl must be https:// or a local /src/assets/ path.`);
        return;
      }
    } else {
      warnings.push(`Row ${rowNum} ("${titleEn}"): no imageUrl supplied — will render fallback card until an authorized image is added.`);
    }

    const rawRights = String(row.imageRightsStatus || '').trim();
    const imageRightsStatus = allowedRights.has(rawRights)
      ? rawRights
      : safeImageUrl
      ? 'merchant_permitted'
      : 'pending_review';

    const universeId = String(row.universeId || 'vastra-mandala').trim();
    const indoreOnly =
      row.indoreOnly === true ||
      String(row.indoreOnly).toLowerCase() === 'true' ||
      universeId === 'annapurna-orbit';

    seen.add(id);

    const productRecord: Record<string, unknown> = {
      id,
      titleEn: titleEn.slice(0, 180),
      titleHi: String(row.titleHi || titleEn).trim().slice(0, 180),
      brand: String(row.brand || '').trim().slice(0, 80) || 'Vedashila Hub',
      descriptionEn: String(
        row.descriptionEn || 'Authorized manual catalogue entry imported via Vedashila Admin Console.'
      )
        .trim()
        .slice(0, 2000),
      descriptionHi: String(
        row.descriptionHi || 'वेदशिला एडमिन कंसोल द्वारा जोड़ा गया अधिकृत उत्पाद।'
      )
        .trim()
        .slice(0, 2000),
      universeId,
      categoryId: String(row.categoryId || 'sarees-ethnic').trim(),
      merchantId,
      purchaseMode,
      priceVerified,
      indoreOnly,
      imageUrl: safeImageUrl,
      imageRightsStatus,
      contentPermissions: String(
        row.contentPermissions || 'Authorized manual admin entry'
      )
        .trim()
        .slice(0, 240),
      lastUpdated: String(row.lastUpdated || today).slice(0, 40),
      status: 'pending_approval',
      isFixture: false,
    };

    if (externalUrl) {
      productRecord.externalUrl = externalUrl.slice(0, 500);
    }
    if (parsedPrice !== undefined) {
      productRecord.priceInr = parsedPrice;
    }

    validProducts.push(productRecord);
  });

  return {
    totalRows: rows.length,
    validRows: validProducts.length,
    duplicatesSkipped,
    errors,
    warnings,
    preview: validProducts,
  };
}

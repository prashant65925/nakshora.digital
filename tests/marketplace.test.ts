import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_AFFILIATE_LINKS,
  INITIAL_CATEGORIES,
  INITIAL_MERCHANTS,
  INITIAL_PRODUCTS,
  INITIAL_SERVICE_AREAS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_UNIVERSES,
  INITIAL_VARIANTS,
} from '../src/data/seedData';
import {
  buildAmazonAffiliateUrl,
  getIntegrationStatus,
  parseCsvRows,
  validateFeedRows,
} from '../server/integrations.ts';

test('Marketplace Pro taxonomy contains 7 universes and all 13+ configurable categories', () => {
  assert.equal(INITIAL_UNIVERSES.length, 7);
  const topLevel = INITIAL_CATEGORIES.filter((c) => !c.parentCategoryId);
  assert.ok(topLevel.length >= 13, `Expected at least 13 top-level categories, got ${topLevel.length}`);
  assert.ok(INITIAL_CATEGORIES.some((c) => Boolean(c.parentCategoryId)), 'Expected nested subcategories');
});

test('Prohibited domain vedashila.in never appears in seed data or settings', () => {
  const serialized = JSON.stringify({
    INITIAL_MERCHANTS,
    INITIAL_PRODUCTS,
    INITIAL_AFFILIATE_LINKS,
    INITIAL_SYSTEM_SETTINGS,
  }).toLowerCase();
  assert.equal(serialized.includes('vedashila.in'), false);
});

test('Amazon reference link is preserved separately without fabricated price or verified tracking ID', () => {
  const amazonMerchant = INITIAL_MERCHANTS.find((m) => m.id === 'amazon-associates-in');
  assert.ok(amazonMerchant);
  assert.equal(amazonMerchant.suppliedReferenceLink, 'https://link.amazon/B0eJUJQ2I');
  assert.equal(amazonMerchant.verifiedTrackingId, '');
  assert.equal(amazonMerchant.partnershipClaimed, false);

  const amazonProducts = INITIAL_PRODUCTS.filter((p) => p.merchantId === 'amazon-associates-in');
  assert.ok(amazonProducts.length >= 2);
  for (const p of amazonProducts) {
    assert.equal(p.purchaseMode, 'external');
    assert.equal(p.priceVerified, false);
    assert.equal(p.priceInr, undefined);
  }
});

test('Indore grocery serviceability & direct Razorpay boundary are enforced in fixtures', () => {
  assert.ok(INITIAL_SERVICE_AREAS.every((area) => area.city === 'Indore'));
  const directProducts = INITIAL_PRODUCTS.filter((p) => p.purchaseMode === 'direct');
  assert.ok(directProducts.length > 0);
  for (const p of directProducts) {
    assert.equal(p.priceVerified, true);
    assert.equal(typeof p.priceInr, 'number');
  }
  assert.ok(INITIAL_VARIANTS.length >= 4);
});

test('Optional Factori and Amazon PA-API credentials keep API modules disabled without blocking startup', () => {
  const statusNoCreds = getIntegrationStatus({});
  assert.equal(statusNoCreds.manualCatalogue.enabled, true);
  assert.equal(statusNoCreds.factoriApi.enabled, false);
  assert.equal(statusNoCreds.factoriApi.optionalInDev, true);
  assert.equal(statusNoCreds.factoriApi.mode, 'disabled_manual_only');
  assert.equal(statusNoCreds.amazonAssociates.paApiEnabled, false);
  assert.equal(statusNoCreds.amazonAssociates.manualLinksEnabled, true);
  assert.equal(statusNoCreds.amazonAssociates.mode, 'manual_links_only');

  const statusTagOnly = getIntegrationStatus({ AMAZON_PARTNER_TAG: 'vedashila-21' });
  assert.equal(statusTagOnly.amazonAssociates.partnerTagConfigured, true);
  assert.equal(statusTagOnly.amazonAssociates.paApiEnabled, false);
  assert.equal(statusTagOnly.amazonAssociates.mode, 'partner_tag_manual_only');
});

test('Amazon Associates affiliate link builder applies AMAZON_PARTNER_TAG without PA-API keys', () => {
  const fullResult = buildAmazonAffiliateUrl(
    'https://www.amazon.in/dp/B0EJUJQ2I',
    undefined,
    { AMAZON_PARTNER_TAG: 'vedashila-21' }
  );
  assert.equal(fullResult.ok, true);
  assert.equal(fullResult.taggedUrl, 'https://www.amazon.in/dp/B0EJUJQ2I?tag=vedashila-21');
  assert.equal(fullResult.tagApplied, 'vedashila-21');

  const shortResult = buildAmazonAffiliateUrl(
    'https://link.amazon/B0eJUJQ2I',
    'vedashila-21',
    {}
  );
  assert.equal(shortResult.ok, true);
  assert.equal(shortResult.taggedUrl, 'https://link.amazon/B0eJUJQ2I');
  assert.equal(shortResult.source, 'shortlink_preserved');
});

test('RFC-4180 CSV parser & manual feed validator never invent prices or external URLs', () => {
  const csv = [
    'id,titleEn,descriptionEn,universeId,categoryId,merchantId,purchaseMode,externalUrl,priceInr,imageUrl',
    'csv-direct-01,"Brass Diya, Hammered","Crafted in Moradabad, India",griha-galaxy,furniture-decor,vedashila-direct,direct,,1850,/src/assets/images/hero_nakshatra_luxury_1794542199176.jpg',
    'csv-amz-01,"Amazon Echo Dot","Smart speaker, Alexa built-in",tech-tara,audio-wearables,amazon-associates-in,external,https://www.amazon.in/dp/B09B8XJDW5,,',
    'csv-bad-ext,"Missing Link Item","No URL provided",vastra-mandala,sarees-ethnic,vedashila-com,external,,,',
  ].join('\n');

  const parsedRows = parseCsvRows(csv);
  assert.equal(parsedRows.length, 3);
  assert.equal(parsedRows[0].titleEn, 'Brass Diya, Hammered');

  const validated = validateFeedRows(
    { sourceType: 'csv', rawContent: csv, existingIds: [] },
    { AMAZON_PARTNER_TAG: 'vedashila-21' }
  );
  assert.equal(validated.validRows, 2);
  assert.equal(validated.errors.length, 1);

  const amzItem = validated.preview.find((p) => p.id === 'csv-amz-01');
  assert.ok(amzItem);
  assert.equal(amzItem.externalUrl, 'https://www.amazon.in/dp/B09B8XJDW5?tag=vedashila-21');
  assert.equal(amzItem.priceVerified, false);
  assert.equal('priceInr' in amzItem, false);
  assert.equal(amzItem.imageUrl, '');
  assert.equal(amzItem.imageRightsStatus, 'pending_review');
});

test('BreadcrumbNavigation dynamically builds hierarchy across universe, nested categories, and product views', async () => {
  const { buildBreadcrumbTrail } = await import('../src/components/BreadcrumbNavigation.tsx');
  const nestedCat = INITIAL_CATEGORIES.find((c) => Boolean(c.parentCategoryId));
  assert.ok(nestedCat, 'Expected at least one nested category in seed data');
  const parentCat = INITIAL_CATEGORIES.find((c) => c.id === nestedCat.parentCategoryId);
  assert.ok(parentCat, 'Expected parent category for nested category');

  const sampleProduct = {
    ...INITIAL_PRODUCTS[0],
    universeId: nestedCat.universeId,
    categoryId: nestedCat.id,
  };

  const productTrail = buildBreadcrumbTrail({
    view: 'product',
    language: 'en',
    universes: INITIAL_UNIVERSES,
    categories: INITIAL_CATEGORIES,
    merchants: INITIAL_MERCHANTS,
    selectedUniverseId: null,
    selectedCategoryId: null,
    selectedMerchantId: null,
    activeProduct: sampleProduct,
  });

  assert.equal(productTrail[0].label, 'Home');
  assert.equal(productTrail[1].label, 'Marketplace');
  assert.equal(productTrail[3].label, parentCat.nameEn);
  assert.equal(productTrail[4].label, nestedCat.nameEn);
  assert.equal(productTrail[5].label, sampleProduct.titleEn);
  assert.equal(productTrail[5].isCurrent, true);
  assert.equal(productTrail[3].target?.categoryId, parentCat.id);
  assert.equal(productTrail[4].target?.categoryId, nestedCat.id);

  // Catalogue with only selectedCategoryId infers Universe + Parent > Child chain
  const catalogueTrail = buildBreadcrumbTrail({
    view: 'catalogue',
    language: 'en',
    universes: INITIAL_UNIVERSES,
    categories: INITIAL_CATEGORIES,
    merchants: INITIAL_MERCHANTS,
    selectedUniverseId: null,
    selectedCategoryId: nestedCat.id,
    selectedMerchantId: null,
    activeProduct: null,
  });

  const inferredUniverse = INITIAL_UNIVERSES.find((u) => u.id === nestedCat.universeId);
  assert.ok(inferredUniverse);
  assert.equal(catalogueTrail.map((c) => c.label).join(' > '), [
    'Home',
    'Marketplace',
    inferredUniverse.nameEn,
    parentCat.nameEn,
    nestedCat.nameEn,
  ].join(' > '));
  assert.equal(catalogueTrail.at(-1)?.isCurrent, true);

  // Indore grocery ignores unrelated stale category IDs
  const groceryTrail = buildBreadcrumbTrail({
    view: 'indore-grocery',
    language: 'en',
    universes: INITIAL_UNIVERSES,
    categories: INITIAL_CATEGORIES,
    merchants: INITIAL_MERCHANTS,
    selectedUniverseId: 'annapurna-orbit',
    selectedCategoryId: nestedCat.universeId !== 'annapurna-orbit' ? nestedCat.id : null,
    selectedMerchantId: null,
    activeProduct: null,
  });
  assert.equal(groceryTrail.length, 3);
  assert.equal(groceryTrail[0].label, 'Home');
  assert.equal(groceryTrail[1].label, 'Marketplace');
  assert.equal(groceryTrail[2].isCurrent, true);

  // Hindi labels and orders flow
  const ordersTrailHi = buildBreadcrumbTrail({
    view: 'orders',
    language: 'hi',
    universes: INITIAL_UNIVERSES,
    categories: INITIAL_CATEGORIES,
    merchants: INITIAL_MERCHANTS,
    selectedUniverseId: null,
    selectedCategoryId: null,
    selectedMerchantId: null,
    activeProduct: null,
  });
  assert.equal(ordersTrailHi.length, 3);
  assert.equal(ordersTrailHi[0].label, 'होम');
  assert.equal(ordersTrailHi[1].target?.view, 'cart');
  assert.equal(ordersTrailHi[2].isCurrent, true);
});


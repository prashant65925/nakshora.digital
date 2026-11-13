import React, { useState } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  LayoutGrid,
  LifeBuoy,
  Mail,
  MapPin,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Banner,
  BlogPost,
  Category,
  LanguageCode,
  Merchant,
  Offer,
  Product,
  RouteView,
  ServiceArea,
  Universe,
} from '../types/hub';
import { ResilientImage, VedashilaCompactMark, VedashilaFullLogo } from './BrandMark';
import { ProductCard } from './ProductCard';
import { t } from '../lib/i18n';

interface MarketplaceHomeProps {
  language: LanguageCode;
  city: string;
  isIndore: boolean;
  pincodeInput: string;
  onChangePincode: (pin: string) => void;
  onVerifyPincode: (pin?: string) => void;
  checkedPinResult: {
    checked: boolean;
    serviceable: boolean;
    locality: string;
    note: string;
  } | null;
  banners: Banner[];
  universes: Universe[];
  categories: Category[];
  merchants: Merchant[];
  products: Product[];
  offers: Offer[];
  blogPosts: BlogPost[];
  serviceAreas: ServiceArea[];
  wishlistIds: string[];
  trendingSearches: { term: string; count: number; lastSearchedAt: string }[];
  abandonedCartOptIn: boolean;
  onToggleAbandonedCartOptIn: (val: boolean) => void;
  onNavigate: (view: RouteView) => void;
  onSelectCategory: (universeId: string, categoryId: string) => void;
  onSelectMerchant: (merchantId: string) => void;
  onRunSearch: (query: string) => void;
  onOpenAiSaathi: () => void;
  onOpenProduct: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onAddDirectToCart: (product: Product) => void;
  onTrackOutboundClick: (product: Product) => void;
}

const SLIDE_IMAGES = [
  '/src/assets/images/hero_nakshatra_luxury_1794542199176.jpg',
  '/src/assets/images/universe_tech_tara_1794542200408.jpg',
  '/src/assets/images/universe_annapurna_indore_1794542200407.jpg',
];

export const MarketplaceHome: React.FC<MarketplaceHomeProps> = ({
  language,
  city,
  isIndore,
  pincodeInput,
  onChangePincode,
  onVerifyPincode,
  checkedPinResult,
  banners,
  categories,
  merchants,
  products,
  offers,
  blogPosts,
  wishlistIds,
  trendingSearches,
  abandonedCartOptIn,
  onToggleAbandonedCartOptIn,
  onNavigate,
  onSelectCategory,
  onSelectMerchant,
  onRunSearch,
  onOpenAiSaathi,
  onOpenProduct,
  onToggleWishlist,
  onAddDirectToCart,
  onTrackOutboundClick,
}) => {
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [slideIdx, setSlideIdx] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [newsletterBusy, setNewsletterBusy] = useState(false);

  const activeBanners = banners.filter((b) => b.active);
  const currentBanner = activeBanners[slideIdx % Math.max(activeBanners.length, 1)];

  const topCategories = categories
    .filter((c) => c.active && !c.parentCategoryId)
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));

  const publishedProducts = products.filter((p) => {
    if (p.status !== 'published') return false;
    const merchant = merchants.find((m) => m.id === p.merchantId);
    if (merchant && merchant.status === 'disabled_emergency') return false;
    if (p.indoreOnly && !isIndore) return false;
    return true;
  });

  const featuredVedashila = publishedProducts.filter(
    (p) => p.merchantId === 'vedashila-direct' || p.merchantId === 'vedashila-com'
  );
  const amazonCollection = publishedProducts.filter((p) => p.merchantId === 'amazon-associates-in');
  const indoreGroceryProducts = products.filter(
    (p) => p.status === 'published' && p.universeId === 'annapurna-orbit'
  );
  const visibleOffers = offers.filter((o) => o.active && (!o.indoreOnly || isIndore));
  const topVerifiedOffer = visibleOffers.find((o) => o.verified);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterStatus(null);
    if (!newsletterConsent) {
      setNewsletterStatus({
        ok: false,
        text: 'Please tick the opt-in consent box before subscribing.',
      });
      return;
    }
    setNewsletterBusy(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail.trim(),
          consent: true,
          city,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to subscribe right now.');
      }
      setNewsletterEmail('');
      setNewsletterConsent(false);
      setNewsletterStatus({ ok: true, text: data.message || 'Subscribed with verified consent.' });
    } catch (err) {
      setNewsletterStatus({
        ok: false,
        text: err instanceof Error ? err.message : 'Subscription failed.',
      });
    } finally {
      setNewsletterBusy(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. Verified Announcement Bar */}
      {announcementVisible && (
        <div className="rounded-xl bg-[#073D35] text-[#FFFFFF] px-4 py-2.5 flex items-center justify-between gap-3 text-xs border border-[#C89A45]/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="w-4 h-4 text-[#F47D79] shrink-0" />
            <p className="truncate">
              {topVerifiedOffer
                ? `${topVerifiedOffer.title}${topVerifiedOffer.code ? ` · Code: ${topVerifiedOffer.code}` : ''}`
                : 'VEDASHILA · SHOP MORE ✦ LIVE BEAUTIFULLY'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('offers')}
              className="font-semibold text-[#C89A45] hover:underline whitespace-nowrap"
            >
              {language === 'hi' ? 'ऑफ़र देखें' : 'View Verified Deals'}
            </button>
            <button
              type="button"
              onClick={() => setAnnouncementVisible(false)}
              aria-label="Dismiss announcement"
              className="p-1 rounded hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Official Homepage Brand Hero & Promotional Carousel */}
      <section className="rounded-2xl overflow-hidden border border-[#C89A45]/35 bg-[#073D35] text-[#FFFFFF]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="p-1.5 rounded-xl bg-[#F6EDE2] border border-[#C89A45]/50 shrink-0 shadow-xs">
                  <VedashilaFullLogo variant="lockup" className="w-16 h-14 object-contain" />
                </div>
                <div>
                  <p className="font-display text-lg sm:text-xl font-bold tracking-wide text-[#FFFFFF]">
                    VEDASHILA
                  </p>
                  <p className="text-xs font-semibold tracking-widest uppercase text-[#C89A45]">
                    SHOP MORE ✦ LIVE BEAUTIFULLY
                  </p>
                </div>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance leading-[1.1]">
                {currentBanner ? currentBanner.title : t(language, 'heroTitle')}
              </h1>
              <p className="text-sm sm:text-base text-[#F8F2E8]/85 max-w-2xl leading-relaxed">
                {currentBanner ? currentBanner.subtitle : t(language, 'heroSubtitle')}
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('catalogue')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C89A45] text-[#073D35] font-bold text-sm hover:opacity-95 transition-opacity"
                >
                  <span>{t(language, 'exploreCatalogue')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onOpenAiSaathi}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-[#C89A45]/55 text-white text-sm font-semibold hover:bg-white/10"
                >
                  <Sparkles className="w-4 h-4 text-[#C89A45]" />
                  <span>{t(language, 'openAiSaathi')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('indore-grocery')}
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#0E574C] border border-white/20 text-white text-sm font-semibold hover:border-[#C89A45]"
                >
                  <MapPin className="w-4 h-4 text-[#F47D79]" />
                  <span>{t(language, 'navGrocery')}</span>
                </button>
              </div>

              {activeBanners.length > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-white/15">
                  <div className="flex items-center gap-2">
                    {activeBanners.map((b, i) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSlideIdx(i)}
                        aria-label={`Slide ${i + 1}: ${b.title}`}
                        className={`h-2 rounded-full transition-all ${
                          i === slideIdx % activeBanners.length ? 'w-7 bg-[#C89A45]' : 'w-2 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIdx((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
                      }
                      aria-label="Previous slide"
                      className="p-1.5 rounded-lg border border-white/20 hover:border-[#C89A45]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideIdx((prev) => (prev + 1) % activeBanners.length)}
                      aria-label="Next slide"
                      className="p-1.5 rounded-lg border border-white/20 hover:border-[#C89A45]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 min-h-[260px] lg:min-h-[380px] bg-[#042621]">
            <ResilientImage
              src={SLIDE_IMAGES[slideIdx % SLIDE_IMAGES.length]}
              alt={currentBanner?.title || 'VEDASHILA Lifestyle Hub Marketplace Pro'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 6. Shop by Category (13+ Configurable Categories) */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45] mb-1">
              {language === 'hi' ? 'कॉन्फ़िगर करने योग्य श्रेणियाँ' : 'Shop by Category'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#073D35] dark:text-white">
              {language === 'hi' ? 'सभी मार्केटप्लेस श्रेणियाँ' : 'Explore Marketplace Categories'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('universes')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#073D35] dark:text-[#C89A45] hover:underline"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{language === 'hi' ? 'सभी देखें' : 'All Universes'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {topCategories.map((cat) => {
            const isGrocery = cat.universeId === 'annapurna-orbit';
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.universeId, cat.id)}
                className="group text-left rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] overflow-hidden hover:border-[#C89A45] transition-colors flex flex-col"
              >
                <div className="aspect-[16/10] w-full bg-[#F8F2E8] dark:bg-[#071A17] overflow-hidden">
                  <ResilientImage
                    src={cat.imageUrl || '/src/assets/images/hero_nakshatra_luxury_1794542199176.jpg'}
                    alt={language === 'hi' ? cat.nameHi : cat.nameEn}
                    fallbackTitle={language === 'hi' ? cat.nameHi : cat.nameEn}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                  <p className="font-semibold text-sm text-[#252525] dark:text-white group-hover:text-[#073D35] dark:group-hover:text-[#C89A45] line-clamp-1">
                    {language === 'hi' ? cat.nameHi : cat.nameEn}
                  </p>
                  <p className="text-[11px] text-[#252525]/65 dark:text-[#F8F2E8]/65 line-clamp-1">
                    {isGrocery ? 'Indore, MP Only' : 'Pan-India'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. Featured Vedashila Products (Direct Hub + Vedashila.com) */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7323] dark:text-[#C89A45] mb-1">
              {language === 'hi' ? 'वेदशिला डायरेक्ट और Vedashila.com' : 'Vedashila Direct & Storefront Editions'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#073D35] dark:text-white">
              {language === 'hi' ? 'प्रमुख वेदशिला उत्पाद' : 'Featured Vedashila Products'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('catalogue')}
            className="text-sm font-semibold text-[#073D35] dark:text-[#C89A45] hover:underline whitespace-nowrap"
          >
            View Catalogue ({publishedProducts.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredVedashila.slice(0, 6).map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              merchant={merchants.find((m) => m.id === p.merchantId)}
              language={language}
              isWishlisted={wishlistIds.includes(p.id)}
              onToggleWishlist={onToggleWishlist}
              onOpenProduct={onOpenProduct}
              onAddDirectToCart={onAddDirectToCart}
              onTrackOutboundClick={onTrackOutboundClick}
            />
          ))}
        </div>
      </section>

      {/* 8. Amazon Affiliate Product Collection */}
      <section className="p-6 sm:p-8 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/25 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7323] dark:text-[#C89A45]">
              Amazon India Discovery · External Affiliate Reference
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#073D35] dark:text-white">
              Amazon Curated Electronics & Accessories
            </h2>
            <p className="text-xs text-[#252525]/75 dark:text-[#F8F2E8]/75 max-w-2xl">
              Linked to supplied Amazon reference (<code>https://link.amazon/B0eJUJQ2I</code>). Live pricing, star ratings, stock, and delivery promises are shown strictly on Amazon.in.
            </p>
          </div>
          <a
            href="https://link.amazon/B0eJUJQ2I"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold whitespace-nowrap self-start"
          >
            <span>Explore Amazon Reference</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {amazonCollection.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              merchant={merchants.find((m) => m.id === p.merchantId)}
              language={language}
              isWishlisted={wishlistIds.includes(p.id)}
              onToggleWishlist={onToggleWishlist}
              onOpenProduct={onOpenProduct}
              onAddDirectToCart={onAddDirectToCart}
              onTrackOutboundClick={onTrackOutboundClick}
            />
          ))}
        </div>
      </section>

      {/* 9. Indore Grocery Discovery (Annapurna Orbit) */}
      <section className="p-6 sm:p-8 rounded-2xl border border-[#073D35]/20 dark:border-[#C89A45]/25 bg-gradient-to-br from-[#073D35]/8 via-[#FFFFFF] to-[#F8F2E8] dark:from-[#0E2924] dark:via-[#071A17] dark:to-[#0E2924] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45]">
              Annapurna Orbit · Indore, MP Exclusive
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#073D35] dark:text-white">
              Indore Smart Grocery & Pantry Discovery
            </h2>
            <p className="text-sm text-[#252525]/80 dark:text-[#F8F2E8]/80">
              {isIndore
                ? 'Verify your Indore PIN code below to inspect eligible grocery discovery merchants (Blinkit, Zepto & BigBasket adapters).'
                : 'Grocery discovery is strictly restricted to Indore, MP. Switch your city to Indore, MP to verify serviceability or manage a grocery shopping list.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('indore-grocery')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold"
            >
              <ShoppingBasket className="w-4 h-4" />
              <span>Open Indore Grocery Hub</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('shopping-lists')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#073D35]/20 dark:border-white/20 text-xs font-semibold hover:border-[#C89A45]"
            >
              <span>Grocery List Planner</span>
            </button>
          </div>
        </div>

        {isIndore && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onVerifyPincode();
              }}
              className="flex flex-col sm:flex-row gap-2.5 max-w-lg"
            >
              <input
                type="text"
                maxLength={6}
                value={pincodeInput}
                onChange={(e) => onChangePincode(e.target.value)}
                placeholder={t(language, 'pincodePlaceholder')}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#071A17] font-mono-num text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold"
              >
                {t(language, 'checkPincode')}
              </button>
            </form>

            {checkedPinResult && (
              <p className="text-xs font-medium text-[#073D35] dark:text-[#C89A45]">
                {checkedPinResult.locality} — {checkedPinResult.note}
              </p>
            )}

            {indoreGroceryProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {indoreGroceryProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    merchant={merchants.find((m) => m.id === p.merchantId)}
                    language={language}
                    isWishlisted={wishlistIds.includes(p.id)}
                    onToggleWishlist={onToggleWishlist}
                    onOpenProduct={onOpenProduct}
                    onAddDirectToCart={onAddDirectToCart}
                    onTrackOutboundClick={onTrackOutboundClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 10. Shop by Merchant */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45] mb-1">
              Multi-Store Transparency
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#073D35] dark:text-white">
              Shop by Verified Storefront & Adapter
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('affiliate-disclosure')}
            className="text-xs font-semibold text-[#9F7323] dark:text-[#C89A45] hover:underline"
          >
            View Affiliate & Merchant Disclosure →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {merchants.slice(0, 4).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMerchant(m.id)}
              className="text-left p-5 rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] hover:border-[#C89A45] transition-colors space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <Store className="w-4 h-4 text-[#C89A45]" />
                <span className="font-semibold text-[#073D35] dark:text-[#C89A45]">
                  {m.indoreOnly ? 'Indore Only' : 'Pan-India'}
                </span>
              </div>
              <p className="font-semibold text-sm text-[#073D35] dark:text-white">{m.name}</p>
              <p className="text-xs text-[#252525]/70 dark:text-[#F8F2E8]/70 line-clamp-2">
                {language === 'hi' ? m.descriptionHi : m.descriptionEn}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 11. Verified Offers & Deals */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F47D79] mb-1">
              No Unverified Discounts
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#073D35] dark:text-white">
              Verified Offers & Merchant Privileges
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('offers')}
            className="text-sm font-semibold text-[#073D35] dark:text-[#C89A45] hover:underline"
          >
            All Offers →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleOffers.map((o) => (
            <div
              key={o.id}
              className="p-5 rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#073D35] dark:text-[#C89A45]">
                    <Tag className="w-3.5 h-3.5 text-[#F47D79]" />
                    {o.verified ? 'Verified Direct Offer' : 'External Merchant Notice'}
                  </span>
                  <span className="font-mono-num text-[#252525]/60 dark:text-[#F8F2E8]/60">
                    Valid till {o.expiresAt}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#073D35] dark:text-white">{o.title}</h3>
                <p className="text-xs text-[#252525]/75 dark:text-[#F8F2E8]/75">{o.description}</p>
              </div>
              {o.code && (
                <p className="font-mono-num text-xs font-bold text-[#9F7323] dark:text-[#C89A45]">
                  Direct Checkout Code: {o.code}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 12. VEDASHILA AI SAATHI & 13. Trending Searches */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#073D35] text-white space-y-4 border border-[#C89A45]/35">
          <div className="flex items-center gap-2.5 text-[#C89A45] text-xs font-semibold uppercase tracking-wider">
            <VedashilaCompactMark className="w-7 h-7 border border-[#C89A45]/50" />
            <span>VEDASHILA AI SAATHI · Concierge Discovery</span>
          </div>
          <h2 className="font-display text-2xl font-bold">
            Smart Recommendations via VEDASHILA AI SAATHI
          </h2>
          <p className="text-sm text-[#F8F2E8]/85">
            Compare products factually, get occasion gift ideas, or discover handloom and tech items strictly grounded in our active catalogue.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              'Festive silk sarees under ₹5,000',
              'Ayurvedic gift box ideas',
              'Compare Direct Hub vs Vedashila.com',
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onOpenAiSaathi()}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-[#C89A45] hover:text-[#073D35] text-xs font-medium transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenAiSaathi}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C89A45] text-[#073D35] text-xs font-bold"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch VEDASHILA AI SAATHI</span>
          </button>
        </div>

        <div className="lg:col-span-5 p-6 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/25 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45]">
              <TrendingUp className="w-4 h-4" />
              <span>Trending Searches (Live Analytics)</span>
            </div>
            <Flame className="w-4 h-4 text-[#F47D79]" />
          </div>

          {trendingSearches.length === 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-[#252525]/70 dark:text-[#F8F2E8]/70">
                No customer search queries recorded yet — we never fabricate trending metrics. Try searching above or click a starter query to record live analytics:
              </p>
              <div className="flex flex-wrap gap-2">
                {['Banarasi Saree', 'Kumkumadi Serum', 'Indore Saffron', 'ANC Headphones'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => onRunSearch(term)}
                    className="px-3 py-1.5 rounded-lg border border-[#073D35]/15 dark:border-white/15 text-xs font-medium hover:border-[#C89A45]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((item) => (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => onRunSearch(item.term)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#073D35]/15 dark:border-white/15 bg-[#F8F2E8] dark:bg-[#071A17] text-xs font-medium hover:border-[#C89A45]"
                >
                  <span>{item.term}</span>
                  <span className="font-mono-num text-[11px] text-[#073D35] dark:text-[#C89A45] font-semibold">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 14. Shopping Guides & Blog */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45] mb-1">
              Editorial Buying Intelligence
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#073D35] dark:text-white">
              Shopping Guides & Craft Stories
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('guides')}
            className="text-sm font-semibold text-[#073D35] dark:text-[#C89A45] hover:underline"
          >
            Read All Guides →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {blogPosts.slice(0, 2).map((post) => (
            <article
              key={post.id}
              className="p-6 rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-2.5"
            >
              <div className="flex items-center gap-2 text-xs text-[#9F7323] dark:text-[#C89A45] font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{post.universeId}</span>
                <span>·</span>
                <span>{post.updatedAt}</span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#073D35] dark:text-white">{post.title}</h3>
              <p className="text-xs text-[#252525]/75 dark:text-[#F8F2E8]/75 leading-relaxed">{post.excerpt}</p>
              <button
                type="button"
                onClick={() => onNavigate('guides')}
                className="text-xs font-semibold text-[#073D35] dark:text-[#C89A45] hover:underline pt-1"
              >
                Read Guide →
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* 15. Customer Support, Trust & Consent-Based Newsletter + Abandoned Cart Opt-In */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45]">
            <Mail className="w-4 h-4" />
            <span>Consent-Based Newsletter & Launch Alerts</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-white">
            Get Verified Direct Drops & Indore Grocery Updates
          </h2>
          <form onSubmit={handleNewsletterSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#073D35]/15 dark:border-white/20 bg-[#F8F2E8] dark:bg-[#071A17] text-sm"
              />
              <button
                type="submit"
                disabled={newsletterBusy}
                className="px-5 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-sm font-bold disabled:opacity-50"
              >
                {newsletterBusy ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            <label className="flex items-start gap-2 text-xs text-[#252525]/75 dark:text-[#F8F2E8]/75">
              <input
                type="checkbox"
                checked={newsletterConsent}
                onChange={(e) => setNewsletterConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I explicitly consent to receive curated product updates from Vedashila Lifestyle Hub in compliance with Indian DPDP privacy standards.
              </span>
            </label>
          </form>
          {newsletterStatus && (
            <p
              className={`text-xs font-medium flex items-center gap-1.5 ${
                newsletterStatus.ok ? 'text-[#073D35] dark:text-[#C89A45]' : 'text-[#F47D79]'
              }`}
            >
              {newsletterStatus.ok && <CheckCircle2 className="w-4 h-4" />}
              {newsletterStatus.text}
            </p>
          )}
        </div>

        <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9F7323] dark:text-[#C89A45]">
              <Bell className="w-4 h-4 text-[#F47D79]" />
              <span>Direct Cart Reminders & Helpdesk</span>
            </div>
            <h3 className="font-display text-xl font-bold text-[#073D35] dark:text-white">
              Need Assistance or Cart Reminders?
            </h3>
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8F2E8] dark:bg-[#071A17] text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={abandonedCartOptIn}
                onChange={(e) => onToggleAbandonedCartOptIn(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Opt in to gentle in-app Direct Cart reminders when Razorpay checkout items remain unpurchased.
              </span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('support')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Customer Support</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('refund-policy')}
              className="px-4 py-2.5 rounded-xl border border-[#073D35]/20 dark:border-white/20 text-xs font-semibold hover:border-[#C89A45]"
            >
              7-Day Direct Return Policy
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

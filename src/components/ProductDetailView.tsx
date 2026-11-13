import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Share2,
  ShoppingBag,
  Check,
  MapPin,
  MessageCircle,
  Layers,
} from 'lucide-react';
import { Category, LanguageCode, Merchant, Product, ProductVariant, Universe } from '../types/hub';
import { ResilientImage } from './BrandMark';
import { ProductCard } from './ProductCard';
import { t } from '../lib/i18n';

interface ProductDetailViewProps {
  product: Product;
  merchant?: Merchant;
  universe?: Universe;
  variants: ProductVariant[];
  allProducts: Product[];
  allMerchants: Merchant[];
  categories: Category[];
  wishlistIds: string[];
  language: LanguageCode;
  isWishlisted: boolean;
  onBack: () => void;
  onToggleWishlist: (id: string) => void;
  onAddDirectToCart: (product: Product, variant?: ProductVariant) => void;
  onTrackOutboundClick: (product: Product) => void;
  onOpenProduct: (product: Product) => void;
  onSelectCategory: (universeId: string, categoryId: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  merchant,
  universe,
  variants,
  allProducts,
  allMerchants,
  categories,
  wishlistIds,
  language,
  isWishlisted,
  onBack,
  onToggleWishlist,
  onAddDirectToCart,
  onTrackOutboundClick,
  onOpenProduct,
  onSelectCategory,
}) => {
  const [copied, setCopied] = useState(false);
  const productVariants = variants.filter((v) => v.productId === product.id);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(productVariants[0]?.id || '');

  useEffect(() => {
    const first = variants.find((v) => v.productId === product.id);
    setSelectedVariantId(first?.id || '');
  }, [product.id, variants]);

  const activeVariant = productVariants.find((v) => v.id === selectedVariantId);
  const title = language === 'hi' ? product.titleHi : product.titleEn;
  const description = language === 'hi' ? product.descriptionHi : product.descriptionEn;
  const isDirect = product.purchaseMode === 'direct';

  const effectivePriceInr =
    product.priceVerified && typeof product.priceInr === 'number'
      ? product.priceInr + (activeVariant?.priceDeltaInr || 0)
      : undefined;

  const shareUrl = `${window.location.origin}/?product=${product.id}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore cancelled share dialog
    }
  };

  const similarProducts = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.status === 'published' &&
        (p.categoryId === product.categoryId || p.universeId === product.universeId)
    )
    .slice(0, 3);

  const relatedCategories = categories
    .filter((c) => c.active && c.universeId === product.universeId)
    .slice(0, 6);

  return (
    <div className="space-y-12">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#252525]/75 dark:text-[#F8F2E8]/80 hover:text-[#C89A45]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Sticky Product Image */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 rounded-2xl overflow-hidden border border-[#073D35]/15 dark:border-[#C89A45]/25 aspect-[4/3] bg-[#FFFFFF] dark:bg-[#0E2924]">
          <ResilientImage src={product.imageUrl} alt={title} fallbackTitle={title} />
        </div>

        {/* Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6 p-6 md:p-8 rounded-2xl border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-[#FFFFFF] dark:bg-[#0E2924]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#073D35] dark:text-[#5FD1B8]">
            {product.brand && (
              <>
                <span className="text-[#9F7323] dark:text-[#C89A45]">{product.brand}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{universe ? (language === 'hi' ? universe.nameHi : universe.nameEn) : product.universeId}</span>
            <span aria-hidden="true">·</span>
            <span>{merchant?.name || product.merchantId}</span>
            {product.indoreOnly && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-[#073D35] dark:text-[#C89A45]">
                  <MapPin className="w-3.5 h-3.5" />
                  Indore Exclusive
                </span>
              </>
            )}
          </div>

          <h1 className="font-display text-3xl font-bold text-[#073D35] dark:text-[#FFFFFF]">
            {title}
          </h1>

          <div className="pt-3 border-t border-[#073D35]/10 dark:border-white/10">
            {effectivePriceInr !== undefined ? (
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono-num text-2xl font-bold text-[#073D35] dark:text-[#C89A45]">
                  ₹{effectivePriceInr.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#252525]/65 dark:text-[#F8F2E8]/65">
                  Inclusive of applicable taxes
                </span>
              </div>
            ) : (
              <p className="text-sm font-medium text-[#9F7323] dark:text-[#C89A45]">
                Live price, offers, and delivery availability are verified directly on {merchant?.name || 'the merchant website'}.
              </p>
            )}
          </div>

          {/* Product Variant Selector */}
          {productVariants.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#252525]/70 dark:text-[#F8F2E8]/70 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#073D35] dark:text-[#C89A45]" />
                Select Edition / Variant
              </p>
              <div className="space-y-2">
                {productVariants.map((v) => {
                  const selected = v.id === activeVariant?.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!v.inStock}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                        selected
                          ? 'border-[#C89A45] bg-[#C89A45]/12 font-semibold'
                          : 'border-[#073D35]/15 dark:border-white/15 hover:border-[#C89A45]'
                      }`}
                    >
                      <span>{v.label}</span>
                      <span className="font-mono-num text-[#073D35] dark:text-[#C89A45] shrink-0">
                        {v.priceDeltaInr === 0 ? 'Standard' : `+₹${v.priceDeltaInr.toLocaleString('en-IN')}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-sm leading-relaxed text-[#252525]/85 dark:text-[#F8F2E8]/85">{description}</p>

          {(product.attributes || product.lastUpdated || product.contentPermissions) && (
            <dl className="grid grid-cols-2 gap-3 pt-3 border-t border-[#073D35]/10 dark:border-white/10 text-xs">
              {product.attributes &&
                Object.entries(product.attributes).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[#252525]/60 dark:text-[#F8F2E8]/60">{k}</dt>
                    <dd className="font-medium mt-0.5">{v}</dd>
                  </div>
                ))}
              {product.lastUpdated && (
                <div>
                  <dt className="text-[#252525]/60 dark:text-[#F8F2E8]/60">Last Updated</dt>
                  <dd className="font-mono-num font-medium mt-0.5">{product.lastUpdated}</dd>
                </div>
              )}
              {product.contentPermissions && (
                <div className="col-span-2">
                  <dt className="text-[#252525]/60 dark:text-[#F8F2E8]/60">Content & Imagery Rights</dt>
                  <dd className="font-medium mt-0.5">{product.contentPermissions}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="flex flex-wrap gap-2.5 pt-2">
            {isDirect ? (
              <button
                type="button"
                onClick={() => onAddDirectToCart(product, activeVariant)}
                className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] font-bold text-sm hover:opacity-90"
              >
                <ShoppingBag className="w-4 h-4" />
                {t(language, 'buyDirect')}
              </button>
            ) : (
              <a
                href={product.externalUrl || merchant?.baseUrl || '#'}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => onTrackOutboundClick(product)}
                className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] font-bold text-sm hover:opacity-90"
              >
                <span>{t(language, 'visitMerchant')}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              aria-label="Save to wishlist"
              className="px-3.5 py-3 rounded-xl border border-[#073D35]/20 dark:border-white/20 inline-flex items-center justify-center hover:border-[#F47D79]"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#F47D79] text-[#F47D79]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              aria-label="Share product"
              className="px-3.5 py-3 rounded-xl border border-[#073D35]/20 dark:border-white/20 inline-flex items-center justify-center hover:border-[#C89A45]"
            >
              {copied ? <Check className="w-4 h-4 text-[#073D35] dark:text-[#C89A45]" /> : <Share2 className="w-4 h-4" />}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
              className="px-3.5 py-3 rounded-xl border border-[#073D35]/35 dark:border-[#C89A45]/40 text-[#073D35] dark:text-[#C89A45] inline-flex items-center justify-center hover:bg-[#073D35] hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>

          {!isDirect && (
            <p className="text-xs text-[#252525]/70 dark:text-[#F8F2E8]/70 leading-relaxed pt-2 border-t border-[#073D35]/10 dark:border-white/10">
              {t(language, 'affiliateNote')}
            </p>
          )}
        </div>
      </div>

      {/* Similar Products & Related Categories */}
      {similarProducts.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[#073D35]/10 dark:border-white/10">
          <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-white">
            Similar Products in This Collection
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                merchant={allMerchants.find((m) => m.id === p.merchantId)}
                language={language}
                isWishlisted={wishlistIds.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
                onOpenProduct={onOpenProduct}
                onAddDirectToCart={(prod) => onAddDirectToCart(prod)}
                onTrackOutboundClick={onTrackOutboundClick}
              />
            ))}
          </div>
        </section>
      )}

      {relatedCategories.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-[#073D35]/10 dark:border-white/10">
          <h3 className="font-display text-lg font-bold text-[#073D35] dark:text-white">
            Related Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {relatedCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.universeId, cat.id)}
                className="px-3.5 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-[#FFFFFF] dark:bg-[#0E2924] text-xs font-medium hover:border-[#C89A45]"
              >
                {language === 'hi' ? cat.nameHi : cat.nameEn}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

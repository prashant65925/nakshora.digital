import React from 'react';
import { Heart, ExternalLink, ShoppingBag, MapPin } from 'lucide-react';
import { LanguageCode, Merchant, Product } from '../types/hub';
import { ResilientImage } from './BrandMark';
import { t } from '../lib/i18n';

interface ProductCardProps {
  product: Product;
  merchant?: Merchant;
  language: LanguageCode;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onOpenProduct: (product: Product) => void;
  onAddDirectToCart: (product: Product) => void;
  onTrackOutboundClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  merchant,
  language,
  isWishlisted,
  onToggleWishlist,
  onOpenProduct,
  onAddDirectToCart,
  onTrackOutboundClick,
}) => {
  const title = language === 'hi' ? product.titleHi : product.titleEn;
  const isDirect = product.purchaseMode === 'direct';

  return (
    <article className="group flex flex-col rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] bg-[#F8F2E8] dark:bg-[#071A17] overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenProduct(product)}
          className="w-full h-full block text-left focus-visible:outline-2 focus-visible:outline-[#C89A45]"
          aria-label={title}
        >
          <ResilientImage
            src={product.imageUrl}
            alt={title}
            fallbackTitle={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-[#FFFFFF]/95 dark:bg-[#073D35]/95 border border-[#073D35]/15 dark:border-[#C89A45]/30 flex items-center justify-center text-[#252525] dark:text-[#F8F2E8] hover:text-[#F47D79] transition-colors"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#F47D79] text-[#F47D79]' : ''}`} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Clean unboxed metadata per Zero-Pill rule */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#252525]/70 dark:text-[#F8F2E8]/75 mb-1.5">
          {product.brand && (
            <>
              <span className="font-semibold text-[#073D35] dark:text-[#C89A45]">{product.brand}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span className="truncate max-w-[140px]">{merchant?.name || product.merchantId}</span>
          <span aria-hidden="true">·</span>
          <span className={isDirect ? 'text-[#073D35] dark:text-[#5FD1B8] font-semibold' : 'text-[#9F7323] dark:text-[#C89A45] font-semibold'}>
            {isDirect ? t(language, 'directCheckoutBadge') : t(language, 'externalMerchantBadge')}
          </span>
          {product.indoreOnly && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-0.5 text-[#073D35] dark:text-[#C89A45] font-medium">
                <MapPin className="w-3 h-3" />
                Indore
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenProduct(product)}
          className="text-left font-display font-semibold text-base text-[#252525] dark:text-[#FFFFFF] hover:text-[#073D35] dark:hover:text-[#C89A45] transition-colors line-clamp-2 mb-3"
        >
          {title}
        </button>

        <div className="mt-auto pt-3 border-t border-[#073D35]/10 dark:border-white/10 flex items-center justify-between gap-3">
          <div>
            {product.priceVerified && typeof product.priceInr === 'number' ? (
              <span className="font-mono-num text-base font-bold text-[#073D35] dark:text-[#C89A45]">
                ₹{product.priceInr.toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="text-xs font-medium text-[#252525]/70 dark:text-[#F8F2E8]/75">
                {language === 'hi' ? 'मर्चेंट साइट पर मूल्य देखें' : 'Check live price on merchant'}
              </span>
            )}
          </div>

          {isDirect ? (
            <button
              type="button"
              onClick={() => onAddDirectToCart(product)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#073D35] text-[#FFFFFF] dark:bg-[#C89A45] dark:text-[#073D35] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {t(language, 'buyDirect')}
            </button>
          ) : (
            <a
              href={product.externalUrl || merchant?.baseUrl || '#'}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => onTrackOutboundClick(product)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#073D35]/25 dark:border-[#C89A45]/40 text-[#073D35] dark:text-[#F8F2E8] hover:border-[#C89A45] hover:text-[#9F7323] dark:hover:text-[#C89A45] transition-colors whitespace-nowrap shrink-0"
            >
              <span>{language === 'hi' ? 'खरीदें' : 'Visit'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

import React, { useState } from 'react';
import { Store } from 'lucide-react';

/**
 * Official responsive horizontal VEDASHILA logo for Desktop and Mobile headers.
 * Derived directly from the original uploaded VEDASHILA artwork without altering
 * typography, illustration, or colors.
 */
export const VedashilaHeaderLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center shrink-0 ${className}`}>
    {/* Desktop / Tablet horizontal lockup (Emblem + VEDASHILA + SHOP MORE ✦ LIVE BEAUTIFULLY) */}
    <picture className="hidden sm:inline-block">
      <source srcSet="/assets/brand/vedashila-header-lockup.webp" type="image/webp" />
      <img
        src="/assets/brand/vedashila-header-lockup.png"
        alt="VEDASHILA — Shop More, Live Beautifully"
        referrerPolicy="no-referrer"
        className="h-11 md:h-12 w-auto object-contain rounded-lg"
      />
    </picture>

    {/* Mobile compact lockup (Emblem + crisp VEDASHILA wordmark) */}
    <picture className="inline-block sm:hidden">
      <source srcSet="/assets/brand/vedashila-mobile-lockup.webp" type="image/webp" />
      <img
        src="/assets/brand/vedashila-mobile-lockup.png"
        alt="VEDASHILA"
        referrerPolicy="no-referrer"
        className="h-9 w-auto object-contain rounded-md"
      />
    </picture>
  </span>
);

/**
 * Compact square emblem crop of the official VEDASHILA artwork for icons,
 * AI Saathi badge, and small UI containers where full text would be unreadable.
 */
export const VedashilaCompactMark: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <picture className="inline-flex shrink-0">
    <source srcSet="/assets/brand/vedashila-mark-compact.webp" type="image/webp" />
    <img
      src="/assets/brand/vedashila-mark-compact.png"
      alt="VEDASHILA Brand Emblem"
      referrerPolicy="no-referrer"
      className={`${className} object-contain rounded-lg bg-[#F6EDE2]`}
    />
  </picture>
);

/**
 * Full official VEDASHILA brand logo (original square artwork or lockup without trust strip)
 * for About Us, Footer, and hero branding showcase.
 */
export const VedashilaFullLogo: React.FC<{
  variant?: 'original' | 'lockup';
  className?: string;
}> = ({ variant = 'lockup', className = 'w-full max-w-xs h-auto' }) => {
  const webpSrc =
    variant === 'original' ? '/assets/brand/vedashila-logo-full.webp' : '/assets/brand/vedashila-lockup.webp';
  const fallbackSrc =
    variant === 'original'
      ? '/assets/aistudio/WhatsApp_Image_2026-10-08_at_10.41.41_AM_1d7a3a47.jpeg'
      : '/assets/brand/vedashila-lockup.png';

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={fallbackSrc}
        alt="VEDASHILA — Shop More ✦ Live Beautifully Official Brand Logo"
        referrerPolicy="no-referrer"
        className={`${className} object-contain rounded-xl bg-[#F6EDE2]`}
      />
    </picture>
  );
};

/**
 * Official VEDASHILA email and printable invoice header banner.
 */
export const VedashilaInvoiceHeader: React.FC<{ className?: string }> = ({ className = 'w-full max-w-md h-auto' }) => (
  <img
    src="/assets/brand/vedashila-invoice-header.png"
    alt="VEDASHILA — Official Order & Invoice Header"
    referrerPolicy="no-referrer"
    className={`${className} object-contain rounded-lg bg-[#F6EDE2]`}
  />
);

export const ResilientImage: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}> = ({ src, alt, className = 'w-full h-full object-cover', fallbackTitle }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F8F2E8] via-[#FFFFFF] to-[#EFE5D6] dark:from-[#0E2924] dark:via-[#071A17] dark:to-[#133831] p-6 text-center">
        <Store className="w-8 h-8 text-[#C89A45] mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium text-[#252525]/75 dark:text-[#F8F2E8]/80 line-clamp-2">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

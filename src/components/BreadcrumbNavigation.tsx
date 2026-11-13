import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import {
  Category,
  LanguageCode,
  Merchant,
  Product,
  RouteView,
  Universe,
} from '../types/hub';

export interface BreadcrumbTarget {
  view: RouteView;
  universeId?: string | null;
  categoryId?: string | null;
  merchantId?: string | null;
  clearSearch?: boolean;
  clearProduct?: boolean;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  target?: BreadcrumbTarget;
  isCurrent: boolean;
}

export interface BuildBreadcrumbParams {
  view: RouteView;
  language: LanguageCode;
  universes: Universe[];
  categories: Category[];
  merchants: Merchant[];
  selectedUniverseId: string | null;
  selectedCategoryId: string | null;
  selectedMerchantId: string | null;
  activeProduct: Product | null;
  searchQuery?: string;
}

const VIEW_LABELS: Record<
  Exclude<RouteView, 'home' | 'catalogue' | 'merchant' | 'universes' | 'indore-grocery' | 'orders'>,
  { en: string; hi: string }
> = {
  about: { en: 'About Us', hi: 'हमारे बारे में' },
  product: { en: 'Product Details', hi: 'उत्पाद विवरण' },
  offers: { en: 'Verified Deals & Offers', hi: 'सत्यापित ऑफ़र' },
  'ai-saathi': { en: 'VEDASHILA AI SAATHI', hi: 'वेदशिला AI साथी' },
  wishlist: { en: 'Wishlist', hi: 'पसंदीदा सूची' },
  'shopping-lists': { en: 'Shopping Lists', hi: 'खरीदारी सूचियाँ' },
  cart: { en: 'Direct Cart', hi: 'डायरेक्ट कार्ट' },
  profile: { en: 'Account Profile', hi: 'खाता प्रोफ़ाइल' },
  guides: { en: 'Buying Guides', hi: 'खरीदारी गाइड' },
  support: { en: 'Customer Support', hi: 'ग्राहक सहायता' },
  privacy: { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  terms: { en: 'Terms & Conditions', hi: 'नियम और शर्तें' },
  'affiliate-disclosure': { en: 'Affiliate Disclosure', hi: 'एफिलिएट प्रकटीकरण' },
  'refund-policy': { en: 'Refund & Cancellation Policy', hi: 'रिफंड और रद्दीकरण नीति' },
  admin: { en: 'Admin Console', hi: 'एडमिन कंसोल' },
};

function resolveCategoryChain(categories: Category[], leafCategoryId: string | null): Category[] {
  if (!leafCategoryId) return [];
  const chain: Category[] = [];
  const visited = new Set<string>();
  let currentId: string | undefined = leafCategoryId;
  let guard = 0;

  while (currentId && !visited.has(currentId) && guard < 12) {
    visited.add(currentId);
    const found = categories.find((c) => c.id === currentId);
    if (!found) break;
    chain.unshift(found);
    currentId = found.parentCategoryId;
    guard += 1;
  }

  return chain;
}

export function buildBreadcrumbTrail({
  view,
  language,
  universes,
  categories,
  merchants,
  selectedUniverseId,
  selectedCategoryId,
  selectedMerchantId,
  activeProduct,
  searchQuery = '',
}: BuildBreadcrumbParams): BreadcrumbItem[] {
  const isHi = language === 'hi';
  const homeLabel = isHi ? 'होम' : 'Home';
  const marketplaceLabel = isHi ? 'मार्केटप्लेस' : 'Marketplace';
  const universesLabel = isHi ? 'शॉपिंग श्रेणियाँ' : 'Shopping Universes';

  const homeTarget: BreadcrumbTarget = {
    view: 'home',
    universeId: null,
    categoryId: null,
    merchantId: null,
    clearSearch: true,
    clearProduct: true,
  };

  const marketplaceTarget: BreadcrumbTarget = {
    view: 'catalogue',
    universeId: null,
    categoryId: null,
    merchantId: null,
    clearSearch: true,
    clearProduct: true,
  };

  if (view === 'home') {
    return [
      { id: 'home', label: homeLabel, target: homeTarget, isCurrent: false },
      {
        id: 'home-hub',
        label: isHi ? 'लाइफस्टाइल हब' : 'Marketplace Hub',
        isCurrent: true,
      },
    ];
  }

  const items: BreadcrumbItem[] = [
    { id: 'home', label: homeLabel, target: homeTarget, isCurrent: false },
  ];

  // Product Detail Hierarchy: Home > Marketplace > Universe > Parent Category > ... > Category > Product
  if (view === 'product' && activeProduct) {
    items.push({
      id: 'marketplace',
      label: marketplaceLabel,
      target: marketplaceTarget,
      isCurrent: false,
    });

    const catChain = resolveCategoryChain(categories, activeProduct.categoryId);
    const effectiveUniverseId = activeProduct.universeId || catChain[0]?.universeId || null;
    const universe = effectiveUniverseId
      ? universes.find((u) => u.id === effectiveUniverseId)
      : undefined;
    const universeTargetView: RouteView =
      effectiveUniverseId === 'annapurna-orbit' ? 'indore-grocery' : 'catalogue';

    if (universe) {
      items.push({
        id: `uni-${universe.id}`,
        label: isHi ? universe.nameHi : universe.nameEn,
        target: {
          view: universeTargetView,
          universeId: universe.id,
          categoryId: null,
          merchantId: null,
          clearSearch: true,
          clearProduct: true,
        },
        isCurrent: false,
      });
    }

    for (const cat of catChain) {
      items.push({
        id: `cat-${cat.id}`,
        label: isHi ? cat.nameHi : cat.nameEn,
        target: {
          view: universeTargetView,
          universeId: effectiveUniverseId,
          categoryId: cat.id,
          merchantId: null,
          clearSearch: true,
          clearProduct: true,
        },
        isCurrent: false,
      });
    }

    items.push({
      id: `product-${activeProduct.id}`,
      label: isHi ? activeProduct.titleHi : activeProduct.titleEn,
      isCurrent: true,
    });

    return items;
  }

  // Catalogue / Merchant Filtered Hierarchy:
  // Home > Marketplace > [Universe] > [Parent Category > ... > Category] > [Merchant] > [Search Query]
  if (view === 'catalogue' || view === 'merchant') {
    const catChain = resolveCategoryChain(categories, selectedCategoryId);
    const effectiveUniverseId = selectedUniverseId || catChain[0]?.universeId || null;
    const universe = effectiveUniverseId
      ? universes.find((u) => u.id === effectiveUniverseId)
      : undefined;
    const merchant = selectedMerchantId
      ? merchants.find((m) => m.id === selectedMerchantId)
      : undefined;
    const trimmedSearch = searchQuery.trim();

    const hasSubFilters = Boolean(universe || catChain.length > 0 || merchant || trimmedSearch);

    items.push({
      id: 'marketplace',
      label: marketplaceLabel,
      target: hasSubFilters ? marketplaceTarget : undefined,
      isCurrent: !hasSubFilters,
    });

    if (universe) {
      const hasAfterUni = Boolean(catChain.length > 0 || merchant || trimmedSearch);
      items.push({
        id: `uni-${universe.id}`,
        label: isHi ? universe.nameHi : universe.nameEn,
        target: hasAfterUni
          ? {
              view: universe.id === 'annapurna-orbit' ? 'indore-grocery' : 'catalogue',
              universeId: universe.id,
              categoryId: null,
              merchantId: null,
              clearSearch: true,
              clearProduct: true,
            }
          : undefined,
        isCurrent: !hasAfterUni,
      });
    }

    catChain.forEach((cat, idx) => {
      const isLastCat = idx === catChain.length - 1;
      const hasAfterCat = !isLastCat || Boolean(merchant || trimmedSearch);
      items.push({
        id: `cat-${cat.id}`,
        label: isHi ? cat.nameHi : cat.nameEn,
        target: hasAfterCat
          ? {
              view: 'catalogue',
              universeId: effectiveUniverseId,
              categoryId: cat.id,
              merchantId: null,
              clearSearch: true,
              clearProduct: true,
            }
          : undefined,
        isCurrent: !hasAfterCat,
      });
    });

    if (merchant) {
      const hasAfterMerchant = Boolean(trimmedSearch);
      items.push({
        id: `merchant-${merchant.id}`,
        label: merchant.name,
        target: hasAfterMerchant
          ? {
              view: 'merchant',
              universeId: effectiveUniverseId,
              categoryId: selectedCategoryId,
              merchantId: merchant.id,
              clearSearch: true,
              clearProduct: true,
            }
          : undefined,
        isCurrent: !hasAfterMerchant,
      });
    }

    if (trimmedSearch) {
      items.push({
        id: 'search-query',
        label: isHi ? `खोज: "${trimmedSearch}"` : `Search: "${trimmedSearch}"`,
        isCurrent: true,
      });
    }

    return items;
  }

  // Indore Grocery Hierarchy: Home > Marketplace > Annapurna Orbit (Indore Grocery) > [Nested Grocery Category]
  if (view === 'indore-grocery') {
    const groceryUniverse = universes.find((u) => u.id === 'annapurna-orbit');
    const rawChain = resolveCategoryChain(categories, selectedCategoryId);
    const groceryCatChain =
      rawChain.length > 0 && rawChain[0].universeId === 'annapurna-orbit' ? rawChain : [];

    items.push({
      id: 'marketplace',
      label: marketplaceLabel,
      target: marketplaceTarget,
      isCurrent: false,
    });

    items.push({
      id: 'uni-annapurna-orbit',
      label: groceryUniverse
        ? isHi
          ? groceryUniverse.nameHi
          : groceryUniverse.nameEn
        : isHi
        ? 'अन्नपूर्णा ऑर्बिट (इंदौर किराना)'
        : 'Indore Grocery',
      target:
        groceryCatChain.length > 0
          ? {
              view: 'indore-grocery',
              universeId: 'annapurna-orbit',
              categoryId: null,
              merchantId: null,
              clearSearch: true,
              clearProduct: true,
            }
          : undefined,
      isCurrent: groceryCatChain.length === 0,
    });

    groceryCatChain.forEach((cat, idx) => {
      const isLast = idx === groceryCatChain.length - 1;
      items.push({
        id: `cat-${cat.id}`,
        label: isHi ? cat.nameHi : cat.nameEn,
        target: !isLast
          ? {
              view: 'indore-grocery',
              universeId: 'annapurna-orbit',
              categoryId: cat.id,
              merchantId: null,
              clearSearch: true,
              clearProduct: true,
            }
          : undefined,
        isCurrent: isLast,
      });
    });

    return items;
  }

  // Universes Explorer: Home > Shopping Universes > [Selected Universe]
  if (view === 'universes') {
    const selectedUni = selectedUniverseId
      ? universes.find((u) => u.id === selectedUniverseId)
      : undefined;

    items.push({
      id: 'universes',
      label: universesLabel,
      target: selectedUni
        ? {
            view: 'universes',
            universeId: null,
            categoryId: null,
            merchantId: null,
            clearProduct: true,
          }
        : undefined,
      isCurrent: !selectedUni,
    });

    if (selectedUni) {
      items.push({
        id: `uni-${selectedUni.id}`,
        label: isHi ? selectedUni.nameHi : selectedUni.nameEn,
        isCurrent: true,
      });
    }

    return items;
  }

  // Direct Orders links back from Direct Cart
  if (view === 'orders') {
    items.push({
      id: 'cart',
      label: isHi ? 'डायरेक्ट कार्ट' : 'Direct Cart',
      target: {
        view: 'cart',
        clearProduct: true,
      },
      isCurrent: false,
    });
    items.push({
      id: 'orders',
      label: isHi ? 'डायरेक्ट ऑर्डर इतिहास' : 'Direct Order History',
      isCurrent: true,
    });
    return items;
  }

  // All remaining routes (about, offers, ai-saathi, wishlist, shopping-lists, cart, profile, guides, support, legal, admin)
  const routeEntry = VIEW_LABELS[view];
  items.push({
    id: view,
    label: routeEntry ? (isHi ? routeEntry.hi : routeEntry.en) : view,
    isCurrent: true,
  });

  return items;
}

interface BreadcrumbNavigationProps extends BuildBreadcrumbParams {
  onNavigateCrumb: (target: BreadcrumbTarget) => void;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  view,
  language,
  universes,
  categories,
  merchants,
  selectedUniverseId,
  selectedCategoryId,
  selectedMerchantId,
  activeProduct,
  searchQuery,
  onNavigateCrumb,
}) => {
  const trail = buildBreadcrumbTrail({
    view,
    language,
    universes,
    categories,
    merchants,
    selectedUniverseId,
    selectedCategoryId,
    selectedMerchantId,
    activeProduct,
    searchQuery,
  });

  return (
    <nav
      aria-label={language === 'hi' ? 'ब्रेडक्रंब नेविगेशन' : 'Breadcrumb'}
      className="mb-6 pb-3 border-b border-[#073D35]/10 dark:border-[#C89A45]/15"
    >
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs sm:text-[13px]">
        {trail.map((item, idx) => {
          const isHome = idx === 0;
          return (
            <li key={item.id} className="inline-flex items-center gap-1.5 min-w-0">
              {idx > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="w-3.5 h-3.5 text-[#C89A45]/80 shrink-0"
                />
              )}

              {item.isCurrent || !item.target ? (
                <span
                  aria-current={item.isCurrent ? 'page' : undefined}
                  title={item.label}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#073D35] dark:text-[#C89A45] truncate max-w-[220px] sm:max-w-[360px]"
                >
                  {isHome && <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  <span className="truncate">{item.label}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateCrumb(item.target!)}
                  title={item.label}
                  className="inline-flex items-center gap-1.5 text-[#073D35]/75 dark:text-[#F8F2E8]/75 hover:text-[#073D35] dark:hover:text-[#C89A45] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C89A45] rounded-sm"
                >
                  {isHome && <Home className="w-3.5 h-3.5 shrink-0 text-[#073D35]/70 dark:text-[#C89A45]/80" aria-hidden="true" />}
                  <span>{item.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

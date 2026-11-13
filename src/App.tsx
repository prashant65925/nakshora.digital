import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  Moon,
  MapPin,
  Menu,
  X,
  Download,
  Heart,
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  Home,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { useHubData } from './hooks/useHubData';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import { signInWithGoogle, signOutUser } from './lib/firebase';
import { t } from './lib/i18n';
import { AffiliateLink, CartItem, LanguageCode, Product, ProductVariant, RouteView } from './types/hub';
import { VedashilaCompactMark, VedashilaHeaderLogo } from './components/BrandMark';
import { BreadcrumbNavigation, BreadcrumbTarget } from './components/BreadcrumbNavigation';
import { MarketplaceHome } from './components/MarketplaceHome';
import { ConstellationNav } from './components/ConstellationNav';
import { ProductCard } from './components/ProductCard';
import { AiSaathiPanel } from './components/AiSaathiPanel';
import { CartCheckoutView } from './components/CartCheckoutView';
import { ProductDetailView } from './components/ProductDetailView';
import { AdminDashboard } from './components/AdminDashboard';
import {
  AboutView,
  GuidesView,
  LegalPageView,
  ProfileView,
  ShoppingListsView,
  SupportView,
} from './components/StaticAndSupportViews';

const PAGE_SIZE = 6;

export default function App() {
  const hub = useHubData();
  const isOnline = useOnlineStatus();
  const pwa = usePWAInstall();

  const [view, setView] = useState<RouteView>('home');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [city, setCity] = useState<'Indore, MP' | 'Pan-India (Other City)'>('Indore, MP');
  const [pincodeInput, setPincodeInput] = useState('452001');
  const [checkedPinResult, setCheckedPinResult] = useState<{
    checked: boolean;
    serviceable: boolean;
    locality: string;
    note: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'updated' | 'title-asc'>('featured');
  const [currentPage, setCurrentPage] = useState(1);

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeAffiliateRedirect, setActiveAffiliateRedirect] = useState<AffiliateLink | null>(null);
  const trackedAffParamRef = useRef<string | null>(null);
  const impressedLinkIdsRef = useRef<Set<string>>(new Set());

  const [cart, setCart] = useState<CartItem[]>([]);
  const [abandonedCartOptIn, setAbandonedCartOptIn] = useState(false);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [showIOSPwaGuide, setShowIOSPwaGuide] = useState(false);

  const [outboundClicks, setOutboundClicks] = useState<
    { productId: string; merchantId: string; timestamp: string }[]
  >([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const isIndore = city === 'Indore, MP';

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) root.classList.add('reduced-motion');
    else root.classList.remove('reduced-motion');
  }, [reducedMotion]);

  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '') as RouteView;
    const validViews: RouteView[] = [
      'home',
      'about',
      'universes',
      'catalogue',
      'indore-grocery',
      'offers',
      'ai-saathi',
      'wishlist',
      'shopping-lists',
      'cart',
      'orders',
      'profile',
      'guides',
      'support',
      'privacy',
      'terms',
      'affiliate-disclosure',
      'refund-policy',
      'admin',
    ];
    if (path && validViews.includes(path)) {
      setView(path);
    }
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product');
    if (prodId) {
      const found = hub.products.find((p) => p.id === prodId);
      if (found) {
        setActiveProduct(found);
        setView('product');
      }
    }
    const affCode = params.get('aff');
    if (affCode && hub.affiliateLinks.length > 0 && trackedAffParamRef.current !== affCode) {
      const foundLink = hub.affiliateLinks.find(
        (l) => l.active && l.trackingCode.toLowerCase() === affCode.toLowerCase()
      );
      if (foundLink) {
        trackedAffParamRef.current = affCode;
        setActiveAffiliateRedirect(foundLink);
        void hub.trackAffiliateEvent(foundLink.id, 'click');
      }
    }
  }, [hub.products, hub.affiliateLinks, hub.trackAffiliateEvent]);

  useEffect(() => {
    const syncFromLocation = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '') as RouteView;
      const validViews: RouteView[] = [
        'home',
        'about',
        'universes',
        'catalogue',
        'indore-grocery',
        'offers',
        'ai-saathi',
        'wishlist',
        'shopping-lists',
        'cart',
        'orders',
        'profile',
        'guides',
        'support',
        'privacy',
        'terms',
        'affiliate-disclosure',
        'refund-policy',
        'admin',
      ];
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('product');
      if (prodId) {
        const found = hub.products.find((p) => p.id === prodId);
        if (found) {
          setActiveProduct(found);
          setView('product');
          return;
        }
      }
      setActiveProduct(null);
      if (path && validViews.includes(path)) {
        setView(path);
      } else {
        setView('home');
      }
    };

    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, [hub.products]);

  useEffect(() => {
    if (view !== 'affiliate-disclosure') return;
    hub.affiliateLinks
      .filter((l) => l.active)
      .forEach((link) => {
        if (!impressedLinkIdsRef.current.has(link.id)) {
          impressedLinkIdsRef.current.add(link.id);
          void hub.trackAffiliateEvent(link.id, 'impression');
        }
      });
  }, [view, hub.affiliateLinks, hub.trackAffiliateEvent]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUniverseId, selectedCategoryId, selectedMerchantId, selectedBrand, searchQuery, sortBy, city]);

  const navigate = (nextView: RouteView) => {
    if (nextView !== 'product') {
      setActiveProduct(null);
    }
    setView(nextView);
    setMobileMenuOpen(false);
    setMegaMenuOpen(false);
    const targetUrl = nextView === 'home' ? '/' : `/${nextView}`;
    window.history.pushState({}, '', targetUrl);
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const handleBreadcrumbNavigate = (target: BreadcrumbTarget) => {
    if (target.clearProduct) setActiveProduct(null);
    if (target.universeId !== undefined) setSelectedUniverseId(target.universeId);
    if (target.categoryId !== undefined) setSelectedCategoryId(target.categoryId);
    if (target.merchantId !== undefined) setSelectedMerchantId(target.merchantId);
    if (target.clearSearch) setSearchQuery('');
    setSelectedBrand('');
    navigate(target.view);
  };

  const verifyIndorePincode = (pin?: string) => {
    const targetPin = (pin ?? pincodeInput).trim();
    const match = hub.serviceAreas.find((s) => s.pincode === targetPin);
    if (match) {
      setCheckedPinResult({
        checked: true,
        serviceable: match.serviceable,
        locality: match.locality,
        note: match.note,
      });
    } else {
      setCheckedPinResult({
        checked: true,
        serviceable: false,
        locality: 'Unlisted Indore PIN Code',
        note: 'This PIN code is not yet verified in our Indore grocery registry. Final availability is determined by the merchant.',
      });
    }
  };

  const matchedCategoryIds = useMemo(() => {
    if (!selectedCategoryId) return null;
    const ids = new Set<string>([selectedCategoryId]);
    let added = true;
    while (added) {
      added = false;
      for (const cat of hub.categories) {
        if (cat.parentCategoryId && ids.has(cat.parentCategoryId) && !ids.has(cat.id)) {
          ids.add(cat.id);
          added = true;
        }
      }
    }
    return ids;
  }, [selectedCategoryId, hub.categories]);

  const brandOptions = useMemo(() => {
    const brands = new Set<string>();
    hub.products.forEach((p) => {
      if (p.status === 'published' && p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [hub.products]);

  const visibleProducts = useMemo(() => {
    const filtered = hub.products.filter((p) => {
      if (p.status !== 'published') return false;
      const merchant = hub.merchants.find((m) => m.id === p.merchantId);
      if (merchant && merchant.status === 'disabled_emergency') return false;
      if (p.indoreOnly && !isIndore) return false;
      if (selectedUniverseId && p.universeId !== selectedUniverseId) return false;
      if (matchedCategoryIds && !matchedCategoryIds.has(p.categoryId)) return false;
      if (selectedMerchantId && p.merchantId !== selectedMerchantId) return false;
      if (selectedBrand && p.brand !== selectedBrand) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${p.titleEn} ${p.titleHi} ${p.brand || ''} ${p.descriptionEn} ${p.universeId} ${p.categoryId} ${p.merchantId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return [...filtered].sort((a, b) => (a.priceVerified && a.priceInr ? a.priceInr : 9e9) - (b.priceVerified && b.priceInr ? b.priceInr : 9e9));
    }
    if (sortBy === 'price-desc') {
      return [...filtered].sort((a, b) => (b.priceVerified && b.priceInr ? b.priceInr : -1) - (a.priceVerified && a.priceInr ? a.priceInr : -1));
    }
    if (sortBy === 'updated') {
      return [...filtered].sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));
    }
    if (sortBy === 'title-asc') {
      return [...filtered].sort((a, b) => a.titleEn.localeCompare(b.titleEn));
    }
    return filtered;
  }, [hub.products, hub.merchants, isIndore, selectedUniverseId, matchedCategoryIds, selectedMerchantId, selectedBrand, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const paginatedProducts = visibleProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const catalogueCategoryOptions = useMemo(() => {
    const activeCats = hub.categories.filter(
      (c) => c.active && (!selectedUniverseId || c.universeId === selectedUniverseId)
    );
    const roots = activeCats
      .filter((c) => !c.parentCategoryId || !activeCats.some((p) => p.id === c.parentCategoryId))
      .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    const ordered: { id: string; label: string }[] = [];
    const appendTree = (catId: string, depth: number) => {
      const node = activeCats.find((c) => c.id === catId);
      if (!node) return;
      const prefix = depth > 0 ? `${'— '.repeat(depth)}` : '';
      ordered.push({ id: node.id, label: `${prefix}${language === 'hi' ? node.nameHi : node.nameEn}` });
      activeCats
        .filter((c) => c.parentCategoryId === catId)
        .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
        .forEach((child) => appendTree(child.id, depth + 1));
    };
    roots.forEach((r) => appendTree(r.id, 0));
    return ordered;
  }, [hub.categories, selectedUniverseId, language]);

  const addDirectToCart = (product: Product, variant?: ProductVariant) => {
    if (product.purchaseMode !== 'direct' || !product.priceVerified || typeof product.priceInr !== 'number') {
      return;
    }
    const unitPriceInr = product.priceInr + (variant?.priceDeltaInr || 0);
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id && (c.variantId || '') === (variant?.id || ''));
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id && (c.variantId || '') === (variant?.id || '')
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant?.id,
          variantLabel: variant?.label,
          title: language === 'hi' ? product.titleHi : product.titleEn,
          unitPriceInr,
          quantity: 1,
          imageUrl: product.imageUrl,
        },
      ];
    });
    setCartToast(`Added "${language === 'hi' ? product.titleHi : product.titleEn}" to Direct Cart.`);
    setTimeout(() => setCartToast(null), 2600);
  };

  const trackOutboundClick = (product: Product) => {
    setOutboundClicks((prev) => [
      ...prev,
      { productId: product.id, merchantId: product.merchantId, timestamp: new Date().toISOString() },
    ]);
  };

  const openProduct = (product: Product) => {
    setActiveProduct(product);
    setSelectedUniverseId(product.universeId);
    setSelectedCategoryId(product.categoryId);
    setView('product');
    window.history.pushState({}, '', `/?product=${encodeURIComponent(product.id)}`);
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const handleGlobalSearch = (queryStr: string) => {
    const clean = queryStr.trim();
    setSearchQuery(clean);
    if (clean) {
      setSearchHistory((prev) => [...prev, clean]);
      void hub.recordSearchQuery(clean);
    }
    navigate('catalogue');
  };

  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const wishlistProducts = hub.products.filter((p) => hub.wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F2E8] text-[#252525] dark:bg-[#071A17] dark:text-[#F8F2E8] transition-colors pb-16 lg:pb-0">
      {/* 2. Strict 3-Zone Sticky Header Harmonized with Official Warm Ivory Logo */}
      <header className="sticky top-0 z-40 border-b border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#F6EDE2] text-[#073D35] dark:bg-[#072B25] dark:text-[#F8F2E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Official Responsive Brand Logo */}
          <button
            type="button"
            onClick={() => {
              setSelectedUniverseId(null);
              setSelectedCategoryId(null);
              setSelectedMerchantId(null);
              setSelectedBrand('');
              navigate('home');
            }}
            aria-label="VEDASHILA Home"
            className="flex items-center text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C89A45]"
          >
            <VedashilaHeaderLogo className="dark:bg-[#F6EDE2] dark:px-2 dark:py-0.5 dark:rounded-xl dark:border dark:border-[#C89A45]/40" />
          </button>

          {/* Zone 2: 5 Single-Line Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#073D35]/90 dark:text-[#F8F2E8]/90">
            <button
              type="button"
              onClick={() => {
                setSelectedUniverseId(null);
                setSelectedCategoryId(null);
                setSelectedMerchantId(null);
                navigate('universes');
              }}
              className={`hover:text-[#C89A45] transition-colors whitespace-nowrap shrink-0 ${view === 'universes' ? 'text-[#C89A45]' : ''}`}
            >
              {t(language, 'navUniverses')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedUniverseId(null);
                setSelectedCategoryId(null);
                setSelectedMerchantId(null);
                navigate('catalogue');
              }}
              className={`hover:text-[#C89A45] transition-colors whitespace-nowrap shrink-0 ${view === 'catalogue' ? 'text-[#C89A45]' : ''}`}
            >
              {t(language, 'navCatalogue')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedUniverseId('annapurna-orbit');
                setSelectedCategoryId(null);
                setSelectedMerchantId(null);
                navigate('indore-grocery');
              }}
              className={`hover:text-[#C89A45] transition-colors whitespace-nowrap shrink-0 ${view === 'indore-grocery' ? 'text-[#C89A45]' : ''}`}
            >
              {t(language, 'navGrocery')}
            </button>
            <button
              type="button"
              onClick={() => navigate('offers')}
              className={`hover:text-[#C89A45] transition-colors whitespace-nowrap shrink-0 ${view === 'offers' ? 'text-[#C89A45]' : ''}`}
            >
              {t(language, 'navOffers')}
            </button>
            <button
              type="button"
              onClick={() => navigate('about')}
              className={`hover:text-[#C89A45] transition-colors whitespace-nowrap shrink-0 ${view === 'about' ? 'text-[#C89A45]' : ''}`}
            >
              {t(language, 'navAbout')}
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA + Mobile Menu Trigger */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('cart')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {t(language, 'navCart')} ({totalCartItems})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg border border-[#073D35]/20 dark:border-[#C89A45]/40 text-[#073D35] dark:text-[#F8F2E8]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#073D35]/10 dark:border-[#C89A45]/20 px-4 py-4 space-y-1.5 bg-[#F6EDE2] text-[#073D35] dark:bg-[#072B25] dark:text-[#F8F2E8]">
            {(
              [
                ['universes', t(language, 'navUniverses')],
                ['catalogue', t(language, 'navCatalogue')],
                ['indore-grocery', t(language, 'navGrocery')],
                ['offers', t(language, 'navOffers')],
                ['about', t(language, 'navAbout')],
                ['guides', t(language, 'navGuides')],
                ['ai-saathi', t(language, 'aiSaathiTitle')],
                ['wishlist', `Wishlist (${hub.wishlistIds.length})`],
                ['shopping-lists', 'Shopping Lists'],
                ['admin', t(language, 'adminConsole')],
              ] as [RouteView, string][]
            ).map(([route, label]) => (
              <button
                key={route}
                type="button"
                onClick={() => navigate(route)}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#073D35]/10 dark:hover:bg-white/10"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 3 & 4. Universal Search, Location, Utility Bar & Interactive Category Mega-Menu */}
      <div className="border-b border-[#073D35]/10 dark:border-[#C89A45]/15 bg-[#FFFFFF] dark:bg-[#0E2924] relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 space-y-2.5">
          {/* Search + Mega-Menu Trigger + Location */}
          <div className="flex flex-col md:flex-row md:items-center gap-2.5">
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMegaMenuOpen((v) => !v)}
                aria-expanded={megaMenuOpen}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-[#F8F2E8] dark:bg-[#071A17] text-xs font-semibold hover:border-[#C89A45]"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#C89A45]" />
                <span>All Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-[#F8F2E8] dark:bg-[#071A17] text-xs">
                <MapPin className="w-3.5 h-3.5 text-[#073D35] dark:text-[#C89A45] shrink-0" />
                <select
                  aria-label="Select shopping city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value as typeof city);
                    setCheckedPinResult(null);
                  }}
                  className="bg-transparent font-semibold focus:outline-none"
                >
                  <option value="Indore, MP" className="text-[#252525]">{t(language, 'indoreCity')}</option>
                  <option value="Pan-India (Other City)" className="text-[#252525]">{t(language, 'panIndiaCity')}</option>
                </select>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGlobalSearch(searchQuery);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#252525]/45 dark:text-[#F8F2E8]/45" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(language, 'searchPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-[#F8F2E8] dark:bg-[#071A17] text-xs sm:text-sm focus:outline-none focus:border-[#C89A45]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold whitespace-nowrap"
              >
                Search
              </button>
            </form>

            {/* Quick Account / Wishlist / Language / Theme / Admin Controls */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setLanguage((l) => (l === 'en' ? 'hi' : 'en'))}
                className="px-2 py-1.5 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 font-semibold hover:border-[#C89A45]"
              >
                {language === 'en' ? 'हिन्दी' : 'EN'}
              </button>
              <button
                type="button"
                onClick={() => setDarkMode((d) => !d)}
                aria-label="Toggle dark mode"
                className="p-1.5 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 hover:border-[#C89A45]"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-[#C89A45]" /> : <Moon className="w-3.5 h-3.5 text-[#073D35]" />}
              </button>
              <button
                type="button"
                onClick={() => setReducedMotion((r) => !r)}
                className={`hidden sm:inline-flex px-2 py-1.5 rounded-lg border text-[11px] ${
                  reducedMotion
                    ? 'border-[#073D35] text-[#073D35] dark:border-[#C89A45] dark:text-[#C89A45] font-semibold'
                    : 'border-[#073D35]/15 dark:border-[#C89A45]/25'
                }`}
              >
                {t(language, 'reducedMotion')}
              </button>
              {!pwa.isInstalled && pwa.isInstallable && (
                <button
                  type="button"
                  onClick={() => pwa.install()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#073D35] text-white font-semibold"
                >
                  <Download className="w-3 h-3" />
                  {t(language, 'installApp')}
                </button>
              )}
              {!pwa.isInstalled && !pwa.isInstallable && pwa.isIOS && (
                <button
                  type="button"
                  onClick={() => setShowIOSPwaGuide(true)}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#073D35] text-[#073D35] dark:border-[#C89A45] dark:text-[#C89A45]"
                >
                  <Download className="w-3 h-3" />
                  iOS App
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('wishlist')}
                aria-label="Wishlist"
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 hover:border-[#F47D79]"
              >
                <Heart className="w-3.5 h-3.5 text-[#F47D79]" />
                <span className="font-mono-num">{hub.wishlistIds.length}</span>
              </button>
              {hub.user ? (
                <button
                  type="button"
                  onClick={() => navigate('profile')}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 hover:border-[#C89A45]"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="max-w-[76px] truncate">{hub.user.displayName || 'Account'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="px-2.5 py-1.5 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] font-semibold"
                >
                  {t(language, 'signIn')}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('admin')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#073D35] dark:border-[#C89A45] text-[#073D35] dark:text-[#C89A45] font-semibold hover:bg-[#073D35] hover:text-white dark:hover:bg-[#C89A45] dark:hover:text-[#073D35] transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {t(language, 'adminConsole')}
              </button>
            </div>
          </div>

          {/* 4. Interactive Category Mega-Menu Panel */}
          {megaMenuOpen && (
            <div className="pt-3 border-t border-[#073D35]/10 dark:border-[#C89A45]/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
              {hub.universes
                .filter((u) => u.active)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((u) => {
                  const uCats = hub.categories
                    .filter((c) => c.active && c.universeId === u.id)
                    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
                  return (
                    <div key={u.id} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUniverseId(u.id);
                          setSelectedCategoryId(null);
                          navigate(u.id === 'annapurna-orbit' ? 'indore-grocery' : 'catalogue');
                        }}
                        className="font-display font-bold text-xs uppercase tracking-wider text-[#073D35] dark:text-[#C89A45] hover:text-[#C89A45]"
                      >
                        {language === 'hi' ? u.nameHi : u.nameEn}
                      </button>
                      <div className="flex flex-col items-start gap-1">
                        {uCats.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedUniverseId(u.id);
                              setSelectedCategoryId(cat.id);
                              navigate(u.id === 'annapurna-orbit' ? 'indore-grocery' : 'catalogue');
                            }}
                            className="text-xs text-[#252525]/80 dark:text-[#F8F2E8]/80 hover:text-[#C89A45] text-left"
                          >
                            {cat.parentCategoryId ? `↳ ${language === 'hi' ? cat.nameHi : cat.nameEn}` : language === 'hi' ? cat.nameHi : cat.nameEn}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        <BreadcrumbNavigation
          view={view}
          language={language}
          universes={hub.universes}
          categories={hub.categories}
          merchants={hub.merchants}
          selectedUniverseId={selectedUniverseId}
          selectedCategoryId={selectedCategoryId}
          selectedMerchantId={selectedMerchantId}
          activeProduct={activeProduct}
          searchQuery={searchQuery}
          onNavigateCrumb={handleBreadcrumbNavigate}
        />

        {abandonedCartOptIn && cart.length > 0 && view !== 'cart' && (
          <div className="mb-6 p-3.5 rounded-xl border border-[#C89A45]/50 bg-[#C89A45]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <Bell className="w-4 h-4 text-[#C89A45]" />
              <span>
                Direct Cart Reminder: You have {totalCartItems} item{totalCartItems > 1 ? 's' : ''} ready for Razorpay checkout.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('cart')}
              className="px-3 py-1.5 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] font-bold"
            >
              Complete Direct Checkout
            </button>
          </div>
        )}

        {activeAffiliateRedirect && (
          <div className="mb-8 p-5 rounded-2xl border border-[#C89A45]/50 bg-[#FFFFFF] dark:bg-[#0E2924] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C89A45]">
                Tracked External Merchant Link · Code: {activeAffiliateRedirect.trackingCode}
              </p>
              <h2 className="font-display text-xl font-bold">{activeAffiliateRedirect.label}</h2>
              <p className="text-xs text-[#252525]/75 dark:text-[#F8F2E8]/75">
                {activeAffiliateRedirect.disclosureNote ||
                  'External merchant link. Checkout, pricing, and fulfillment are governed by the destination merchant.'}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={activeAffiliateRedirect.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold"
              >
                Continue to Merchant <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setActiveAffiliateRedirect(null);
                  navigate('affiliate-disclosure');
                }}
                className="px-3 py-2.5 rounded-xl border border-[#073D35]/15 dark:border-[#C89A45]/25 text-xs font-medium"
              >
                Disclosure
              </button>
              <button
                type="button"
                onClick={() => setActiveAffiliateRedirect(null)}
                aria-label="Dismiss affiliate redirect banner"
                className="p-2 rounded-lg text-[#252525]/60 dark:text-[#F8F2E8]/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {view === 'home' && (
          <MarketplaceHome
            language={language}
            city={city}
            isIndore={isIndore}
            pincodeInput={pincodeInput}
            onChangePincode={setPincodeInput}
            onVerifyPincode={verifyIndorePincode}
            checkedPinResult={checkedPinResult}
            banners={hub.banners}
            universes={hub.universes}
            categories={hub.categories}
            merchants={hub.merchants}
            products={hub.products}
            offers={hub.offers}
            blogPosts={hub.blogPosts}
            serviceAreas={hub.serviceAreas}
            wishlistIds={hub.wishlistIds}
            trendingSearches={hub.trendingSearches}
            abandonedCartOptIn={abandonedCartOptIn}
            onToggleAbandonedCartOptIn={setAbandonedCartOptIn}
            onNavigate={navigate}
            onSelectCategory={(universeId, categoryId) => {
              setSelectedUniverseId(universeId);
              setSelectedCategoryId(categoryId);
              navigate(universeId === 'annapurna-orbit' ? 'indore-grocery' : 'catalogue');
            }}
            onSelectMerchant={(merchantId) => {
              setSelectedMerchantId(merchantId);
              navigate('merchant');
            }}
            onRunSearch={handleGlobalSearch}
            onOpenAiSaathi={() => setAiDrawerOpen(true)}
            onOpenProduct={openProduct}
            onToggleWishlist={hub.toggleWishlist}
            onAddDirectToCart={(p) => addDirectToCart(p)}
            onTrackOutboundClick={trackOutboundClick}
          />
        )}

        {view === 'about' && <AboutView language={language} onNavigate={navigate} />}

        {view === 'universes' && (
          <ConstellationNav
            universes={hub.universes}
            categories={hub.categories}
            language={language}
            isIndore={isIndore}
            reducedMotion={reducedMotion}
            selectedUniverseId={selectedUniverseId}
            onSelectUniverse={(id) => {
              setSelectedUniverseId(id);
              setSelectedCategoryId(null);
              navigate(id === 'annapurna-orbit' ? 'indore-grocery' : 'catalogue');
            }}
            onSelectCategory={(universeId, categoryId) => {
              setSelectedUniverseId(universeId);
              setSelectedCategoryId(categoryId);
              navigate(universeId === 'annapurna-orbit' ? 'indore-grocery' : 'catalogue');
            }}
          />
        )}

        {(view === 'catalogue' || view === 'merchant') && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-[#073D35]/10 dark:border-[#C89A45]/20 pb-5">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45] mb-1">
                    Unified Multi-Merchant Catalogue · {visibleProducts.length} Results
                  </p>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-[#073D35] dark:text-[#F8F2E8]">
                    {selectedCategoryId
                      ? hub.categories.find((c) => c.id === selectedCategoryId)?.[
                          language === 'hi' ? 'nameHi' : 'nameEn'
                        ] || 'Category'
                      : selectedUniverseId
                      ? hub.universes.find((u) => u.id === selectedUniverseId)?.[
                          language === 'hi' ? 'nameHi' : 'nameEn'
                        ]
                      : selectedMerchantId
                      ? hub.merchants.find((m) => m.id === selectedMerchantId)?.name
                      : 'All Marketplace Products'}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C89A45]" />
                <select
                  aria-label="Filter by Universe"
                  value={selectedUniverseId || ''}
                  onChange={(e) => {
                    setSelectedUniverseId(e.target.value || null);
                    setSelectedCategoryId(null);
                  }}
                  className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-white dark:bg-[#0E2924] text-xs font-medium"
                >
                  <option value="">All Universes</option>
                  {hub.universes
                    .filter((u) => u.active)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {language === 'hi' ? u.nameHi : u.nameEn}
                      </option>
                    ))}
                </select>

                <select
                  aria-label="Filter by Category"
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                  className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-white dark:bg-[#0E2924] text-xs font-medium"
                >
                  <option value="">All Categories</option>
                  {catalogueCategoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by Brand"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-white dark:bg-[#0E2924] text-xs font-medium"
                >
                  <option value="">All Brands</option>
                  {brandOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <select
                  aria-label="Filter by Merchant"
                  value={selectedMerchantId || ''}
                  onChange={(e) => setSelectedMerchantId(e.target.value || null)}
                  className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-white dark:bg-[#0E2924] text-xs font-medium"
                >
                  <option value="">All Merchants</option>
                  {hub.merchants.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <select
                  aria-label="Sort Products"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-white dark:bg-[#0E2924] text-xs font-medium"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Direct Price: Low to High</option>
                  <option value="price-desc">Direct Price: High to Low</option>
                  <option value="updated">Recently Updated</option>
                  <option value="title-asc">Title: A–Z</option>
                </select>

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter keyword..."
                  className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-white dark:bg-[#0E2924] text-xs"
                />
              </div>
            </div>

            {visibleProducts.length === 0 ? (
              <div className="p-10 rounded-2xl border border-[#073D35]/12 bg-[#FFFFFF] dark:bg-[#0E2924] text-center space-y-3">
                <p className="text-sm font-medium">{t(language, 'emptyResults')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUniverseId(null);
                    setSelectedCategoryId(null);
                    setSelectedMerchantId(null);
                    setSelectedBrand('');
                    setSearchQuery('');
                    setSortBy('featured');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      merchant={hub.merchants.find((m) => m.id === p.merchantId)}
                      language={language}
                      isWishlisted={hub.wishlistIds.includes(p.id)}
                      onToggleWishlist={hub.toggleWishlist}
                      onOpenProduct={openProduct}
                      onAddDirectToCart={(prod) => addDirectToCart(prod)}
                      onTrackOutboundClick={trackOutboundClick}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 text-xs font-semibold disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <span className="font-mono-num text-xs font-semibold">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#073D35]/15 dark:border-[#C89A45]/25 text-xs font-semibold disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {view === 'indore-grocery' && (
          <div className="space-y-8">
            <div className="border-b border-[#073D35]/10 dark:border-[#C89A45]/20 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45] mb-1">
                Annapurna Orbit · Indore Geographic Control
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-[#073D35] dark:text-[#F8F2E8]">
                {language === 'hi' ? 'अन्नपूर्णा ऑर्बिट — इंदौर किराना' : 'Annapurna Orbit — Indore Grocery Discovery'}
              </h1>
            </div>

            {!isIndore ? (
              <div className="p-8 rounded-2xl border border-[#C89A45]/50 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-[#C89A45] shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h2 className="font-display text-2xl font-bold">{t(language, 'groceryRestrictedTitle')}</h2>
                    <p className="text-sm text-[#252525]/80 dark:text-[#F8F2E8]/80 leading-relaxed">
                      {t(language, 'groceryRestrictedDesc')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCity('Indore, MP')}
                    className="px-4 py-2 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold"
                  >
                    Switch City to Indore, MP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUniverseId(null);
                      navigate('catalogue');
                    }}
                    className="px-4 py-2 rounded-xl border border-[#073D35]/20 dark:border-[#C89A45]/30 text-xs font-semibold"
                  >
                    Browse Pan-India Categories
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="p-6 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-4">
                  <p className="text-sm font-medium">{t(language, 'groceryAllowedNotice')}</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      verifyIndorePincode();
                    }}
                    className="flex flex-col sm:flex-row gap-3 max-w-lg"
                  >
                    <input
                      type="text"
                      maxLength={6}
                      value={pincodeInput}
                      onChange={(e) => setPincodeInput(e.target.value)}
                      placeholder={t(language, 'pincodePlaceholder')}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#073D35]/15 dark:border-[#C89A45]/25 bg-[#F8F2E8] dark:bg-[#071A17] font-mono-num text-sm"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-sm font-bold"
                    >
                      {t(language, 'checkPincode')}
                    </button>
                  </form>

                  {checkedPinResult && (
                    <div
                      className={`p-4 rounded-xl border text-sm flex items-start gap-2.5 ${
                        checkedPinResult.serviceable
                          ? 'bg-[#073D35]/10 border-[#073D35]/35 dark:bg-[#C89A45]/10 dark:border-[#C89A45]/40'
                          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300'
                      }`}
                    >
                      {checkedPinResult.serviceable ? (
                        <CheckCircle2 className="w-5 h-5 text-[#073D35] dark:text-[#C89A45] shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {checkedPinResult.locality} —{' '}
                          {checkedPinResult.serviceable ? 'Eligible for Grocery Discovery' : 'Not Currently Serviceable'}
                        </p>
                        <p className="text-xs mt-0.5 opacity-80">{checkedPinResult.note}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {hub.merchants
                    .filter((m) => m.indoreOnly)
                    .map((m) => (
                      <div key={m.id} className="p-5 rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#073D35] dark:text-[#C89A45]">{m.status}</span>
                          <span>Indore Only</span>
                        </div>
                        <h3 className="font-semibold text-base">{m.name}</h3>
                        <p className="text-xs text-[#252525]/70 dark:text-[#F8F2E8]/70">{m.descriptionEn}</p>
                        {m.status === 'active' && (
                          <a
                            href={m.baseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C89A45] pt-2 hover:underline"
                          >
                            Open {m.name} <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hub.products
                    .filter((p) => p.universeId === 'annapurna-orbit' && p.status === 'published')
                    .map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        merchant={hub.merchants.find((m) => m.id === p.merchantId)}
                        language={language}
                        isWishlisted={hub.wishlistIds.includes(p.id)}
                        onToggleWishlist={hub.toggleWishlist}
                        onOpenProduct={openProduct}
                        onAddDirectToCart={(prod) => addDirectToCart(prod)}
                        onTrackOutboundClick={trackOutboundClick}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'product' && activeProduct && (
          <ProductDetailView
            product={activeProduct}
            merchant={hub.merchants.find((m) => m.id === activeProduct.merchantId)}
            universe={hub.universes.find((u) => u.id === activeProduct.universeId)}
            variants={hub.variants}
            allProducts={hub.products}
            allMerchants={hub.merchants}
            categories={hub.categories}
            wishlistIds={hub.wishlistIds}
            language={language}
            isWishlisted={hub.wishlistIds.includes(activeProduct.id)}
            onBack={() => navigate('catalogue')}
            onToggleWishlist={hub.toggleWishlist}
            onAddDirectToCart={addDirectToCart}
            onTrackOutboundClick={trackOutboundClick}
            onOpenProduct={openProduct}
            onSelectCategory={(uId, cId) => {
              setSelectedUniverseId(uId);
              setSelectedCategoryId(cId);
              navigate(uId === 'annapurna-orbit' ? 'indore-grocery' : 'catalogue');
            }}
          />
        )}

        {view === 'offers' && (
          <div className="space-y-6">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#073D35] dark:text-[#F8F2E8]">
              Verified Offers & Privileges
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {hub.offers
                .filter((o) => o.active && (!o.indoreOnly || isIndore))
                .map((o) => (
                  <div key={o.id} className="p-6 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#C89A45]">
                      <span>{o.merchantId}</span>
                      <span>{o.verified ? 'Verified Direct Offer' : 'External Merchant Offer'}</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold">{o.title}</h2>
                    <p className="text-sm text-[#252525]/75 dark:text-[#F8F2E8]/75">{o.description}</p>
                    {o.code && (
                      <p className="font-mono-num text-xs font-bold pt-2 text-[#073D35] dark:text-[#C89A45]">Code: {o.code}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {view === 'ai-saathi' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center gap-3">
              <VedashilaCompactMark className="w-10 h-10" />
              <h1 className="font-display text-3xl font-bold text-[#073D35] dark:text-[#F8F2E8]">
                {t(language, 'aiSaathiTitle')}
              </h1>
            </div>
            <AiSaathiPanel
              language={language}
              city={city}
              pincode={pincodeInput}
              products={hub.products}
              onOpenProduct={openProduct}
            />
          </div>
        )}

        {view === 'wishlist' && (
          <div className="space-y-6">
            <h1 className="font-display text-3xl font-bold text-[#073D35] dark:text-[#F8F2E8]">
              Saved Wishlist ({wishlistProducts.length})
            </h1>
            {wishlistProducts.length === 0 ? (
              <p className="text-sm text-[#252525]/70 dark:text-[#F8F2E8]/70">
                No items saved yet. Tap the heart icon on any product card.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    merchant={hub.merchants.find((m) => m.id === p.merchantId)}
                    language={language}
                    isWishlisted={true}
                    onToggleWishlist={hub.toggleWishlist}
                    onOpenProduct={openProduct}
                    onAddDirectToCart={(prod) => addDirectToCart(prod)}
                    onTrackOutboundClick={trackOutboundClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'shopping-lists' && <ShoppingListsView user={hub.user} lists={hub.shoppingLists} />}

        {(view === 'cart' || view === 'orders') && (
          <CartCheckoutView
            language={language}
            user={hub.user}
            cart={cart}
            city={city}
            pincode={pincodeInput}
            directOrders={hub.directOrders}
            onUpdateQty={(id, delta, variantId) =>
              setCart((prev) =>
                prev
                  .map((c) =>
                    c.productId === id && (c.variantId || '') === (variantId || '')
                      ? { ...c, quantity: c.quantity + delta }
                      : c
                  )
                  .filter((c) => c.quantity > 0)
              )
            }
            onRemoveItem={(id, variantId) =>
              setCart((prev) =>
                prev.filter((c) => !(c.productId === id && (c.variantId || '') === (variantId || '')))
              )
            }
            onClearCart={() => setCart([])}
          />
        )}

        {view === 'profile' && (
          <ProfileView
            user={hub.user}
            city={city}
            pincode={pincodeInput}
            wishlistProducts={wishlistProducts}
            onOpenProduct={openProduct}
          />
        )}

        {view === 'guides' && <GuidesView posts={hub.blogPosts} />}

        {view === 'support' && <SupportView user={hub.user} tickets={hub.supportTickets} />}

        {(view === 'privacy' ||
          view === 'terms' ||
          view === 'affiliate-disclosure' ||
          view === 'refund-policy') && (
          <LegalPageView
            view={view}
            language={language}
            merchants={hub.merchants}
            affiliateCampaigns={hub.affiliateCampaigns}
            affiliateLinks={hub.affiliateLinks}
            onTrackAffiliateClick={(linkId) => {
              void hub.trackAffiliateEvent(linkId, 'click');
            }}
          />
        )}

        {view === 'admin' && (
          <AdminDashboard
            user={hub.user}
            isAdmin={hub.isAdmin}
            firestoreSeeded={hub.firestoreSeeded}
            universes={hub.universes}
            categories={hub.categories}
            merchants={hub.merchants}
            products={hub.products}
            serviceAreas={hub.serviceAreas}
            directOrders={hub.directOrders}
            blogPosts={hub.blogPosts}
            systemSettings={hub.systemSettings}
            affiliateCampaigns={hub.affiliateCampaigns}
            affiliateLinks={hub.affiliateLinks}
            affiliateMetrics={hub.affiliateMetrics}
            outboundClicks={outboundClicks}
            searchQueries={searchHistory}
            onSeedDatabase={hub.seedDatabaseFromAdmin}
            onRefreshCatalogue={hub.refreshPublicCatalogue}
            onRefreshAffiliateMetrics={hub.refreshAffiliateMetrics}
            onTrackAffiliateEvent={hub.trackAffiliateEvent}
          />
        )}
      </main>

      {/* 16. Affiliate Disclosure & Deep Emerald Responsive Footer */}
      <footer className="border-t border-[#C89A45]/25 bg-[#073D35] text-[#F8F2E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="p-4 rounded-xl bg-white/5 border border-[#C89A45]/25 text-xs text-[#F8F2E8]/85">
            <strong className="text-[#C89A45]">Affiliate & Merchant Disclosure:</strong> Vedashila Direct items check out via Razorpay directly on VEDASHILA LIFESTYLE HUB. External links (Vedashila.com, Amazon reference <code>https://link.amazon/B0eJUJQ2I</code>, Blinkit Indore) redirect to the destination merchant where final prices, stock, and delivery promises apply.
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="inline-block rounded-xl bg-[#F6EDE2] p-2 border border-[#C89A45]/40">
                <VedashilaHeaderLogo />
              </div>
              <p className="text-[#F8F2E8]/80 leading-relaxed">
                {t(language, 'tagline')} Groceries in Indore, MP; all other categories pan-India.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm text-[#C89A45]">Marketplace</p>
              <div className="flex flex-col gap-1.5 items-start text-[#F8F2E8]/80">
                <button type="button" onClick={() => navigate('about')} className="hover:text-[#C89A45]">About Us</button>
                <button type="button" onClick={() => navigate('ai-saathi')} className="hover:text-[#C89A45]">VEDASHILA AI Saathi</button>
                <button type="button" onClick={() => navigate('shopping-lists')} className="hover:text-[#C89A45]">Shopping Lists</button>
                <button type="button" onClick={() => navigate('orders')} className="hover:text-[#C89A45]">Direct Order History</button>
                <button type="button" onClick={() => navigate('guides')} className="hover:text-[#C89A45]">Buying Guides</button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm text-[#C89A45]">Compliance & Support</p>
              <div className="flex flex-col gap-1.5 items-start text-[#F8F2E8]/80">
                <button type="button" onClick={() => navigate('affiliate-disclosure')} className="hover:text-[#C89A45]">Affiliate Disclosure</button>
                <button type="button" onClick={() => navigate('refund-policy')} className="hover:text-[#C89A45]">Refund & Cancellation Policy</button>
                <button type="button" onClick={() => navigate('privacy')} className="hover:text-[#C89A45]">Privacy Policy</button>
                <button type="button" onClick={() => navigate('terms')} className="hover:text-[#C89A45]">Terms & Conditions</button>
                <button type="button" onClick={() => navigate('support')} className="hover:text-[#C89A45]">Customer Support</button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm text-[#C89A45]">Administration</p>
              <div className="flex flex-col gap-1.5 items-start text-[#F8F2E8]/80">
                <button type="button" onClick={() => navigate('admin')} className="hover:text-[#F8F2E8] font-semibold text-[#C89A45]">
                  Admin Console Login
                </button>
                {hub.user && (
                  <button type="button" onClick={() => signOutUser()} className="hover:text-[#C89A45]">
                    {t(language, 'signOut')}
                  </button>
                )}
                <span className="text-[11px] opacity-70">Domain: {hub.systemSettings.publicDomain}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (Compact <= 56px) */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-[#073D35] text-[#F8F2E8] border-t border-[#C89A45]/25 grid grid-cols-5 text-[10px] font-medium"
      >
        <button
          type="button"
          onClick={() => navigate('home')}
          className={`flex flex-col items-center justify-center gap-0.5 ${view === 'home' ? 'text-[#C89A45]' : ''}`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('universes')}
          className={`flex flex-col items-center justify-center gap-0.5 ${view === 'universes' ? 'text-[#C89A45]' : ''}`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Categories</span>
        </button>
        <button
          type="button"
          onClick={() => setAiDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-[#C89A45]"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Saathi</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('wishlist')}
          className={`flex flex-col items-center justify-center gap-0.5 ${view === 'wishlist' ? 'text-[#F47D79]' : ''}`}
        >
          <Heart className="w-4 h-4" />
          <span>Wishlist</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('cart')}
          className={`flex flex-col items-center justify-center gap-0.5 ${view === 'cart' ? 'text-[#C89A45]' : ''}`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cart ({totalCartItems})</span>
        </button>
      </nav>

      {/* Cart Feedback Toast */}
      {cartToast && (
        <div className="fixed bottom-20 right-4 z-50 px-4 py-2.5 rounded-xl bg-[#073D35] text-[#F8F2E8] border border-[#C89A45]/60 text-xs font-semibold shadow-lg">
          {cartToast}
        </div>
      )}

      {/* Offline Connectivity Banner */}
      {!isOnline && (
        <div className="fixed bottom-16 lg:bottom-4 left-4 z-50 px-3.5 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold shadow-lg">
          Offline Mode — Cached catalogue active.
        </div>
      )}

      {/* Floating Gemini AI Saathi Button & Drawer */}
      {hub.systemSettings.aiSaathiEnabled && view !== 'ai-saathi' && (
        <div className="hidden lg:block fixed bottom-5 right-5 z-50">
          {aiDrawerOpen ? (
            <AiSaathiPanel
              isFloating
              language={language}
              city={city}
              pincode={pincodeInput}
              products={hub.products}
              onClose={() => setAiDrawerOpen(false)}
              onOpenProduct={(p) => {
                setAiDrawerOpen(false);
                openProduct(p);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAiDrawerOpen(true)}
              className="inline-flex items-center gap-2 pl-2.5 pr-4 py-2 rounded-full bg-[#073D35] text-[#F8F2E8] shadow-xl border border-[#C89A45]/60 text-xs font-bold hover:scale-[1.03] transition-transform"
            >
              <VedashilaCompactMark className="w-6 h-6" />
              <span>VEDASHILA AI Saathi</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile AI Saathi Modal when triggered from bottom nav */}
      {aiDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <AiSaathiPanel
            isFloating
            language={language}
            city={city}
            pincode={pincodeInput}
            products={hub.products}
            onClose={() => setAiDrawerOpen(false)}
            onOpenProduct={(p) => {
              setAiDrawerOpen(false);
              openProduct(p);
            }}
          />
        </div>
      )}

      {/* iOS Safari PWA Install Guide Modal */}
      {showIOSPwaGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0E2924] p-6 space-y-3 shadow-xl border border-[#073D35]/15 dark:border-[#C89A45]/25">
            <h3 className="font-display text-xl font-bold text-[#073D35] dark:text-[#F8F2E8]">Install VEDASHILA on iPhone / iPad</h3>
            <p className="text-sm text-[#252525]/80 dark:text-[#F8F2E8]/80">
              1. Tap the <strong>Share</strong> icon in Safari.<br />
              2. Scroll and tap <strong>Add to Home Screen</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSPwaGuide(false)}
              className="w-full py-2 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

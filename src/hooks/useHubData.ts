import { useCallback, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  checkIsUserAdmin,
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  INITIAL_AFFILIATE_CAMPAIGNS,
  INITIAL_AFFILIATE_LINKS,
  INITIAL_BANNERS,
  INITIAL_BLOG_POSTS,
  INITIAL_CATEGORIES,
  INITIAL_MERCHANTS,
  INITIAL_OFFERS,
  INITIAL_PRODUCTS,
  INITIAL_SERVICE_AREAS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_UNIVERSES,
  INITIAL_VARIANTS,
} from '../data/seedData';
import {
  AffiliateCampaign,
  AffiliateLink,
  Banner,
  BlogPost,
  Category,
  DirectOrder,
  Merchant,
  Offer,
  Product,
  ProductVariant,
  ServiceArea,
  ShoppingList,
  SupportTicket,
  SystemSettings,
  Universe,
} from '../types/hub';

export interface AffiliateMetric {
  impressions: number;
  clicks: number;
  lastEventAt?: string;
}

export function useHubData() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [universes, setUniverses] = useState<Universe[]>(INITIAL_UNIVERSES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [merchants, setMerchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [variants, setVariants] = useState<ProductVariant[]>(INITIAL_VARIANTS);
  const [offers, setOffers] = useState<Offer[]>(INITIAL_OFFERS);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(INITIAL_SERVICE_AREAS);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [affiliateCampaigns, setAffiliateCampaigns] = useState<AffiliateCampaign[]>(INITIAL_AFFILIATE_CAMPAIGNS);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>(INITIAL_AFFILIATE_LINKS);
  const [affiliateMetrics, setAffiliateMetrics] = useState<Record<string, AffiliateMetric>>({});
  const [trendingSearches, setTrendingSearches] = useState<{ term: string; count: number; lastSearchedAt: string }[]>([]);

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [directOrders, setDirectOrders] = useState<DirectOrder[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [firestoreSeeded, setFirestoreSeeded] = useState(false);

  useEffect(() => {
    testFirestoreConnection();
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const adminStatus = await checkIsUserAdmin(u);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  const refreshAffiliateMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/metrics');
      if (res.ok) {
        const data = await res.json();
        setAffiliateMetrics(data.metrics || {});
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const trackAffiliateEvent = useCallback(
    async (linkId: string, eventType: 'impression' | 'click' = 'click') => {
      try {
        const res = await fetch('/api/affiliate/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkId, eventType }),
        });
        if (res.ok) {
          const data = await res.json();
          setAffiliateMetrics((prev) => ({ ...prev, [linkId]: data.metric }));
        }
      } catch {
        // Non-fatal
      }
    },
    []
  );

  const refreshTrendingSearches = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/trending');
      if (res.ok) {
        const data = await res.json();
        setTrendingSearches(data.trending || []);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const recordSearchQuery = useCallback(async (term: string) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    try {
      const res = await fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrendingSearches(data.trending || []);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const refreshPublicCatalogue = useCallback(async () => {
    try {
      const [
        uSnap,
        cSnap,
        mSnap,
        pSnap,
        vSnap,
        oSnap,
        sSnap,
        bSnap,
        banSnap,
        setSnap,
        campSnap,
        linkSnap,
      ] = await Promise.all([
        getDocs(collection(db, 'universes')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'merchants')),
        getDocs(query(collection(db, 'products'), where('status', '==', 'published'))),
        getDocs(collection(db, 'productVariants')),
        getDocs(query(collection(db, 'offers'), where('active', '==', true))),
        getDocs(collection(db, 'serviceAreas')),
        getDocs(query(collection(db, 'blogPosts'), where('status', '==', 'published'))),
        getDocs(query(collection(db, 'banners'), where('active', '==', true))),
        getDocs(collection(db, 'systemSettings')),
        getDocs(isAdmin ? collection(db, 'affiliateCampaigns') : query(collection(db, 'affiliateCampaigns'), where('active', '==', true))),
        getDocs(isAdmin ? collection(db, 'affiliateLinks') : query(collection(db, 'affiliateLinks'), where('active', '==', true))),
      ]);

      if (!uSnap.empty) {
        setUniverses(uSnap.docs.map((d) => d.data() as Universe));
        setFirestoreSeeded(true);
      }
      if (!cSnap.empty) setCategories(cSnap.docs.map((d) => d.data() as Category));
      if (!mSnap.empty) setMerchants(mSnap.docs.map((d) => d.data() as Merchant));
      if (!pSnap.empty) setProducts(pSnap.docs.map((d) => d.data() as Product));
      if (!vSnap.empty) setVariants(vSnap.docs.map((d) => d.data() as ProductVariant));
      if (!oSnap.empty) setOffers(oSnap.docs.map((d) => d.data() as Offer));
      if (!sSnap.empty) setServiceAreas(sSnap.docs.map((d) => d.data() as ServiceArea));
      if (!bSnap.empty) setBlogPosts(bSnap.docs.map((d) => d.data() as BlogPost));
      if (!banSnap.empty) setBanners(banSnap.docs.map((d) => d.data() as Banner));
      if (!setSnap.empty) {
        const globalDoc = setSnap.docs.find((d) => d.id === 'global');
        if (globalDoc) setSystemSettings(globalDoc.data() as SystemSettings);
      }
      if (!campSnap.empty) setAffiliateCampaigns(campSnap.docs.map((d) => d.data() as AffiliateCampaign));
      if (!linkSnap.empty) setAffiliateLinks(linkSnap.docs.map((d) => d.data() as AffiliateLink));
    } catch (error) {
      console.warn('Using initial catalogue fixtures while Firestore sync initializes:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    refreshPublicCatalogue();
    refreshAffiliateMetrics();
    refreshTrendingSearches();
  }, [refreshPublicCatalogue, refreshAffiliateMetrics, refreshTrendingSearches]);

  // Authenticated user real-time listeners
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setWishlistIds([]);
      setShoppingLists([]);
      setDirectOrders([]);
      setSupportTickets([]);
      return;
    }

    const wPath = `users/${user.uid}/wishlists`;
    const unsubWish = onSnapshot(
      query(collection(db, wPath), where('userId', '==', user.uid)),
      (snap) => setWishlistIds(snap.docs.map((d) => d.id)),
      (err) => handleFirestoreError(err, OperationType.LIST, wPath)
    );

    const lPath = `users/${user.uid}/shoppingLists`;
    const unsubLists = onSnapshot(
      query(collection(db, lPath), where('userId', '==', user.uid)),
      (snap) => setShoppingLists(snap.docs.map((d) => d.data() as ShoppingList)),
      (err) => handleFirestoreError(err, OperationType.LIST, lPath)
    );

    const oQuery = isAdmin
      ? query(collection(db, 'directOrders'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'directOrders'), where('userId', '==', user.uid));
    const unsubOrders = onSnapshot(
      oQuery,
      (snap) => setDirectOrders(snap.docs.map((d) => d.data() as DirectOrder)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'directOrders')
    );

    const tQuery = isAdmin
      ? query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'supportTickets'), where('userId', '==', user.uid));
    const unsubTickets = onSnapshot(
      tQuery,
      (snap) => setSupportTickets(snap.docs.map((d) => d.data() as SupportTicket)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'supportTickets')
    );

    return () => {
      unsubWish();
      unsubLists();
      unsubOrders();
      unsubTickets();
    };
  }, [authReady, user, isAdmin]);

  const toggleWishlist = async (productId: string) => {
    if (!user || !user.emailVerified) {
      setWishlistIds((prev) =>
        prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
      return;
    }
    const itemPath = `users/${user.uid}/wishlists/${productId}`;
    try {
      if (wishlistIds.includes(productId)) {
        await deleteDoc(doc(db, itemPath));
      } else {
        await setDoc(doc(db, itemPath), {
          productId,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, itemPath);
    }
  };

  const seedDatabaseFromAdmin = async () => {
    if (!user || !isAdmin) throw new Error('Admin verification required.');
    const batch = writeBatch(db);
    INITIAL_UNIVERSES.forEach((u) => batch.set(doc(db, 'universes', u.id), { ...u, updatedAt: serverTimestamp() }));
    INITIAL_CATEGORIES.forEach((c) => batch.set(doc(db, 'categories', c.id), { ...c, updatedAt: serverTimestamp() }));
    INITIAL_MERCHANTS.forEach((m) => batch.set(doc(db, 'merchants', m.id), { ...m, updatedAt: serverTimestamp() }));
    INITIAL_PRODUCTS.forEach((p) => batch.set(doc(db, 'products', p.id), { ...p, updatedAt: serverTimestamp() }));
    INITIAL_VARIANTS.forEach((v) => batch.set(doc(db, 'productVariants', v.id), { ...v, updatedAt: serverTimestamp() }));
    INITIAL_OFFERS.forEach((o) => batch.set(doc(db, 'offers', o.id), { ...o, updatedAt: serverTimestamp() }));
    INITIAL_SERVICE_AREAS.forEach((s) => batch.set(doc(db, 'serviceAreas', s.id), { ...s, updatedAt: serverTimestamp() }));
    INITIAL_BLOG_POSTS.forEach((b) => batch.set(doc(db, 'blogPosts', b.id), { ...b, updatedAt: serverTimestamp() }));
    INITIAL_BANNERS.forEach((b) => batch.set(doc(db, 'banners', b.id), { ...b, updatedAt: serverTimestamp() }));
    INITIAL_AFFILIATE_CAMPAIGNS.forEach((c) =>
      batch.set(doc(db, 'affiliateCampaigns', c.id), { ...c, updatedAt: serverTimestamp() })
    );
    INITIAL_AFFILIATE_LINKS.forEach((l) =>
      batch.set(doc(db, 'affiliateLinks', l.id), { ...l, updatedAt: serverTimestamp() })
    );
    batch.set(doc(db, 'systemSettings', 'global'), { ...INITIAL_SYSTEM_SETTINGS, updatedAt: serverTimestamp() });
    batch.set(doc(db, 'admins', user.uid), {
      uid: user.uid,
      email: user.email || '',
      role: 'super_admin',
      active: true,
      createdAt: serverTimestamp(),
    });
    const logId = `seed_${Date.now()}`;
    batch.set(doc(db, 'auditLogs', logId), {
      id: logId,
      actorUid: user.uid,
      action: 'INITIAL_CATALOGUE_SEED',
      targetPath: 'all_public_collections',
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    await refreshPublicCatalogue();
  };

  return {
    user,
    authReady,
    isAdmin,
    universes,
    setUniverses,
    categories,
    setCategories,
    merchants,
    setMerchants,
    products,
    setProducts,
    variants,
    offers,
    serviceAreas,
    setServiceAreas,
    blogPosts,
    setBlogPosts,
    banners,
    systemSettings,
    setSystemSettings,
    affiliateCampaigns,
    setAffiliateCampaigns,
    affiliateLinks,
    setAffiliateLinks,
    affiliateMetrics,
    trendingSearches,
    refreshAffiliateMetrics,
    trackAffiliateEvent,
    recordSearchQuery,
    wishlistIds,
    shoppingLists,
    directOrders,
    supportTickets,
    firestoreSeeded,
    toggleWishlist,
    refreshPublicCatalogue,
    seedDatabaseFromAdmin,
  };
}

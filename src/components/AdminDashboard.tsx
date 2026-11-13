import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  LayoutDashboard,
  Package,
  Store,
  Link2,
  MapPin,
  ReceiptIndianRupee,
  Sparkles,
  Layers,
  BarChart3,
  UploadCloud,
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Database,
  Orbit,
  Pencil,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Plus,
  ArrowUp,
  ArrowDown,
  GitMerge,
} from 'lucide-react';
import {
  AffiliateCampaign,
  AffiliateLink,
  BlogPost,
  Category,
  DirectOrder,
  ImportJob,
  IntegrationStatusReport,
  Merchant,
  MerchantStatus,
  Product,
  ServiceArea,
  SystemSettings,
  Universe,
} from '../types/hub';
import { AffiliateMetric } from '../hooks/useHubData';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
} from '../lib/firebase';
import { ResilientImage, VedashilaCompactMark } from './BrandMark';

type AdminTab =
  | 'overview'
  | 'universes'
  | 'products'
  | 'merchants'
  | 'affiliate'
  | 'grocery'
  | 'orders'
  | 'ai'
  | 'content'
  | 'analytics'
  | 'imports'
  | 'security';

const PRESET_IMAGES = [
  { label: 'Nakshatra Luxury Showcase', url: '/src/assets/images/hero_nakshatra_luxury_1794542199176.jpg' },
  { label: 'Vastra Silk Saree', url: '/src/assets/images/universe_vastra_saree_1794542200475.jpg' },
  { label: 'Tech Tara Audio & Watch', url: '/src/assets/images/universe_tech_tara_1794542200408.jpg' },
  { label: 'Griha & Saundarya Brass', url: '/src/assets/images/universe_griha_saundarya_1794542201378.jpg' },
  { label: 'Annapurna Indore Pantry', url: '/src/assets/images/universe_annapurna_indore_1794542200407.jpg' },
];

interface AdminDashboardProps {
  user: User | null;
  isAdmin: boolean;
  firestoreSeeded: boolean;
  universes: Universe[];
  categories: Category[];
  merchants: Merchant[];
  products: Product[];
  serviceAreas: ServiceArea[];
  directOrders: DirectOrder[];
  blogPosts: BlogPost[];
  systemSettings: SystemSettings;
  affiliateCampaigns: AffiliateCampaign[];
  affiliateLinks: AffiliateLink[];
  affiliateMetrics: Record<string, AffiliateMetric>;
  outboundClicks: { productId: string; merchantId: string; timestamp: string }[];
  searchQueries: string[];
  onSeedDatabase: () => Promise<void>;
  onRefreshCatalogue: () => Promise<void>;
  onRefreshAffiliateMetrics: () => Promise<void>;
  onTrackAffiliateEvent: (linkId: string, eventType?: 'impression' | 'click') => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  isAdmin,
  firestoreSeeded,
  universes,
  categories,
  merchants,
  products,
  serviceAreas,
  directOrders,
  blogPosts,
  systemSettings,
  affiliateCampaigns,
  affiliateLinks,
  affiliateMetrics,
  outboundClicks,
  searchQueries,
  onSeedDatabase,
  onRefreshCatalogue,
  onRefreshAffiliateMetrics,
  onTrackAffiliateEvent,
}) => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Universe CRUD State
  const [editingUniverseId, setEditingUniverseId] = useState<string | null>(null);
  const [uniNameEn, setUniNameEn] = useState('');
  const [uniNameHi, setUniNameHi] = useState('');
  const [uniDescEn, setUniDescEn] = useState('');
  const [uniDescHi, setUniDescHi] = useState('');
  const [uniImageUrl, setUniImageUrl] = useState(PRESET_IMAGES[0].url);
  const [uniIndoreOnly, setUniIndoreOnly] = useState(false);
  const [uniActive, setUniActive] = useState(true);
  const [uniSortOrder, setUniSortOrder] = useState('1');
  const [confirmDeleteUniId, setConfirmDeleteUniId] = useState<string | null>(null);

  // Category CRUD State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catUniverseId, setCatUniverseId] = useState('vastra-mandala');
  const [catParentId, setCatParentId] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameHi, setCatNameHi] = useState('');
  const [catDescEn, setCatDescEn] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catActive, setCatActive] = useState(true);
  const [catSortOrder, setCatSortOrder] = useState('1');
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);
  const [mergeSourceCatId, setMergeSourceCatId] = useState('');
  const [mergeTargetCatId, setMergeTargetCatId] = useState('');

  // Affiliate Campaigns & Links CRUD State
  const [campMerchantId, setCampMerchantId] = useState('amazon-associates-in');
  const [campName, setCampName] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campVerified, setCampVerified] = useState(false);

  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkMerchantId, setLinkMerchantId] = useState('amazon-associates-in');
  const [linkCampaignId, setLinkCampaignId] = useState('');
  const [linkDestUrl, setLinkDestUrl] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [linkTags, setLinkTags] = useState('');
  const [linkDisclosure, setLinkDisclosure] = useState('');
  const [linkTrackable, setLinkTrackable] = useState(false);
  const [linkActive, setLinkActive] = useState(true);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Manual Product Form State (Create & Edit)
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProdId, setNewProdId] = useState('');
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdTitleHi, setNewProdTitleHi] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdDescEn, setNewProdDescEn] = useState('');
  const [newProdDescHi, setNewProdDescHi] = useState('');
  const [newProdPermissions, setNewProdPermissions] = useState('Authorized manual catalogue entry');
  const [newProdUniverse, setNewProdUniverse] = useState('vastra-mandala');
  const [newProdCategory, setNewProdCategory] = useState('sarees-ethnic');
  const [newProdMerchant, setNewProdMerchant] = useState('vedashila-direct');
  const [newProdMode, setNewProdMode] = useState<'direct' | 'external'>('direct');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdPriceVerified, setNewProdPriceVerified] = useState(true);
  const [newProdUrl, setNewProdUrl] = useState('');
  const [newProdImageUrl, setNewProdImageUrl] = useState(PRESET_IMAGES[0].url);
  const [newProdImageRights, setNewProdImageRights] = useState<Product['imageRightsStatus']>('owned');
  const [newProdIndoreOnly, setNewProdIndoreOnly] = useState(false);
  const [newProdStatus, setNewProdStatus] = useState<Product['status']>('published');
  const [prodFilterQuery, setProdFilterQuery] = useState('');
  const [prodFilterMerchant, setProdFilterMerchant] = useState('');
  const [prodFilterStatus, setProdFilterStatus] = useState('');
  const [confirmDeleteProdId, setConfirmDeleteProdId] = useState<string | null>(null);

  // Backend Integration Readiness Status (booleans & safe descriptions only)
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatusReport | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const amazonMerchant = merchants.find((m) => m.id === 'amazon-associates-in');
  const [amazonTagInput, setAmazonTagInput] = useState(amazonMerchant?.verifiedTrackingId || '');

  // Service Area Form State
  const [newPin, setNewPin] = useState('');
  const [newLocality, setNewLocality] = useState('');

  // Settings State
  const [domainInput, setDomainInput] = useState(systemSettings.publicDomain);
  const [festiveTheme, setFestiveTheme] = useState(systemSettings.festiveTheme);
  const [aiEnabled, setAiEnabled] = useState(systemSettings.aiSaathiEnabled);
  const [aiLimit, setAiLimit] = useState(String(systemSettings.aiDailyLimitPerUser));

  // AI Draft Assistant
  const [aiTopic, setAiTopic] = useState('');
  const [aiTaskType, setAiTaskType] = useState('buying_guide');
  const [aiDraft, setAiDraft] = useState<{ title: string; excerpt: string; body: string } | null>(null);

  // Import Automation (CSV / JSON Manual Import)
  const [importSource, setImportSource] = useState<'json' | 'csv'>('csv');
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<Product[] | null>(null);
  const [importStats, setImportStats] = useState<{ total: number; valid: number; dupes: number } | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importTargetStatus, setImportTargetStatus] = useState<'published' | 'pending_approval'>('published');

  // Security & Audit
  const [auditLogs, setAuditLogs] = useState<{ id: string; actorUid: string; action: string; targetPath: string }[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const fetchIntegrationStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/integrations/status');
      if (res.ok) {
        const data = await res.json();
        setIntegrationStatus(data.integrations || null);
      }
    } catch {
      // Non-fatal in offline mode
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (amazonMerchant?.verifiedTrackingId && !amazonTagInput) {
      setAmazonTagInput(amazonMerchant.verifiedTrackingId);
    }
  }, [amazonMerchant?.verifiedTrackingId, amazonTagInput]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchIntegrationStatus();
    const loadAdminLists = async () => {
      try {
        const [aSnap, jSnap] = await Promise.all([
          getDocs(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(20))),
          getDocs(query(collection(db, 'importJobs'), orderBy('createdAt', 'desc'), limit(20))),
        ]);
        setAuditLogs(aSnap.docs.map((d) => d.data() as { id: string; actorUid: string; action: string; targetPath: string }));
        setImportJobs(jSnap.docs.map((d) => d.data() as ImportJob));
      } catch {
        // Collections may be empty prior to initial seed
      }
    };
    loadAdminLists();
    if (tab === 'affiliate') {
      onRefreshAffiliateMetrics();
    }
  }, [isAdmin, tab, onRefreshAffiliateMetrics]);

  const logAdminAction = async (action: string, targetPath: string) => {
    if (!user) return;
    const id = `log_${Date.now()}`;
    await setDoc(doc(db, 'auditLogs', id), {
      id,
      actorUid: user.uid,
      action,
      targetPath,
      createdAt: serverTimestamp(),
    });
  };

  // ADMIN LOGIN GATE
  if (!user || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-8 p-8 rounded-2xl border border-[#073D35]/15 dark:border-white/15 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-6">
        <div className="flex items-center gap-3">
          <VedashilaCompactMark className="w-11 h-11" />
          <div>
            <h1 className="font-display text-2xl font-semibold text-[#073D35] dark:text-[#F8F2E8]">VEDASHILA Admin Console Sign-In</h1>
            <p className="text-xs text-[#252525]/65 dark:text-[#F8F2E8]/65">
              Firebase Role-Based Access Control (RBAC)
            </p>
          </div>
          <div className="ml-auto w-9 h-9 rounded-xl bg-[#073D35]/10 dark:bg-[#C89A45]/20 text-[#073D35] dark:text-[#C89A45] flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#F8F2E8]/50 dark:bg-[#071A17] text-sm space-y-2">
          <p className="font-medium">How to log in to the Admin Console:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-[#073D35] dark:text-[#C89A45]/80 dark:text-[#F8F2E8]/80">
            <li>Click the <strong>Sign In with Google</strong> button below.</li>
            <li>
              Select the bootstrapped Super Admin account (<code>{BOOTSTRAPPED_ADMIN_EMAIL}</code>) or an authorized UID added in Firestore <code>/admins</code>.
            </li>
            <li>Firestore Security Rules verify your verified Google email token before unlocking write access.</li>
          </ol>
        </div>

        {user && !isAdmin && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p>
              Currently signed in as <strong>{user.email}</strong>, which is not listed as an active admin.
            </p>
            <button type="button" onClick={() => signOutUser()} className="underline font-semibold">
              Sign out and switch Google account
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={async () => {
            setErrMsg(null);
            try {
              await signInWithGoogle();
            } catch (e) {
              setErrMsg(e instanceof Error ? e.message : 'Google Sign-In failed.');
            }
          }}
          className="w-full py-3 px-4 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] font-bold text-sm hover:opacity-90"
        >
          Sign In with Google for Admin Console
        </button>

        {errMsg && <p className="text-xs text-red-600">{errMsg}</p>}
      </div>
    );
  }

  const handleSeed = async () => {
    setBusy(true);
    setErrMsg(null);
    setNotice(null);
    try {
      await onSeedDatabase();
      setNotice('Initial Vedashila Nakshatra catalogue, universes, nested categories, affiliate links, and Indore PINs synced to Firestore.');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Seed failed.');
    } finally {
      setBusy(false);
    }
  };

  // UNIVERSE CRUD HANDLERS
  const resetUniverseForm = () => {
    setEditingUniverseId(null);
    setUniNameEn('');
    setUniNameHi('');
    setUniDescEn('');
    setUniDescHi('');
    setUniImageUrl(PRESET_IMAGES[0].url);
    setUniIndoreOnly(false);
    setUniActive(true);
    setUniSortOrder(String(universes.length + 1));
  };

  const startEditUniverse = (u: Universe) => {
    setEditingUniverseId(u.id);
    setUniNameEn(u.nameEn);
    setUniNameHi(u.nameHi);
    setUniDescEn(u.subtitleEn);
    setUniDescHi(u.subtitleHi);
    setUniImageUrl(u.imageUrl || '');
    setUniIndoreOnly(u.indoreOnly);
    setUniActive(u.active);
    setUniSortOrder(String(u.sortOrder));
  };

  const saveUniverse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniNameEn.trim()) return;
    setBusy(true);
    setErrMsg(null);
    const id = editingUniverseId || uniNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `uni-${Date.now()}`;
    try {
      await setDoc(doc(db, 'universes', id), {
        id,
        nameEn: uniNameEn.trim().slice(0, 100),
        nameHi: (uniNameHi.trim() || uniNameEn.trim()).slice(0, 100),
        subtitleEn: uniDescEn.trim().slice(0, 300),
        subtitleHi: (uniDescHi.trim() || uniDescEn.trim()).slice(0, 300),
        imageUrl: uniImageUrl.trim().slice(0, 500),
        indoreOnly: uniIndoreOnly,
        active: uniActive,
        sortOrder: Number(uniSortOrder) || 1,
        updatedAt: serverTimestamp(),
      });
      await logAdminAction(editingUniverseId ? 'UPDATE_UNIVERSE' : 'CREATE_UNIVERSE', `universes/${id}`);
      await onRefreshCatalogue();
      setNotice(`Shopping Universe "${uniNameEn.trim()}" saved to Firestore.`);
      resetUniverseForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `universes/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const deleteUniverse = async (id: string) => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'universes', id));
      await logAdminAction('DELETE_UNIVERSE', `universes/${id}`);
      await onRefreshCatalogue();
      setConfirmDeleteUniId(null);
      if (editingUniverseId === id) resetUniverseForm();
      setNotice(`Universe "${id}" deleted from Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `universes/${id}`);
    } finally {
      setBusy(false);
    }
  };

  // CATEGORY CRUD HANDLERS
  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCatParentId('');
    setCatNameEn('');
    setCatNameHi('');
    setCatDescEn('');
    setCatImageUrl('');
    setCatActive(true);
    setCatSortOrder(String(categories.length + 1));
  };

  const startEditCategory = (c: Category) => {
    setEditingCategoryId(c.id);
    setCatUniverseId(c.universeId);
    setCatParentId(c.parentCategoryId || '');
    setCatNameEn(c.nameEn);
    setCatNameHi(c.nameHi);
    setCatDescEn(c.descriptionEn || '');
    setCatImageUrl(c.imageUrl || '');
    setCatActive(c.active);
    setCatSortOrder(String(c.sortOrder ?? 1));
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameEn.trim() || !catUniverseId) return;
    setBusy(true);
    setErrMsg(null);
    const id = editingCategoryId || catNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now()}`;
    try {
      const payload: Record<string, unknown> = {
        id,
        universeId: catUniverseId,
        nameEn: catNameEn.trim().slice(0, 100),
        nameHi: (catNameHi.trim() || catNameEn.trim()).slice(0, 100),
        descriptionEn: catDescEn.trim().slice(0, 300),
        imageUrl: catImageUrl.trim().slice(0, 500),
        sortOrder: Number(catSortOrder) || 1,
        active: catActive,
        updatedAt: serverTimestamp(),
      };
      if (catParentId && catParentId !== id) {
        payload.parentCategoryId = catParentId;
      } else {
        payload.parentCategoryId = '';
      }
      await setDoc(doc(db, 'categories', id), payload);
      await logAdminAction(editingCategoryId ? 'UPDATE_CATEGORY' : 'CREATE_CATEGORY', `categories/${id}`);
      await onRefreshCatalogue();
      setNotice(`Category "${catNameEn.trim()}" saved to Firestore.`);
      resetCategoryForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `categories/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'categories', id));
      await logAdminAction('DELETE_CATEGORY', `categories/${id}`);
      await onRefreshCatalogue();
      setConfirmDeleteCatId(null);
      if (editingCategoryId === id) resetCategoryForm();
      setNotice(`Category "${id}" deleted from Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const moveCategoryOrder = async (cat: Category, direction: -1 | 1) => {
    const siblings = categories
      .filter((c) => c.universeId === cat.universeId && (c.parentCategoryId || '') === (cat.parentCategoryId || ''))
      .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    const idx = siblings.findIndex((c) => c.id === cat.id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return;
    const target = siblings[swapIdx];
    const currentOrder = cat.sortOrder ?? idx + 1;
    const targetOrder = target.sortOrder ?? swapIdx + 1;
    setBusy(true);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'categories', cat.id), { ...cat, sortOrder: targetOrder === currentOrder ? swapIdx + 1 : targetOrder, updatedAt: serverTimestamp() });
      batch.set(doc(db, 'categories', target.id), { ...target, sortOrder: targetOrder === currentOrder ? idx + 1 : currentOrder, updatedAt: serverTimestamp() });
      await batch.commit();
      await logAdminAction('REORDER_CATEGORY', `categories/${cat.id}`);
      await onRefreshCatalogue();
      setNotice(`Reordered "${cat.nameEn}" in navigation.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `categories/${cat.id}`);
    } finally {
      setBusy(false);
    }
  };

  const mergeCategories = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSourceCatId || !mergeTargetCatId || mergeSourceCatId === mergeTargetCatId) {
      setErrMsg('Choose two different categories to merge.');
      return;
    }
    const sourceCat = categories.find((c) => c.id === mergeSourceCatId);
    const targetCat = categories.find((c) => c.id === mergeTargetCatId);
    if (!sourceCat || !targetCat) return;
    setBusy(true);
    setErrMsg(null);
    try {
      const batch = writeBatch(db);
      products
        .filter((p) => p.categoryId === sourceCat.id)
        .forEach((p) => {
          batch.update(doc(db, 'products', p.id), {
            categoryId: targetCat.id,
            universeId: targetCat.universeId,
            updatedAt: serverTimestamp(),
          });
        });
      categories
        .filter((c) => c.parentCategoryId === sourceCat.id)
        .forEach((child) => {
          batch.set(doc(db, 'categories', child.id), {
            ...child,
            parentCategoryId: targetCat.id,
            universeId: targetCat.universeId,
            updatedAt: serverTimestamp(),
          });
        });
      batch.set(doc(db, 'categories', sourceCat.id), {
        ...sourceCat,
        active: false,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      await logAdminAction('MERGE_CATEGORIES', `${sourceCat.id}->${targetCat.id}`);
      await onRefreshCatalogue();
      setMergeSourceCatId('');
      setMergeTargetCatId('');
      setNotice(`Merged "${sourceCat.nameEn}" into "${targetCat.nameEn}" and reassigned all matching products.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `categories/${mergeSourceCatId}`);
    } finally {
      setBusy(false);
    }
  };

  // AFFILIATE CAMPAIGN & LINK CRUD HANDLERS
  const saveAffiliateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;
    setBusy(true);
    const id = `camp-${Date.now()}`;
    try {
      await setDoc(doc(db, 'affiliateCampaigns', id), {
        id,
        merchantId: campMerchantId,
        name: campName.trim().slice(0, 120),
        description: campDesc.trim().slice(0, 300),
        isVerifiedPartner: campVerified,
        active: true,
        updatedAt: serverTimestamp(),
      });
      await logAdminAction('CREATE_AFFILIATE_CAMPAIGN', `affiliateCampaigns/${id}`);
      await onRefreshCatalogue();
      setCampName('');
      setCampDesc('');
      setNotice(`Affiliate campaign "${campName.trim()}" created.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `affiliateCampaigns/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const resetAffiliateLinkForm = () => {
    setEditingLinkId(null);
    setLinkLabel('');
    setLinkMerchantId('amazon-associates-in');
    setLinkCampaignId('');
    setLinkDestUrl('');
    setLinkCode('');
    setLinkTags('');
    setLinkDisclosure('');
    setLinkTrackable(false);
    setLinkActive(true);
  };

  const startEditAffiliateLink = (l: AffiliateLink) => {
    setEditingLinkId(l.id);
    setLinkLabel(l.label);
    setLinkMerchantId(l.merchantId);
    setLinkCampaignId(l.campaignId || '');
    setLinkDestUrl(l.destinationUrl);
    setLinkCode(l.trackingCode);
    setLinkTags((l.tags || []).join(', '));
    setLinkDisclosure(l.disclosureNote || '');
    setLinkTrackable(l.conversionTrackable);
    setLinkActive(l.active);
  };

  const saveAffiliateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkLabel.trim() || !/^https?:\/\//i.test(linkDestUrl.trim())) {
      setErrMsg('Please provide a label and a valid https:// destination URL.');
      return;
    }
    setBusy(true);
    setErrMsg(null);
    const cleanCode =
      (linkCode.trim() || linkLabel.trim())
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || `ref-${Date.now()}`;
    const id = editingLinkId || `aff-${cleanCode}-${Date.now().toString().slice(-4)}`;
    const parsedTags = linkTags
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);

    try {
      await setDoc(doc(db, 'affiliateLinks', id), {
        id,
        label: linkLabel.trim().slice(0, 140),
        merchantId: linkMerchantId,
        campaignId: linkCampaignId || '',
        destinationUrl: linkDestUrl.trim().slice(0, 500),
        trackingCode: cleanCode,
        tags: parsedTags,
        disclosureNote: linkDisclosure.trim().slice(0, 300),
        conversionTrackable: linkTrackable,
        conversions: editingLinkId ? affiliateLinks.find((x) => x.id === editingLinkId)?.conversions ?? 0 : 0,
        active: linkActive,
        updatedAt: serverTimestamp(),
      });
      await logAdminAction(editingLinkId ? 'UPDATE_AFFILIATE_LINK' : 'CREATE_AFFILIATE_LINK', `affiliateLinks/${id}`);
      await onRefreshCatalogue();
      setNotice(`Affiliate link "${linkLabel.trim()}" saved and integrated with Affiliate Disclosure.`);
      resetAffiliateLinkForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `affiliateLinks/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const incrementVerifiedConversion = async (link: AffiliateLink) => {
    if (!link.conversionTrackable) return;
    try {
      const nextCount = (link.conversions || 0) + 1;
      await setDoc(
        doc(db, 'affiliateLinks', link.id),
        { ...link, conversions: nextCount, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await logAdminAction('RECORD_AFFILIATE_CONVERSION', `affiliateLinks/${link.id}`);
      await onRefreshCatalogue();
      setNotice(`Recorded verified conversion on "${link.label}".`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `affiliateLinks/${link.id}`);
    }
  };

  const deleteAffiliateLink = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'affiliateLinks', id));
      await logAdminAction('DELETE_AFFILIATE_LINK', `affiliateLinks/${id}`);
      await onRefreshCatalogue();
      setNotice(`Affiliate link ${id} deleted.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `affiliateLinks/${id}`);
    }
  };

  const saveAmazonPartnerTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amazonMerchant) return;
    const cleanTag = amazonTagInput.trim();
    if (cleanTag && !/^[a-zA-Z0-9_-]{2,40}$/.test(cleanTag)) {
      setErrMsg('Partner Tag must be 2–40 alphanumeric characters, hyphens, or underscores (e.g. vedashila-21).');
      return;
    }
    setBusy(true);
    setErrMsg(null);
    try {
      await setDoc(
        doc(db, 'merchants', amazonMerchant.id),
        {
          ...amazonMerchant,
          verifiedTrackingId: cleanTag,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await logAdminAction('UPDATE_AMAZON_PARTNER_TAG', `merchants/${amazonMerchant.id}`);
      await onRefreshCatalogue();
      setNotice(
        cleanTag
          ? `Saved Amazon Associates Partner Tag "${cleanTag}" for manual affiliate link creation (PA-API stays disabled).`
          : 'Cleared stored Amazon Partner Tag.'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `merchants/${amazonMerchant.id}`);
    } finally {
      setBusy(false);
    }
  };

  const applyAmazonPartnerTagToUrl = async (
    rawUrl: string,
    onResult: (taggedUrl: string) => void
  ) => {
    setErrMsg(null);
    try {
      const res = await fetch('/api/integrations/amazon/build-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationUrl: rawUrl,
          partnerTag: amazonTagInput.trim() || amazonMerchant?.verifiedTrackingId || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrMsg(data.error || 'Could not apply Amazon Partner Tag.');
        return;
      }
      if (data.taggedUrl) {
        onResult(data.taggedUrl);
        setNotice(data.note || `Applied Amazon Partner Tag (${data.tagApplied}).`);
      }
    } catch (error) {
      setErrMsg(error instanceof Error ? error.message : 'Failed to build Amazon affiliate link.');
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setNewProdId('');
    setNewProdTitle('');
    setNewProdTitleHi('');
    setNewProdBrand('');
    setNewProdDescEn('');
    setNewProdDescHi('');
    setNewProdPermissions('Authorized manual catalogue entry');
    setNewProdUniverse('vastra-mandala');
    setNewProdCategory('sarees-ethnic');
    setNewProdMerchant('vedashila-direct');
    setNewProdMode('direct');
    setNewProdPrice('');
    setNewProdPriceVerified(true);
    setNewProdUrl('');
    setNewProdImageUrl(PRESET_IMAGES[0].url);
    setNewProdImageRights('owned');
    setNewProdIndoreOnly(false);
    setNewProdStatus('published');
  };

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setNewProdId(p.id);
    setNewProdTitle(p.titleEn);
    setNewProdTitleHi(p.titleHi || '');
    setNewProdBrand(p.brand || '');
    setNewProdDescEn(p.descriptionEn || '');
    setNewProdDescHi(p.descriptionHi || '');
    setNewProdPermissions(p.contentPermissions || 'Authorized manual catalogue entry');
    setNewProdUniverse(p.universeId);
    setNewProdCategory(p.categoryId);
    setNewProdMerchant(p.merchantId);
    setNewProdMode(p.purchaseMode);
    setNewProdPrice(typeof p.priceInr === 'number' ? String(p.priceInr) : '');
    setNewProdPriceVerified(p.priceVerified);
    setNewProdUrl(p.externalUrl || '');
    setNewProdImageUrl(p.imageUrl || '');
    setNewProdImageRights(p.imageRightsStatus);
    setNewProdIndoreOnly(p.indoreOnly);
    setNewProdStatus(p.status);
    setTab('products');
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdTitle.trim()) return;
    setErrMsg(null);

    if (newProdMode === 'external') {
      if (!newProdUrl.trim() || !/^https?:\/\//i.test(newProdUrl.trim())) {
        setErrMsg('External merchant products require a valid manually entered https:// URL.');
        return;
      }
    }

    const numericPrice = newProdPrice.trim() ? Number(newProdPrice.trim()) : undefined;
    if (newProdMode === 'direct') {
      if (numericPrice === undefined || !Number.isFinite(numericPrice) || numericPrice <= 0) {
        setErrMsg('Direct Razorpay products require an explicit verified numeric INR price.');
        return;
      }
    } else if (numericPrice !== undefined && (!Number.isFinite(numericPrice) || numericPrice <= 0)) {
      setErrMsg('Optional display price must be a positive number or left blank.');
      return;
    }

    const rawId = editingProductId || newProdId.trim() || `prod_${Date.now()}`;
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
    if (!id) {
      setErrMsg('Invalid Product ID.');
      return;
    }

    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);
    const isExternalUnverifiedMerchant =
      newProdMerchant === 'amazon-associates-in' || newProdMerchant === 'blinkit-indore';
    const verifiedFlag =
      newProdMode === 'direct'
        ? true
        : isExternalUnverifiedMerchant
        ? false
        : Boolean(newProdPriceVerified && numericPrice !== undefined);

    const payload: Record<string, unknown> = {
      id,
      titleEn: newProdTitle.trim().slice(0, 180),
      titleHi: (newProdTitleHi.trim() || newProdTitle.trim()).slice(0, 180),
      brand: newProdBrand.trim().slice(0, 80) || 'Vedashila Hub',
      descriptionEn: (newProdDescEn.trim() || 'Authorized manual catalogue entry via Vedashila Admin Console.').slice(0, 2000),
      descriptionHi: (newProdDescHi.trim() || 'वेदशिला एडमिन कंसोल द्वारा जोड़ा गया अधिकृत उत्पाद।').slice(0, 2000),
      universeId: newProdUniverse,
      categoryId: newProdCategory,
      merchantId: newProdMerchant,
      purchaseMode: newProdMode,
      priceVerified: verifiedFlag,
      indoreOnly: newProdIndoreOnly || newProdUniverse === 'annapurna-orbit',
      imageUrl: newProdImageUrl.trim().slice(0, 500),
      imageRightsStatus: newProdImageUrl.trim() ? newProdImageRights : 'pending_review',
      contentPermissions: newProdPermissions.trim().slice(0, 240) || 'Authorized manual catalogue entry',
      lastUpdated: today,
      status: newProdStatus,
      isFixture: false,
      updatedAt: serverTimestamp(),
    };

    if (newProdMode === 'external' && newProdUrl.trim()) {
      payload.externalUrl = newProdUrl.trim().slice(0, 500);
    } else if (newProdUrl.trim()) {
      payload.externalUrl = newProdUrl.trim().slice(0, 500);
    }
    if (numericPrice !== undefined) {
      payload.priceInr = numericPrice;
    }

    try {
      await setDoc(doc(db, 'products', id), payload);
      await logAdminAction(editingProductId ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT', `products/${id}`);
      await onRefreshCatalogue();
      setNotice(
        editingProductId
          ? `Product "${newProdTitle.trim()}" updated in Firestore.`
          : `Product "${newProdTitle.trim()}" (${id}) saved to Firestore.`
      );
      resetProductForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'products', id));
      await logAdminAction('DELETE_PRODUCT', `products/${id}`);
      await onRefreshCatalogue();
      setConfirmDeleteProdId(null);
      if (editingProductId === id) resetProductForm();
      setNotice(`Product "${id}" deleted from Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const toggleProductStatus = async (p: Product, status: Product['status']) => {
    try {
      await updateDoc(doc(db, 'products', p.id), { status, updatedAt: serverTimestamp() });
      await logAdminAction(`PRODUCT_${status.toUpperCase()}`, `products/${p.id}`);
      await onRefreshCatalogue();
      setNotice(`Updated ${p.titleEn} to ${status}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${p.id}`);
    }
  };

  const updateMerchantStatus = async (m: Merchant, status: MerchantStatus) => {
    try {
      await setDoc(doc(db, 'merchants', m.id), { ...m, status, updatedAt: serverTimestamp() }, { merge: true });
      await logAdminAction(`MERCHANT_${status.toUpperCase()}`, `merchants/${m.id}`);
      await onRefreshCatalogue();
      setNotice(`Merchant ${m.name} set to ${status}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `merchants/${m.id}`);
    }
  };

  const saveServiceArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin.trim())) {
      setErrMsg('Enter a valid 6-digit Indore PIN code.');
      return;
    }
    const id = `indore-${newPin.trim()}`;
    try {
      await setDoc(doc(db, 'serviceAreas', id), {
        id,
        city: 'Indore',
        pincode: newPin.trim(),
        locality: newLocality.trim() || 'Indore Service Zone',
        serviceable: true,
        eligibleMerchants: ['blinkit-indore', 'vedashila-direct'],
        note: 'Configured in Admin Console. Final availability determined by merchant.',
        updatedAt: serverTimestamp(),
      });
      await logAdminAction('UPSERT_SERVICE_AREA', `serviceAreas/${id}`);
      await onRefreshCatalogue();
      setNewPin('');
      setNewLocality('');
      setNotice(`Service area ${id} saved.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `serviceAreas/${id}`);
    }
  };

  const toggleServiceArea = async (area: ServiceArea) => {
    try {
      await setDoc(
        doc(db, 'serviceAreas', area.id),
        { ...area, serviceable: !area.serviceable, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await onRefreshCatalogue();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `serviceAreas/${area.id}`);
    }
  };

  const saveSettings = async () => {
    if (domainInput.toLowerCase().includes('vedashila.in')) {
      setErrMsg('Domain vedashila.in is prohibited per project rules. Keep configurable or enter your new domain.');
      return;
    }
    setErrMsg(null);
    try {
      await setDoc(doc(db, 'systemSettings', 'global'), {
        id: 'global',
        publicDomain: domainInput.trim() || 'configurable-domain-pending',
        festiveTheme,
        aiSaathiEnabled: aiEnabled,
        aiDailyLimitPerUser: Number(aiLimit) || 40,
        updatedAt: serverTimestamp(),
      });
      await logAdminAction('UPDATE_SYSTEM_SETTINGS', 'systemSettings/global');
      await onRefreshCatalogue();
      setNotice('System settings saved to Firestore.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'systemSettings/global');
    }
  };

  const generateAiDraft = async () => {
    if (!aiTopic.trim()) return;
    setBusy(true);
    setErrMsg(null);
    try {
      const res = await fetch('/api/ai/admin-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType: aiTaskType, topic: aiTopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI assist failed');
      setAiDraft(data.draft);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'AI assist failed');
    } finally {
      setBusy(false);
    }
  };

  const approveAndSaveDraft = async () => {
    if (!aiDraft) return;
    const id = `guide_${Date.now()}`;
    try {
      await setDoc(doc(db, 'blogPosts', id), {
        id,
        title: aiDraft.title.slice(0, 180),
        slug: aiDraft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 100),
        excerpt: aiDraft.excerpt.slice(0, 400),
        content: aiDraft.body.slice(0, 10000),
        universeId: 'vastra-mandala',
        status: 'published',
        updatedAt: serverTimestamp(),
      });
      await logAdminAction('APPROVE_AI_CONTENT', `blogPosts/${id}`);
      await onRefreshCatalogue();
      setAiDraft(null);
      setAiTopic('');
      setNotice('Draft approved by Admin and published to Buying Guides.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `blogPosts/${id}`);
    }
  };

  const validateImport = async () => {
    setBusy(true);
    setErrMsg(null);
    setImportErrors([]);
    setImportWarnings([]);
    try {
      const res = await fetch('/api/imports/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: importSource,
          rawContent: importText,
          existingIds: products.map((p) => p.id),
          amazonPartnerTag: amazonTagInput.trim() || amazonMerchant?.verifiedTrackingId || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      setImportPreview(data.preview || []);
      setImportStats({ total: data.totalRows, valid: data.validRows, dupes: data.duplicatesSkipped });
      setImportErrors(Array.isArray(data.errors) ? data.errors : []);
      setImportWarnings(Array.isArray(data.warnings) ? data.warnings : []);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Import validation failed');
    } finally {
      setBusy(false);
    }
  };

  const commitApprovedImport = async () => {
    if (!importPreview || importPreview.length === 0 || !user) return;
    setBusy(true);
    setErrMsg(null);
    try {
      for (const p of importPreview) {
        const cleanDoc: Record<string, unknown> = {
          id: p.id,
          titleEn: p.titleEn,
          titleHi: p.titleHi || p.titleEn,
          brand: p.brand || 'Vedashila Hub',
          descriptionEn: p.descriptionEn,
          descriptionHi: p.descriptionHi || p.descriptionEn,
          universeId: p.universeId,
          categoryId: p.categoryId,
          merchantId: p.merchantId,
          purchaseMode: p.purchaseMode,
          priceVerified: p.priceVerified,
          indoreOnly: p.indoreOnly,
          imageUrl: p.imageUrl || '',
          imageRightsStatus: p.imageRightsStatus || 'pending_review',
          contentPermissions: p.contentPermissions || 'Authorized manual CSV/JSON entry',
          lastUpdated: p.lastUpdated || new Date().toISOString().slice(0, 10),
          status: importTargetStatus,
          isFixture: false,
          updatedAt: serverTimestamp(),
        };
        if (p.externalUrl) cleanDoc.externalUrl = p.externalUrl;
        if (typeof p.priceInr === 'number' && Number.isFinite(p.priceInr)) {
          cleanDoc.priceInr = p.priceInr;
        }
        await setDoc(doc(db, 'products', p.id), cleanDoc);
      }
      const jobId = `job_${Date.now()}`;
      await setDoc(doc(db, 'importJobs', jobId), {
        id: jobId,
        merchantId: importPreview[0]?.merchantId || 'vedashila-com',
        sourceType: importSource,
        totalRows: importStats?.total || importPreview.length,
        validRows: importPreview.length,
        duplicatesSkipped: importStats?.dupes || 0,
        status: 'completed',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      await logAdminAction('COMMIT_IMPORT_JOB', `importJobs/${jobId}`);
      await onRefreshCatalogue();
      setImportPreview(null);
      setImportText('');
      setImportErrors([]);
      setImportWarnings([]);
      setNotice(`Imported ${importPreview.length} authorized products into Firestore (${importTargetStatus}).`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'importJobs');
    } finally {
      setBusy(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = [
      'id,titleEn,titleHi,brand,descriptionEn,universeId,categoryId,merchantId,purchaseMode,externalUrl,priceInr,priceVerified,indoreOnly,imageUrl,imageRightsStatus,contentPermissions',
      'manual-vs-direct-01,"Chanderi Handloom Dupatta","चंदेरी हैंडलूम दुपट्टा","Vedashila Artisanal","Handwoven Chanderi silk-cotton stole sold directly via Razorpay.",vastra-mandala,sarees-ethnic,vedashila-direct,direct,,1499,true,false,/src/assets/images/universe_vastra_saree_1794542200475.jpg,owned,"First-party Vedashila direct SKU"',
      'manual-amz-item-01,"Reference Amazon Wireless Earbuds","वायरलेस ईयरबड्स","Amazon Curated Pick","Curated electronics recommendation linking to Amazon India.",tech-tara,audio-wearables,amazon-associates-in,external,https://www.amazon.in/dp/B000000000,,false,false,/src/assets/images/universe_tech_tara_1794542200408.jpg,owned,"Original studio image + Amazon Associates manual link"',
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vedashila_manual_catalogue_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'universes', label: 'Universes & Categories', icon: Orbit },
    { id: 'affiliate', label: 'Affiliate Links', icon: Link2 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'merchants', label: 'Merchants', icon: Store },
    { id: 'grocery', label: 'Indore Grocery', icon: MapPin },
    { id: 'orders', label: 'Direct Orders', icon: ReceiptIndianRupee },
    { id: 'ai', label: 'AI Control', icon: Sparkles },
    { id: 'content', label: 'Themes & Guides', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'imports', label: 'Import Feeds', icon: UploadCloud },
    { id: 'security', label: 'Security Centre', icon: ShieldAlert },
  ];

  const confirmedRevenue = directOrders
    .filter((o) => o.paymentStatus === 'verified_paid')
    .reduce((sum, o) => sum + o.totalInr, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#073D35]/10 dark:border-[#C89A45]/20 pb-5">
        <div className="flex items-center gap-3.5">
          <VedashilaCompactMark className="w-11 h-11 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[#073D35] dark:text-[#C89A45] uppercase tracking-wider">
              Signed in as Admin · {user.email}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#073D35] dark:text-[#F8F2E8]">
              VEDASHILA Marketplace Pro Admin Console
            </h1>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={handleSeed}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] text-xs font-bold hover:opacity-90 self-start md:self-auto"
        >
          <Database className="w-4 h-4" />
          {firestoreSeeded ? 'Re-Sync Initial Catalogue' : 'Initialize Firestore Catalogue'}
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-[#073D35]/10 border border-[#073D35]/40 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#073D35] dark:text-[#C89A45] shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {errMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${
                  tab === item.id
                    ? 'bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45]'
                    : 'hover:bg-[#FFFFFF] dark:hover:bg-[#0E2924]/80'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-9 p-6 rounded-2xl border border-[#073D35]/12 dark:border-white/12 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold">Platform Overview</h2>
                <button
                  type="button"
                  onClick={fetchIntegrationStatus}
                  disabled={statusLoading}
                  className="px-3 py-1.5 rounded-lg border border-[#073D35]/15 dark:border-white/20 text-xs font-semibold hover:border-[#C89A45]"
                >
                  {statusLoading ? 'Checking Backend Status...' : 'Refresh Configuration Status'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-[#073D35]/10 dark:border-[#F8F2E8]/10">
                  <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65">Active Universes</p>
                  <p className="font-mono-num text-2xl font-semibold mt-1">{universes.filter((u) => u.active).length}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#073D35]/10 dark:border-[#F8F2E8]/10">
                  <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65">Published Products</p>
                  <p className="font-mono-num text-2xl font-semibold mt-1">{products.filter((p) => p.status === 'published').length}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#073D35]/10 dark:border-[#F8F2E8]/10">
                  <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65">Tracked Affiliate Links</p>
                  <p className="font-mono-num text-2xl font-semibold mt-1">{affiliateLinks.length}</p>
                </div>
                <div className="p-4 rounded-xl border border-[#073D35]/10 dark:border-[#F8F2E8]/10">
                  <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65">Verified Direct Revenue</p>
                  <p className="font-mono-num text-2xl font-semibold mt-1">₹{confirmedRevenue.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Integration & Optional Credentials Status */}
              <div className="p-5 rounded-xl bg-[#F8F2E8] dark:bg-[#071A17] border border-[#073D35]/10 dark:border-white/10 space-y-3">
                <h3 className="font-semibold text-sm">Integration & Credential Configuration Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#0E2924] border border-[#073D35]/30 space-y-1">
                    <p className="font-semibold text-[#073D35] dark:text-[#C89A45]">Manual Firestore Catalogue & CSV Import · Active</p>
                    <p className="text-[#252525]/75 dark:text-[#F8F2E8]/75">
                      {integrationStatus?.manualCatalogue.message ||
                        'Manual Firestore product CRUD, merchant URLs, and CSV/JSON import are operational without external API keys.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#0E2924] border border-[#073D35]/12 dark:border-white/15 space-y-1">
                    <p className="font-semibold text-[#C89A45]">
                      Amazon Associates ·{' '}
                      {integrationStatus?.amazonAssociates.paApiEnabled
                        ? 'PA-API Enabled'
                        : integrationStatus?.amazonAssociates.partnerTagConfigured || amazonMerchant?.verifiedTrackingId
                        ? 'Manual Tag Mode Active (PA-API Disabled)'
                        : 'Manual Links Active (Optional Credentials)'}
                    </p>
                    <p className="text-[#252525]/75 dark:text-[#F8F2E8]/75">
                      {integrationStatus?.amazonAssociates.message ||
                        'AMAZON_ACCESS_KEY and AMAZON_SECRET_KEY are optional in development. Use AMAZON_PARTNER_TAG or Admin Merchant settings for manual affiliate links.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#0E2924] border border-[#073D35]/12 dark:border-white/15 space-y-1">
                    <p className="font-semibold text-[#252525] dark:text-[#C89A45]">
                      Factori / Vedashila.com API ·{' '}
                      {integrationStatus?.factoriApi.enabled ? 'Credentials Present' : 'Disabled in Development (Optional)'}
                    </p>
                    <p className="text-[#252525]/75 dark:text-[#F8F2E8]/75">
                      {integrationStatus?.factoriApi.message ||
                        'FACTORI_API_ENDPOINT and FACTORI_API_KEY are optional during development. API sync stays disabled; manage Vedashila.com items via Manual Catalogue or CSV Import.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#0E2924] border border-[#073D35]/12 dark:border-white/15 space-y-1">
                    <p className="font-semibold text-[#252525] dark:text-white">
                      Razorpay & Gemini AI Backend Services
                    </p>
                    <p className="text-[#252525]/75 dark:text-[#F8F2E8]/75">
                      Razorpay Direct: {integrationStatus?.razorpayDirect.enabled ? 'Configured' : 'Awaiting server keys'} ·
                      Gemini AI Saathi: {integrationStatus?.geminiAi.enabled ? 'Configured' : 'Awaiting GEMINI_API_KEY'}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F2E8]/40 dark:bg-[#071A17] text-xs space-y-1">
                <p className="font-semibold">System Readiness Alerts</p>
                <p>• Firestore Sync: {firestoreSeeded ? 'Active in Cloud Firestore' : 'Using initial fixtures — click "Initialize Firestore Catalogue" above to persist.'}</p>
                <p>• Domain Configuration: {systemSettings.publicDomain} (vedashila.in blocked)</p>
                <p>• Amazon Associates Reference Stored: https://link.amazon/B0eJUJQ2I · Partner Tag: {integrationStatus?.amazonAssociates.partnerTagConfigured ? 'Configured in Server Env' : amazonMerchant?.verifiedTrackingId || 'Not set yet (optional)'}</p>
              </div>
            </div>
          )}

          {/* TAB: DYNAMIC SHOPPING UNIVERSES & NESTED CATEGORIES */}
          {tab === 'universes' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-2xl font-semibold">Shopping Universes & Nested Categories</h2>
                <p className="text-xs text-[#073D35] dark:text-[#C89A45]/70 dark:text-[#F8F2E8]/70 mt-1">
                  Create, edit, or delete Shopping Universes and nested Categories in Firestore. Changes reflect immediately in the Constellation and Catalogue navigation.
                </p>
              </div>

              {/* 1. Universe Form */}
              <form onSubmit={saveUniverse} className="p-5 rounded-xl bg-[#F8F2E8]/35 dark:bg-[#071A17] space-y-4 border border-[#073D35]/10 dark:border-[#F8F2E8]/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {editingUniverseId ? `Editing Universe: ${editingUniverseId}` : 'Create New Shopping Universe'}
                  </h3>
                  {editingUniverseId && (
                    <button type="button" onClick={resetUniverseForm} className="text-xs underline">
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Universe Name (English) *"
                    value={uniNameEn}
                    onChange={(e) => setUniNameEn(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Universe Name (Hindi)"
                    value={uniNameHi}
                    onChange={(e) => setUniNameHi(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Description (English)"
                    value={uniDescEn}
                    onChange={(e) => setUniDescEn(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Description (Hindi)"
                    value={uniDescHi}
                    onChange={(e) => setUniDescHi(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-5">
                      <select
                        aria-label="Choose preset universe image"
                        value={PRESET_IMAGES.some((p) => p.url === uniImageUrl) ? uniImageUrl : ''}
                        onChange={(e) => e.target.value && setUniImageUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-xs"
                      >
                        <option value="">Custom Image URL</option>
                        {PRESET_IMAGES.map((img) => (
                          <option key={img.url} value={img.url}>{img.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Associated Image URL (/src/... or https://...)"
                        value={uniImageUrl}
                        onChange={(e) => setUniImageUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2 h-10 rounded-lg overflow-hidden border border-[#073D35]/15">
                      <ResilientImage src={uniImageUrl} alt="Preview" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={uniIndoreOnly} onChange={(e) => setUniIndoreOnly(e.target.checked)} />
                    Indore-Only Grocery Restriction
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={uniActive} onChange={(e) => setUniActive(e.target.checked)} />
                    Active in Navigation
                  </label>
                  <label className="flex items-center gap-1.5">
                    <span>Sort Order:</span>
                    <input
                      type="number"
                      value={uniSortOrder}
                      onChange={(e) => setUniSortOrder(e.target.value)}
                      className="w-16 px-2 py-1 rounded border border-[#073D35]/15 bg-white dark:bg-[#0E2924] font-mono-num"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {editingUniverseId ? 'Update Universe' : 'Create Universe'}
                  </button>
                </div>
              </form>

              {/* 2. Nested Category Form */}
              <form onSubmit={saveCategory} className="p-5 rounded-xl bg-[#F8F2E8]/35 dark:bg-[#071A17] space-y-4 border border-[#073D35]/10 dark:border-[#F8F2E8]/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {editingCategoryId ? `Editing Category: ${editingCategoryId}` : 'Create Nested Category / Subcategory'}
                  </h3>
                  {editingCategoryId && (
                    <button type="button" onClick={resetCategoryForm} className="text-xs underline">
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Parent Shopping Universe *</label>
                    <select
                      value={catUniverseId}
                      onChange={(e) => {
                        setCatUniverseId(e.target.value);
                        setCatParentId('');
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-sm"
                    >
                      {universes.map((u) => (
                        <option key={u.id} value={u.id}>{u.nameEn}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">Parent Category (Optional for Nesting)</label>
                    <select
                      value={catParentId}
                      onChange={(e) => setCatParentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-sm"
                    >
                      <option value="">None (Top-Level Category)</option>
                      {categories
                        .filter((c) => c.universeId === catUniverseId && c.id !== editingCategoryId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.nameEn}</option>
                        ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Category Name (English) *"
                    value={catNameEn}
                    onChange={(e) => setCatNameEn(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Category Name (Hindi)"
                    value={catNameHi}
                    onChange={(e) => setCatNameHi(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Category Description"
                    value={catDescEn}
                    onChange={(e) => setCatDescEn(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Associated Category Image URL"
                    value={catImageUrl}
                    onChange={(e) => setCatImageUrl(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={catActive} onChange={(e) => setCatActive(e.target.checked)} />
                    Active
                  </label>
                  <label className="flex items-center gap-1.5">
                    <span>Sort Order:</span>
                    <input
                      type="number"
                      value={catSortOrder}
                      onChange={(e) => setCatSortOrder(e.target.value)}
                      className="w-16 px-2 py-1 rounded border border-[#073D35]/15 bg-white dark:bg-[#0E2924] font-mono-num"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C89A45] text-[#073D35] font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {editingCategoryId ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>

              {/* Merge Categories Tool */}
              <form onSubmit={mergeCategories} className="p-5 rounded-xl bg-[#F8F2E8] dark:bg-[#071A17] space-y-3 border border-[#073D35]/10 dark:border-white/10">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <GitMerge className="w-4 h-4 text-[#C89A45]" />
                  <h3>Merge Categories (Reassign Products & Subcategories)</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <select
                    aria-label="Source category to merge"
                    value={mergeSourceCatId}
                    onChange={(e) => setMergeSourceCatId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-xs"
                  >
                    <option value="">Source Category (will deactivate)...</option>
                    {categories.filter((c) => c.active).map((c) => (
                      <option key={c.id} value={c.id}>{c.nameEn}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Target category to merge into"
                    value={mergeTargetCatId}
                    onChange={(e) => setMergeTargetCatId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-xs"
                  >
                    <option value="">Target Destination Category...</option>
                    {categories.filter((c) => c.active && c.id !== mergeSourceCatId).map((c) => (
                      <option key={c.id} value={c.id}>{c.nameEn}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={busy || !mergeSourceCatId || !mergeTargetCatId}
                    className="px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] text-xs font-bold disabled:opacity-50"
                  >
                    Merge Categories
                  </button>
                </div>
              </form>

              {/* 3. Hierarchical Universe & Nested Category Tree */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Active Hierarchy ({universes.length} Universes · {categories.length} Categories)</h3>
                {universes
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((u) => {
                    const uniCats = categories
                      .filter((c) => c.universeId === u.id)
                      .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
                    const topCats = uniCats.filter(
                      (c) => !c.parentCategoryId || !uniCats.some((p) => p.id === c.parentCategoryId)
                    );
                    const renderCategoryBranch = (cat: Category, depth = 0): React.ReactNode => {
                      const children = uniCats.filter((c) => c.parentCategoryId === cat.id && c.id !== cat.id);
                      return (
                        <div key={cat.id} style={{ marginLeft: `${depth * 20}px` }} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[#073D35]/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#071A17]/60 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {cat.imageUrl && (
                                <div className="w-7 h-7 rounded overflow-hidden shrink-0">
                                  <ResilientImage src={cat.imageUrl} alt={cat.nameEn} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {depth > 0 ? '↳ ' : ''}
                                  {cat.nameEn} <span className="opacity-60">({cat.nameHi})</span>
                                  {!cat.active && <span className="ml-2 text-amber-600">(Inactive)</span>}
                                </p>
                                {cat.descriptionEn && <p className="text-[11px] opacity-65 truncate">{cat.descriptionEn}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveCategoryOrder(cat, -1)}
                                aria-label={`Move ${cat.nameEn} up`}
                                className="p-1.5 rounded border border-[#073D35]/15 hover:border-[#C89A45]"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveCategoryOrder(cat, 1)}
                                aria-label={`Move ${cat.nameEn} down`}
                                className="p-1.5 rounded border border-[#073D35]/15 hover:border-[#C89A45]"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditCategory(cat)}
                                aria-label={`Edit ${cat.nameEn}`}
                                className="p-1.5 rounded border border-[#073D35]/15 hover:border-[#C89A45]"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {confirmDeleteCatId === cat.id ? (
                                <button
                                  type="button"
                                  onClick={() => deleteCategory(cat.id)}
                                  className="px-2 py-1 rounded bg-red-600 text-white text-[11px] font-semibold"
                                >
                                  Confirm Delete
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCatId(cat.id)}
                                  aria-label={`Delete ${cat.nameEn}`}
                                  className="p-1.5 rounded border border-red-300 text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          {children.map((ch) => renderCategoryBranch(ch, depth + 1))}
                        </div>
                      );
                    };

                    return (
                      <div key={u.id} className="p-4 rounded-xl border border-[#073D35]/12 dark:border-[#F8F2E8]/12 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {u.imageUrl && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#073D35]/10">
                                <ResilientImage src={u.imageUrl} alt={u.nameEn} />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-base">{u.nameEn}</h4>
                                <span className="text-xs opacity-65">({u.nameHi})</span>
                                <span className="text-[11px] font-mono-num text-[#C89A45]">#{u.sortOrder}</span>
                                {!u.active && <span className="text-[11px] text-amber-600">Hidden</span>}
                              </div>
                              <p className="text-xs text-[#073D35] dark:text-[#C89A45]/70 dark:text-[#F8F2E8]/70">{u.subtitleEn}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditUniverse(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#073D35]/20 text-xs font-medium hover:border-[#C89A45]"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            {confirmDeleteUniId === u.id ? (
                              <button
                                type="button"
                                onClick={() => deleteUniverse(u.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
                              >
                                Confirm Delete
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUniId(u.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>

                        {topCats.length > 0 && (
                          <div className="pl-2 border-t border-[#073D35]/8 dark:border-[#F8F2E8]/8 pt-3 space-y-2">
                            {topCats.map((c) => renderCategoryBranch(c, 0))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB: ADVANCED AFFILIATE LINK MANAGEMENT SYSTEM */}
          {tab === 'affiliate' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-2xl font-semibold">Advanced Affiliate Link & Campaign Manager</h2>
                <p className="text-xs text-[#073D35] dark:text-[#C89A45]/70 dark:text-[#F8F2E8]/70 mt-1">
                  Create custom tracked affiliate links, assign merchants & campaigns, apply tracking tags, and inspect real click-through metrics. Active links automatically appear on the public Affiliate Disclosure page.
                </p>
              </div>

              {/* 0. Verified Amazon Partner Tag Configuration (No PA-API Required) */}
              <form onSubmit={saveAmazonPartnerTag} className="p-4 rounded-xl bg-[#F8F2E8] dark:bg-[#071A17] space-y-3 border border-[#073D35]/12 dark:border-white/12">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm">Verified Amazon Associates Partner Tag (Manual Mode)</h3>
                    <p className="text-xs text-[#252525]/70 dark:text-[#F8F2E8]/70">
                      Add Amazon Associates links using your verified <code>AMAZON_PARTNER_TAG</code> without requiring Amazon PA-API access keys (<code>AMAZON_ACCESS_KEY</code> / <code>AMAZON_SECRET_KEY</code> remain disabled).
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#073D35] dark:text-[#C89A45]">
                    {integrationStatus?.amazonAssociates.partnerTagConfigured
                      ? 'Backend AMAZON_PARTNER_TAG Active'
                      : amazonMerchant?.verifiedTrackingId
                      ? `Merchant Tag: ${amazonMerchant.verifiedTrackingId}`
                      : 'Optional Tag Not Set'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Verified Amazon Partner Tag (e.g. vedashila-21)"
                    value={amazonTagInput}
                    onChange={(e) => setAmazonTagInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-xs font-mono-num"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] text-xs font-bold whitespace-nowrap"
                  >
                    Save Partner Tag
                  </button>
                </div>
              </form>

              {/* 1. Create Campaign Form */}
              <form onSubmit={saveAffiliateCampaign} className="p-4 rounded-xl bg-[#F8F2E8]/35 dark:bg-[#071A17] space-y-3 border border-[#073D35]/10 dark:border-[#F8F2E8]/10">
                <h3 className="font-semibold text-sm">Create Affiliate Campaign</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={campMerchantId}
                    onChange={(e) => setCampMerchantId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-xs"
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Campaign Name (e.g. Diwali Electronics)"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Campaign Description"
                    value={campDesc}
                    onChange={(e) => setCampDesc(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-xs"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={campVerified} onChange={(e) => setCampVerified(e.target.checked)} />
                    Verified Commercial Partner Program
                  </label>
                  <button type="submit" disabled={busy} className="px-4 py-1.5 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] font-semibold">
                    Create Campaign
                  </button>
                </div>
              </form>

              {/* 2. Create / Edit Custom Affiliate Link */}
              <form onSubmit={saveAffiliateLink} className="p-5 rounded-xl bg-[#F8F2E8]/35 dark:bg-[#071A17] space-y-3 border border-[#073D35]/10 dark:border-[#F8F2E8]/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {editingLinkId ? `Editing Affiliate Link: ${editingLinkId}` : 'Create Custom Affiliate Link'}
                  </h3>
                  {editingLinkId && (
                    <button type="button" onClick={resetAffiliateLinkForm} className="text-xs underline">
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Link Label (e.g. Amazon Reference Headphones) *"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      placeholder="Destination URL (https://...) *"
                      value={linkDestUrl}
                      onChange={(e) => setLinkDestUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-sm"
                    />
                    {linkMerchantId === 'amazon-associates-in' && (
                      <button
                        type="button"
                        onClick={() => applyAmazonPartnerTagToUrl(linkDestUrl, setLinkDestUrl)}
                        className="px-3 py-2 rounded-lg border border-[#073D35] dark:border-[#C89A45] text-[#073D35] dark:text-[#C89A45] text-xs font-semibold hover:bg-[#073D35] hover:text-white transition-colors whitespace-nowrap shrink-0"
                      >
                        Apply Partner Tag
                      </button>
                    )}
                  </div>
                  <select
                    value={linkMerchantId}
                    onChange={(e) => setLinkMerchantId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-sm"
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <select
                    value={linkCampaignId}
                    onChange={(e) => setLinkCampaignId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-sm"
                  >
                    <option value="">No Campaign Assigned</option>
                    {affiliateCampaigns
                      .filter((c) => c.merchantId === linkMerchantId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Tracking Code Slug (e.g. amz-diwali-tech)"
                    value={linkCode}
                    onChange={(e) => setLinkCode(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-sm font-mono-num"
                  />
                  <input
                    type="text"
                    placeholder="Tracking Tags (comma-separated: tech, festive)"
                    value={linkTags}
                    onChange={(e) => setLinkTags(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Affiliate Disclosure Note"
                    value={linkDisclosure}
                    onChange={(e) => setLinkDisclosure(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={linkTrackable} onChange={(e) => setLinkTrackable(e.target.checked)} />
                    Conversions Trackable by Merchant
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={linkActive} onChange={(e) => setLinkActive(e.target.checked)} />
                    Active & Disclosed Publicly
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="ml-auto px-4 py-2 rounded-lg bg-[#C89A45] text-[#073D35] font-semibold"
                  >
                    {editingLinkId ? 'Update Affiliate Link' : 'Save Affiliate Link'}
                  </button>
                </div>
              </form>

              {/* 3. Performance Metrics & Active Links */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Tracked Affiliate Links & Live Performance ({affiliateLinks.length})</h3>
                <div className="space-y-3">
                  {affiliateLinks.map((link) => {
                    const m = affiliateMetrics[link.id] || { impressions: 0, clicks: 0 };
                    const ctr = m.impressions > 0 ? ((m.clicks / m.impressions) * 100).toFixed(1) : '0.0';
                    const shareUrl = `${window.location.origin}/?aff=${link.trackingCode}`;
                    const campaign = affiliateCampaigns.find((c) => c.id === link.campaignId);
                    return (
                      <div key={link.id} className="p-4 rounded-xl border border-[#073D35]/12 dark:border-[#F8F2E8]/12 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#C89A45]">
                              <span>{merchants.find((x) => x.id === link.merchantId)?.name || link.merchantId}</span>
                              {campaign && (
                                <>
                                  <span>·</span>
                                  <span>{campaign.name}</span>
                                </>
                              )}
                              <span>·</span>
                              <span className="font-mono-num">{link.trackingCode}</span>
                            </div>
                            <h4 className="font-semibold text-sm">{link.label}</h4>
                            <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65 break-all">{link.destinationUrl}</p>
                            {link.tags?.length > 0 && (
                              <p className="text-[11px] text-[#C89A45]">Tags: {link.tags.join(' · ')}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={async () => {
                                await navigator.clipboard?.writeText(shareUrl);
                                setCopiedLinkId(link.id);
                                setTimeout(() => setCopiedLinkId(null), 1800);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#073D35]/20 text-xs"
                            >
                              {copiedLinkId === link.id ? <Check className="w-3.5 h-3.5 text-[#C89A45]" /> : <Copy className="w-3.5 h-3.5" />}
                              Copy Track URL
                            </button>
                            <a
                              href={link.destinationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => onTrackAffiliateEvent(link.id, 'click')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#073D35]/20 text-xs"
                            >
                              Test Click <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => startEditAffiliateLink(link)}
                              className="p-1.5 rounded border border-[#073D35]/20 text-xs"
                              aria-label="Edit link"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteAffiliateLink(link.id)}
                              className="p-1.5 rounded border border-red-300 text-red-600 text-xs"
                              aria-label="Delete link"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#073D35]/8 dark:border-[#F8F2E8]/8 text-xs">
                          <div>
                            <span className="opacity-65 block">Impressions</span>
                            <span className="font-mono-num font-semibold text-sm">{m.impressions}</span>
                          </div>
                          <div>
                            <span className="opacity-65 block">Tracked Clicks</span>
                            <span className="font-mono-num font-semibold text-sm">{m.clicks}</span>
                          </div>
                          <div>
                            <span className="opacity-65 block">Click-Through Rate</span>
                            <span className="font-mono-num font-semibold text-sm text-[#C89A45]">{ctr}%</span>
                          </div>
                          <div>
                            <span className="opacity-65 block">Conversions</span>
                            {link.conversionTrackable ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono-num font-semibold text-sm">{link.conversions || 0}</span>
                                <button
                                  type="button"
                                  onClick={() => incrementVerifiedConversion(link)}
                                  className="text-[11px] underline text-[#C89A45]"
                                >
                                  + Log Verified
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] opacity-70">Not trackable by merchant</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold">Manual Product Catalogue Management (Firestore)</h2>
                <p className="text-xs text-[#252525]/70 dark:text-[#F8F2E8]/70 mt-1">
                  Create, edit, publish, archive, or delete authorized products directly in Cloud Firestore with manually entered merchant links. External Amazon & Blinkit prices are never fabricated locally.
                </p>
              </div>

              <form onSubmit={handleAddOrUpdateProduct} className="space-y-3 p-5 rounded-xl bg-[#F8F2E8] dark:bg-[#071A17] border border-[#073D35]/10 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {editingProductId ? `Editing Product: ${editingProductId}` : 'Add Authorized Manual Product'}
                  </h3>
                  {editingProductId && (
                    <button type="button" onClick={resetProductForm} className="text-xs underline">
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Product Title (English) *"
                    value={newProdTitle}
                    onChange={(e) => setNewProdTitle(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Product Title (Hindi)"
                    value={newProdTitleHi}
                    onChange={(e) => setNewProdTitleHi(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Brand Name (e.g. Vedashila Artisanal)"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <input
                    type="text"
                    disabled={Boolean(editingProductId)}
                    placeholder="Custom SKU / Product ID (optional)"
                    value={newProdId}
                    onChange={(e) => setNewProdId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm font-mono-num disabled:opacity-60"
                  />
                  <textarea
                    rows={2}
                    placeholder="Authorized Product Description (English)"
                    value={newProdDescEn}
                    onChange={(e) => setNewProdDescEn(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <textarea
                    rows={2}
                    placeholder="Product Description (Hindi)"
                    value={newProdDescHi}
                    onChange={(e) => setNewProdDescHi(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                  <select
                    aria-label="Product Universe"
                    value={newProdUniverse}
                    onChange={(e) => {
                      const nextU = e.target.value;
                      setNewProdUniverse(nextU);
                      const firstCat = categories.find((c) => c.universeId === nextU);
                      if (firstCat) setNewProdCategory(firstCat.id);
                    }}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  >
                    {universes.map((u) => (
                      <option key={u.id} value={u.id}>{u.nameEn}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Product Category"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  >
                    {categories
                      .filter((c) => c.universeId === newProdUniverse)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.nameEn}</option>
                      ))}
                  </select>
                  <select
                    aria-label="Product Merchant"
                    value={newProdMerchant}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setNewProdMerchant(mId);
                      if (mId === 'vedashila-direct') {
                        setNewProdMode('direct');
                        setNewProdPriceVerified(true);
                      } else {
                        setNewProdMode('external');
                        if (mId === 'amazon-associates-in' || mId === 'blinkit-indore') {
                          setNewProdPriceVerified(false);
                        }
                      }
                    }}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Purchase Mode"
                    value={newProdMode}
                    onChange={(e) => setNewProdMode(e.target.value as 'direct' | 'external')}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  >
                    <option value="direct">Direct Sales (Razorpay)</option>
                    <option value="external">External Merchant Link</option>
                  </select>

                  {newProdMode === 'external' && (
                    <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        required
                        placeholder="Manually Entered Merchant Link (https://...) *"
                        value={newProdUrl}
                        onChange={(e) => setNewProdUrl(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                      />
                      {newProdMerchant === 'amazon-associates-in' && (
                        <button
                          type="button"
                          onClick={() => applyAmazonPartnerTagToUrl(newProdUrl, setNewProdUrl)}
                          className="px-3.5 py-2 rounded-lg border border-[#073D35] dark:border-[#C89A45] text-[#073D35] dark:text-[#C89A45] text-xs font-semibold hover:bg-[#073D35] hover:text-white transition-colors whitespace-nowrap shrink-0"
                        >
                          Apply AMAZON_PARTNER_TAG
                        </button>
                      )}
                    </div>
                  )}

                  <input
                    type="number"
                    min="1"
                    required={newProdMode === 'direct'}
                    placeholder={
                      newProdMode === 'direct'
                        ? 'Verified Direct Price (INR) *'
                        : 'Optional Authorized Price (INR, leave blank if live on merchant)'
                    }
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm font-mono-num"
                  />

                  <select
                    aria-label="Product Status"
                    value={newProdStatus}
                    onChange={(e) => setNewProdStatus(e.target.value as Product['status'])}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  >
                    <option value="published">Status: Published</option>
                    <option value="pending_approval">Status: Pending Approval</option>
                    <option value="archived">Status: Archived</option>
                  </select>

                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <select
                      aria-label="Preset Authorized Image"
                      value={PRESET_IMAGES.some((p) => p.url === newProdImageUrl) ? newProdImageUrl : ''}
                      onChange={(e) => e.target.value && setNewProdImageUrl(e.target.value)}
                      className="sm:col-span-4 px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-xs"
                    >
                      <option value="">Custom Authorized Image URL</option>
                      {PRESET_IMAGES.map((img) => (
                        <option key={img.url} value={img.url}>{img.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Authorized Image URL (/src/assets/... or https://...)"
                      value={newProdImageUrl}
                      onChange={(e) => setNewProdImageUrl(e.target.value)}
                      className="sm:col-span-6 px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-xs"
                    />
                    <div className="sm:col-span-2 h-10 rounded-lg overflow-hidden border border-[#073D35]/15">
                      <ResilientImage src={newProdImageUrl} alt="Product image preview" />
                    </div>
                  </div>

                  <select
                    aria-label="Image Rights Status"
                    value={newProdImageRights}
                    onChange={(e) => setNewProdImageRights(e.target.value as Product['imageRightsStatus'])}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  >
                    <option value="owned">Image Rights: Owned</option>
                    <option value="licensed">Image Rights: Licensed</option>
                    <option value="merchant_permitted">Image Rights: Merchant Permitted</option>
                    <option value="pending_review">Image Rights: Pending Review</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Content & Image Rights Attribution"
                    value={newProdPermissions}
                    onChange={(e) => setNewProdPermissions(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={newProdIndoreOnly}
                      onChange={(e) => setNewProdIndoreOnly(e.target.checked)}
                    />
                    Indore-Only Grocery Restriction
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      disabled={newProdMerchant === 'amazon-associates-in' || newProdMerchant === 'blinkit-indore' || newProdMode === 'direct'}
                      checked={
                        newProdMode === 'direct'
                          ? true
                          : newProdMerchant === 'amazon-associates-in' || newProdMerchant === 'blinkit-indore'
                          ? false
                          : newProdPriceVerified
                      }
                      onChange={(e) => setNewProdPriceVerified(e.target.checked)}
                    />
                    Price Verified by Merchant
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="ml-auto px-5 py-2.5 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] text-xs font-bold"
                  >
                    {editingProductId ? 'Save Product Changes' : 'Save Product to Firestore'}
                  </button>
                </div>
              </form>

              {/* Catalogue Filter Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  placeholder="Search catalogue by title, brand, or ID..."
                  value={prodFilterQuery}
                  onChange={(e) => setProdFilterQuery(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-transparent text-xs"
                />
                <select
                  aria-label="Filter catalogue by merchant"
                  value={prodFilterMerchant}
                  onChange={(e) => setProdFilterMerchant(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-xs"
                >
                  <option value="">All Merchants</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter catalogue by status"
                  value={prodFilterStatus}
                  onChange={(e) => setProdFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-white dark:bg-[#0E2924] text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-2">
                {products
                  .filter((p) => {
                    if (prodFilterMerchant && p.merchantId !== prodFilterMerchant) return false;
                    if (prodFilterStatus && p.status !== prodFilterStatus) return false;
                    if (prodFilterQuery.trim()) {
                      const q = prodFilterQuery.toLowerCase();
                      const hay = `${p.id} ${p.titleEn} ${p.brand || ''} ${p.merchantId}`.toLowerCase();
                      if (!hay.includes(q)) return false;
                    }
                    return true;
                  })
                  .map((p) => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-[#073D35]/10 dark:border-[#F8F2E8]/10 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#073D35]/10 shrink-0">
                          <ResilientImage src={p.imageUrl} alt={p.titleEn} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.titleEn}</p>
                          <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65 truncate">
                            {p.merchantId} · {p.purchaseMode} ·{' '}
                            {p.priceVerified && typeof p.priceInr === 'number'
                              ? `₹${p.priceInr.toLocaleString('en-IN')}`
                              : 'Check live price on merchant'}{' '}
                            · Rights: {p.imageRightsStatus} · Status: <strong>{p.status}</strong>
                          </p>
                          {p.externalUrl && (
                            <p className="text-[11px] font-mono-num text-[#073D35] dark:text-[#C89A45] truncate">{p.externalUrl}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditProduct(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#073D35]/20 text-xs hover:border-[#C89A45]"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        {p.status !== 'published' && (
                          <button type="button" onClick={() => toggleProductStatus(p, 'published')} className="px-2.5 py-1 rounded border border-[#073D35] dark:border-[#C89A45] text-[#073D35] dark:text-[#C89A45] text-xs">
                            Publish
                          </button>
                        )}
                        {p.status !== 'archived' && (
                          <button type="button" onClick={() => toggleProductStatus(p, 'archived')} className="px-2.5 py-1 rounded border border-[#073D35]/20 text-xs">
                            Archive
                          </button>
                        )}
                        {confirmDeleteProdId === p.id ? (
                          <button type="button" onClick={() => deleteProduct(p.id)} className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold">
                            Confirm Delete
                          </button>
                        ) : (
                          <button type="button" onClick={() => setConfirmDeleteProdId(p.id)} className="px-2.5 py-1 rounded border border-red-300 text-red-600 text-xs">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {tab === 'merchants' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Multi-Merchant Adapters & Integration Controls</h2>
                <p className="text-xs text-[#252525]/70 dark:text-[#F8F2E8]/70 mt-1">
                  Factori and Amazon PA-API integration modules remain disabled until valid credentials and permissions are configured. Manual links and CSV imports operate independently.
                </p>
              </div>
              {merchants.map((m) => {
                const liveApiActive =
                  m.type === 'direct'
                    ? true
                    : m.type === 'vedashila_com'
                    ? Boolean(integrationStatus?.factoriApi.enabled)
                    : m.type === 'amazon_associates'
                    ? Boolean(integrationStatus?.amazonAssociates.paApiEnabled)
                    : m.apiConfigured;
                return (
                  <div key={m.id} className="p-4 rounded-xl border border-[#073D35]/12 dark:border-[#F8F2E8]/12 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{m.name}</h3>
                        <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65">
                          Type: {m.type} · Status: <strong>{m.status}</strong> · API Module:{' '}
                          <strong>{liveApiActive ? 'Enabled' : 'Disabled (Manual Catalogue / Links Active)'}</strong> · Indore Only: {m.indoreOnly ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => updateMerchantStatus(m, 'active')} className="px-3 py-1 rounded-lg bg-[#C89A45]/15 text-[#C89A45] text-xs font-semibold">
                          Activate
                        </button>
                        <button type="button" onClick={() => updateMerchantStatus(m, 'disabled_emergency')} className="px-3 py-1 rounded-lg bg-red-500/15 text-red-600 text-xs font-semibold">
                          Emergency Disable
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#073D35] dark:text-[#C89A45]/75 dark:text-[#F8F2E8]/75">{m.descriptionEn}</p>
                    {m.id === 'amazon-associates-in' && (
                      <div className="pt-2 space-y-1 text-xs">
                        <p className="font-mono-num text-[#C89A45]">
                          Supplied Reference Link: {m.suppliedReferenceLink} · Active Partner Tag:{' '}
                          {integrationStatus?.amazonAssociates.partnerTagConfigured
                            ? 'Configured in Server Env (AMAZON_PARTNER_TAG)'
                            : m.verifiedTrackingId || 'Not configured yet (PA-API disabled)'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'grocery' && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold">Indore-Only Grocery Coverage</h2>
              <form onSubmit={saveServiceArea} className="flex flex-wrap gap-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Indore PIN (e.g. 452001)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-transparent text-sm font-mono-num"
                />
                <input
                  type="text"
                  placeholder="Locality (e.g. Scheme 78)"
                  value={newLocality}
                  onChange={(e) => setNewLocality(e.target.value)}
                  className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-transparent text-sm"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] text-sm font-semibold">
                  Save Indore PIN
                </button>
              </form>
              <div className="space-y-2">
                {serviceAreas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-3 rounded-xl border border-[#073D35]/10 dark:border-[#F8F2E8]/10 text-sm">
                    <div>
                      <span className="font-mono-num font-semibold">{area.pincode}</span> · {area.locality}
                      <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65">{area.note}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleServiceArea(area)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${area.serviceable ? 'bg-[#C89A45]/15 text-[#C89A45]' : 'bg-slate-200 dark:bg-slate-800'}`}
                    >
                      {area.serviceable ? 'Serviceable' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">Direct Orders & Razorpay Reconciliation</h2>
              {directOrders.length === 0 ? (
                <p className="text-sm text-[#073D35] dark:text-[#C89A45]/70 dark:text-[#F8F2E8]/70">No direct orders placed yet.</p>
              ) : (
                directOrders.map((o) => (
                  <div key={o.id} className="p-4 rounded-xl border border-[#073D35]/10 dark:border-[#F8F2E8]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-mono-num font-semibold">{o.id} · ₹{o.totalInr.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65">
                        Payment: {o.paymentStatus} · Fulfillment: {o.fulfillmentStatus} · {o.shippingCity} ({o.shippingPincode})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['processing', 'shipped', 'delivered', 'cancelled'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            await updateDoc(doc(db, 'directOrders', o.id), {
                              fulfillmentStatus: st,
                              updatedAt: serverTimestamp(),
                            });
                            await logAdminAction(`ORDER_${st.toUpperCase()}`, `directOrders/${o.id}`);
                            setNotice(`Order ${o.id} marked ${st}.`);
                          }}
                          className="px-2.5 py-1 rounded border border-[#073D35]/20 text-xs capitalize"
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold">AI Control Centre & Content Assistant</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F8F2E8]/35 dark:bg-[#071A17]">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
                  Enable Vedashila AI Saathi
                </label>
                <div>
                  <label className="block text-xs mb-1">Daily Limit Per User</label>
                  <input
                    type="number"
                    value={aiLimit}
                    onChange={(e) => setAiLimit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#073D35]/15 bg-white dark:bg-[#0E2924] text-sm font-mono-num"
                  />
                </div>
                <button type="button" onClick={saveSettings} className="sm:col-span-2 px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] text-sm font-semibold">
                  Save AI Policy Settings
                </button>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#073D35]/10">
                <h3 className="font-semibold">AI Buying Guide & SEO Draft Generator (Requires Admin Approval)</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={aiTaskType}
                    onChange={(e) => setAiTaskType(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-transparent text-sm"
                  >
                    <option value="buying_guide">Buying Guide</option>
                    <option value="category_intro">Universe Intro & SEO</option>
                    <option value="faq">Customer FAQ Draft</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Topic (e.g. Festive Brass Decor Care & Gifting)"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-transparent text-sm"
                  />
                  <button type="button" disabled={busy} onClick={generateAiDraft} className="px-4 py-2 rounded-lg bg-[#C89A45] text-[#073D35] text-sm font-semibold">
                    Generate Draft
                  </button>
                </div>

                {aiDraft && (
                  <div className="p-4 rounded-xl border border-[#C89A45]/40 space-y-3">
                    <p className="text-xs font-semibold text-[#C89A45]">PENDING ADMIN APPROVAL</p>
                    <h4 className="font-semibold text-base">{aiDraft.title}</h4>
                    <p className="text-xs text-[#073D35] dark:text-[#C89A45]/70 dark:text-[#F8F2E8]/70">{aiDraft.excerpt}</p>
                    <p className="text-sm whitespace-pre-line">{aiDraft.body}</p>
                    <button type="button" onClick={approveAndSaveDraft} className="px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] text-xs font-semibold">
                      Approve & Publish to Guides
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'content' && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold">Domain, Festive Themes & Buying Guides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Configurable Domain (vedashila.in prohibited)</label>
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Seasonal / Festive Theme</label>
                  <select
                    value={festiveTheme}
                    onChange={(e) => setFestiveTheme(e.target.value as SystemSettings['festiveTheme'])}
                    className="w-full px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-transparent text-sm"
                  >
                    <option value="default">Nakshatra Classic</option>
                    <option value="diwali">Diwali Temple Gold</option>
                    <option value="holi">Holi Utsav</option>
                    <option value="navratri">Navratri Plum & Gold</option>
                  </select>
                </div>
                <button type="button" onClick={saveSettings} className="sm:col-span-2 px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] text-sm font-semibold">
                  Save Domain & Theme
                </button>
              </div>

              <div className="pt-4 border-t border-[#073D35]/10 space-y-2">
                <h3 className="font-semibold">Published Buying Guides ({blogPosts.length})</h3>
                {blogPosts.map((b) => (
                  <div key={b.id} className="p-3 rounded-lg border border-[#073D35]/10 text-xs">
                    <strong>{b.title}</strong> · {b.status}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'analytics' && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">Live Session Analytics (No Invented Data)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#073D35]/10">
                  <h3 className="font-semibold text-sm mb-2">Outbound Merchant Clicks ({outboundClicks.length})</h3>
                  {outboundClicks.length === 0 ? (
                    <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65">No outbound product clicks recorded in this session yet.</p>
                  ) : (
                    <ul className="text-xs space-y-1">
                      {outboundClicks.map((c, idx) => (
                        <li key={idx} className="font-mono-num">{c.merchantId} → {c.productId}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-4 rounded-xl border border-[#073D35]/10">
                  <h3 className="font-semibold text-sm mb-2">Recent Customer Searches ({searchQueries.length})</h3>
                  {searchQueries.length === 0 ? (
                    <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65">No search queries recorded in this session yet.</p>
                  ) : (
                    <ul className="text-xs space-y-1">
                      {searchQueries.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'imports' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">Manual CSV / JSON Product Catalogue Import</h2>
                <p className="text-xs text-[#073D35] dark:text-[#C89A45]/70 dark:text-[#F8F2E8]/70 mt-1">
                  Upload or paste authorized CSV/JSON product rows with manually entered merchant links, verified direct prices, and image rights attribution. Automated Factori & Amazon PA-API feeds remain disabled until valid credentials are provided.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F2E8] dark:bg-[#071A17] border border-[#073D35]/10 dark:border-white/10 text-xs space-y-1">
                <p className="font-semibold text-[#073D35] dark:text-[#C89A45]">
                  Active Import Mode: Manual CSV / JSON → Cloud Firestore
                </p>
                <p className="text-[#252525]/75 dark:text-[#F8F2E8]/75">
                  Factori API: {integrationStatus?.factoriApi.enabled ? 'Enabled' : 'Disabled (Optional in Dev)'} · Amazon PA-API:{' '}
                  {integrationStatus?.amazonAssociates.paApiEnabled ? 'Enabled' : 'Disabled (Optional in Dev)'} · Amazon Partner Tag:{' '}
                  {integrationStatus?.amazonAssociates.partnerTagConfigured
                    ? 'Auto-applied on amazon.in URLs via backend env'
                    : amazonMerchant?.verifiedTrackingId
                    ? `Auto-applied (${amazonMerchant.verifiedTrackingId})`
                    : 'Optional'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportSource('csv')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${importSource === 'csv' ? 'bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45]' : 'border border-[#073D35]/20'}`}
                >
                  CSV Feed
                </button>
                <button
                  type="button"
                  onClick={() => setImportSource('json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${importSource === 'json' ? 'bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45]' : 'border border-[#073D35]/20'}`}
                >
                  JSON Feed
                </button>
                <label className="px-3 py-1.5 rounded-lg border border-[#073D35] dark:border-[#C89A45] text-[#073D35] dark:text-[#C89A45] text-xs font-semibold cursor-pointer hover:bg-[#073D35] hover:text-white transition-colors">
                  Upload .CSV / .JSON File
                  <input
                    type="file"
                    accept=".csv,.json,text/csv,application/json"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const text = await file.text();
                      setImportSource(file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv');
                      setImportText(text);
                      setImportPreview(null);
                      setNotice(`Loaded ${file.name} (${text.length} bytes). Click "Validate & Check Duplicates" to preview.`);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="px-3 py-1.5 rounded-lg border border-[#073D35]/20 text-xs font-medium hover:border-[#C89A45]"
                >
                  Download CSV Template
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImportText(
                      importSource === 'json'
                        ? JSON.stringify(
                            [
                              {
                                id: 'manual-chanderi-stole-01',
                                titleEn: 'Chanderi Silk Zari Stole',
                                brand: 'Vedashila.com',
                                universeId: 'vastra-mandala',
                                categoryId: 'sarees-ethnic',
                                merchantId: 'vedashila-com',
                                purchaseMode: 'external',
                                externalUrl: 'https://vedashila.com',
                                priceInr: 1299,
                                priceVerified: true,
                                imageUrl: '/src/assets/images/universe_vastra_saree_1794542200475.jpg',
                                imageRightsStatus: 'merchant_permitted',
                                contentPermissions: 'Authorized Vedashila.com listing',
                              },
                            ],
                            null,
                            2
                          )
                        : 'id,titleEn,brand,universeId,categoryId,merchantId,purchaseMode,externalUrl,priceInr,priceVerified,imageUrl,imageRightsStatus,contentPermissions\nmanual-chanderi-stole-02,"Chanderi Handloom Dupatta","Vedashila Artisanal",vastra-mandala,sarees-ethnic,vedashila-direct,direct,,1499,true,/src/assets/images/universe_vastra_saree_1794542200475.jpg,owned,"First-party direct SKU"\nmanual-amz-audio-03,"Studio Headphones Showcase","Amazon Curated Pick",tech-tara,audio-wearables,amazon-associates-in,external,https://www.amazon.in/dp/B000000000,,false,/src/assets/images/universe_tech_tara_1794542200408.jpg,owned,"Manual Amazon Associates link"'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-[#C89A45] text-[#C89A45] text-xs font-medium"
                >
                  Load Sample {importSource.toUpperCase()}
                </button>
              </div>
              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Upload a CSV/JSON file above or paste authorized CSV/JSON rows here..."
                className="w-full p-3 rounded-xl border border-[#073D35]/15 dark:border-[#F8F2E8]/20 bg-transparent font-mono-num text-xs"
              />
              <button
                type="button"
                disabled={busy || !importText.trim()}
                onClick={validateImport}
                className="px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] text-sm font-semibold disabled:opacity-50"
              >
                Validate & Check Duplicates
              </button>

              {importErrors.length > 0 && (
                <div className="p-4 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300 space-y-1">
                  <p className="font-semibold">Row Validation Errors ({importErrors.length} skipped):</p>
                  {importErrors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              {importWarnings.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-semibold">Rights & Image Warnings ({importWarnings.length}):</p>
                  {importWarnings.map((w, i) => (
                    <p key={i}>• {w}</p>
                  ))}
                </div>
              )}

              {importPreview && importStats && (
                <div className="p-4 rounded-xl border border-[#C89A45]/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="font-medium">
                      Total Rows: {importStats.total} · Valid New Rows: {importStats.valid} · Duplicates Skipped: {importStats.dupes}
                    </p>
                    <select
                      aria-label="Import Target Status"
                      value={importTargetStatus}
                      onChange={(e) => setImportTargetStatus(e.target.value as 'published' | 'pending_approval')}
                      className="px-2.5 py-1 rounded border border-[#073D35]/20 bg-white dark:bg-[#0E2924] text-xs"
                    >
                      <option value="published">Import as Published</option>
                      <option value="pending_approval">Save as Pending Approval</option>
                    </select>
                  </div>

                  {importPreview.length > 0 && (
                    <>
                      <div className="max-h-56 overflow-y-auto space-y-1.5 border-t border-b border-[#073D35]/10 py-2">
                        {importPreview.map((item) => (
                          <div key={item.id} className="text-xs flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-[#F8F2E8] dark:bg-[#071A17]">
                            <div>
                              <span className="font-semibold">{item.titleEn}</span>{' '}
                              <span className="opacity-65">({item.id} · {item.merchantId})</span>
                              {item.externalUrl && (
                                <p className="font-mono-num text-[11px] text-[#073D35] dark:text-[#C89A45] truncate max-w-md">{item.externalUrl}</p>
                              )}
                            </div>
                            <span className="font-mono-num">
                              {item.priceVerified && typeof item.priceInr === 'number'
                                ? `₹${item.priceInr.toLocaleString('en-IN')}`
                                : item.purchaseMode === 'external'
                                ? 'Merchant live price'
                                : 'Unverified'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={commitApprovedImport}
                        className="px-4 py-2 rounded-lg bg-[#073D35] text-white text-xs font-semibold"
                      >
                        Approve & Import {importPreview.length} Products to Firestore
                      </button>
                    </>
                  )}
                </div>
              )}

              {importJobs.length > 0 && (
                <div className="pt-4 border-t border-[#073D35]/10 space-y-2">
                  <h3 className="text-sm font-semibold">Recent Import History</h3>
                  {importJobs.map((j) => (
                    <div key={j.id} className="text-xs flex justify-between p-2 rounded border border-[#073D35]/10">
                      <span>{j.id} ({j.sourceType})</span>
                      <span>{j.validRows} valid · {j.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold">Security Centre & Audit Logs</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newAdminUid.trim() || !newAdminEmail.trim()) return;
                  await setDoc(doc(db, 'admins', newAdminUid.trim()), {
                    uid: newAdminUid.trim(),
                    email: newAdminEmail.trim(),
                    role: 'ops_admin',
                    active: true,
                    createdAt: serverTimestamp(),
                  });
                  await logAdminAction('GRANT_ADMIN_ROLE', `admins/${newAdminUid.trim()}`);
                  setNewAdminUid('');
                  setNewAdminEmail('');
                  setNotice('Authorized admin UID added.');
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  placeholder="User Firebase UID"
                  value={newAdminUid}
                  onChange={(e) => setNewAdminUid(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#073D35]/15 bg-transparent text-xs font-mono-num"
                />
                <input
                  type="email"
                  placeholder="Verified Google Email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#073D35]/15 bg-transparent text-xs"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] dark:text-[#C89A45] text-xs font-semibold">
                  Authorize Admin
                </button>
              </form>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Recent Admin Audit Logs</h3>
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-[#073D35] dark:text-[#C89A45]/65 dark:text-[#F8F2E8]/65">Audit events appear here after Firestore admin mutations.</p>
                ) : (
                  auditLogs.map((l) => (
                    <div key={l.id} className="p-2.5 rounded-lg border border-[#073D35]/10 text-xs flex justify-between gap-2 font-mono-num">
                      <span>{l.action}</span>
                      <span className="truncate">{l.targetPath}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

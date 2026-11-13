export type LanguageCode = 'en' | 'hi';

export type RouteView =
  | 'home'
  | 'about'
  | 'universes'
  | 'catalogue'
  | 'product'
  | 'merchant'
  | 'indore-grocery'
  | 'offers'
  | 'ai-saathi'
  | 'wishlist'
  | 'shopping-lists'
  | 'cart'
  | 'orders'
  | 'profile'
  | 'guides'
  | 'support'
  | 'privacy'
  | 'terms'
  | 'affiliate-disclosure'
  | 'refund-policy'
  | 'admin';

export type MerchantType =
  | 'direct'
  | 'vedashila_com'
  | 'amazon_associates'
  | 'blinkit_indore'
  | 'zepto_adapter'
  | 'bigbasket_adapter'
  | 'indore_local';

export type MerchantStatus = 'active' | 'paused' | 'disabled_emergency' | 'pending_verification';

export interface Universe {
  id: string;
  nameEn: string;
  nameHi: string;
  subtitleEn: string;
  subtitleHi: string;
  imageUrl?: string;
  indoreOnly: boolean;
  active: boolean;
  sortOrder: number;
  accentHex?: string;
}

export interface Category {
  id: string;
  universeId: string;
  parentCategoryId?: string;
  nameEn: string;
  nameHi: string;
  descriptionEn?: string;
  descriptionHi?: string;
  imageUrl?: string;
  sortOrder?: number;
  active: boolean;
}

export interface AffiliateCampaign {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  isVerifiedPartner: boolean;
  active: boolean;
}

export interface AffiliateLink {
  id: string;
  label: string;
  merchantId: string;
  campaignId?: string;
  destinationUrl: string;
  trackingCode: string;
  tags: string[];
  disclosureNote?: string;
  conversionTrackable: boolean;
  conversions?: number;
  active: boolean;
}

export interface Merchant {
  id: string;
  name: string;
  type: MerchantType;
  status: MerchantStatus;
  indoreOnly: boolean;
  baseUrl: string;
  suppliedReferenceLink?: string;
  verifiedTrackingId?: string;
  apiConfigured: boolean;
  affiliateDisclosureRequired: boolean;
  partnershipClaimed: boolean;
  descriptionEn: string;
  descriptionHi: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  label: string;
  sku: string;
  priceDeltaInr: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  titleEn: string;
  titleHi: string;
  brand?: string;
  descriptionEn: string;
  descriptionHi: string;
  universeId: string;
  categoryId: string;
  merchantId: string;
  purchaseMode: 'direct' | 'external';
  externalUrl?: string;
  priceInr?: number;
  priceVerified: boolean;
  indoreOnly: boolean;
  imageUrl: string;
  imageRightsStatus: 'owned' | 'licensed' | 'merchant_permitted' | 'pending_review';
  contentPermissions?: string;
  lastUpdated?: string;
  status: 'published' | 'pending_approval' | 'archived';
  isFixture?: boolean;
  attributes?: Record<string, string>;
}

export interface Offer {
  id: string;
  title: string;
  merchantId: string;
  description: string;
  code?: string;
  indoreOnly: boolean;
  verified: boolean;
  active: boolean;
  expiresAt: string;
}

export interface ServiceArea {
  id: string;
  city: string;
  pincode: string;
  locality: string;
  serviceable: boolean;
  eligibleMerchants: string[];
  note: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  universeId: string;
  status: 'draft_ai' | 'published' | 'archived';
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  theme: 'nakshatra' | 'festive_diwali' | 'monsoon_indore';
  active: boolean;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  title: string;
  unitPriceInr: number;
  quantity: number;
  imageUrl: string;
}

export interface DirectOrder {
  id: string;
  userId: string;
  items: CartItem[];
  totalInr: number;
  currency: 'INR';
  shippingCity: string;
  shippingPincode: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: 'created' | 'pending_verification' | 'verified_paid' | 'failed' | 'refunded' | 'test_fixture';
  fulfillmentStatus: 'awaiting_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  userId: string;
  amountInr: number;
  reason: string;
  status: 'requested' | 'approved' | 'processed' | 'rejected';
  createdAt?: unknown;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt?: unknown;
}

export interface ShoppingList {
  id: string;
  userId: string;
  title: string;
  budgetInr?: number;
  items: { id: string; label: string; checked: boolean; estimatedInr?: number }[];
}

export interface ImportJob {
  id: string;
  merchantId: string;
  sourceType: 'csv' | 'json' | 'api';
  totalRows: number;
  validRows: number;
  duplicatesSkipped: number;
  status: 'pending_approval' | 'completed' | 'failed';
  createdBy: string;
  createdAt?: unknown;
}

export interface SystemSettings {
  id: string;
  publicDomain: string;
  festiveTheme: 'default' | 'diwali' | 'holi' | 'navratri';
  aiSaathiEnabled: boolean;
  aiDailyLimitPerUser: number;
}

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

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Check, Plus, Trash2, Shield, BookOpen, LifeBuoy, ListChecks, ExternalLink, MapPin, Compass } from 'lucide-react';
import {
  AffiliateCampaign,
  AffiliateLink,
  BlogPost,
  LanguageCode,
  Merchant,
  Product,
  RouteView,
  ShoppingList,
  SupportTicket,
} from '../types/hub';
import { db, handleFirestoreError, OperationType, signInWithGoogle } from '../lib/firebase';
import { VedashilaFullLogo } from './BrandMark';

export const AboutView: React.FC<{
  language: LanguageCode;
  onNavigate: (view: RouteView) => void;
}> = ({ language, onNavigate }) => (
  <div className="space-y-10 max-w-5xl">
    <div className="border-b border-[#073D35]/12 dark:border-white/10 pb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45] mb-1">
        Official Brand Identity · VEDASHILA Lifestyle Hub
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-[#073D35] dark:text-white">
        {language === 'hi' ? 'वेदशिला लाइफस्टाइल हब के बारे में' : 'About VEDASHILA Lifestyle Hub'}
      </h1>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-2xl border border-[#C89A45]/35 bg-[#FFFFFF] dark:bg-[#0E2924]">
      <div className="lg:col-span-5 flex justify-center">
        <VedashilaFullLogo variant="original" className="w-full max-w-xs h-auto border border-[#C89A45]/30 shadow-sm" />
      </div>

      <div className="lg:col-span-7 space-y-4 text-sm leading-relaxed text-[#252525]/85 dark:text-[#F8F2E8]/85">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#9F7323] dark:text-[#C89A45]">
          SHOP MORE ✦ LIVE BEAUTIFULLY
        </p>
        <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-white">
          Indian Elegance Meets Multi-Store Discovery
        </h2>
        <p>
          <strong>VEDASHILA Lifestyle Hub</strong> brings together curated Indian fashion, wellness, electronics, home aesthetics, and everyday essentials in one transparent marketplace. Built around the official VEDASHILA identity, our platform pairs direct brand commerce with honest multi-merchant discovery.
        </p>
        <p>
          Purchases for direct Vedashila Lifestyle Hub editions are processed securely via Razorpay in INR. External storefront items—including <strong>Vedashila.com</strong>, verified Amazon India discovery links, and <strong>Indore-only</strong> grocery discovery—clearly disclose that final pricing, inventory, and checkout occur on the respective destination merchant.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#F8F2E8] dark:bg-[#071A17] border border-[#073D35]/10 dark:border-white/10 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-[#073D35] dark:text-[#C89A45] text-xs">
              <Compass className="w-4 h-4" />
              <span>Pan-India Categories</span>
            </div>
            <p className="text-xs text-[#252525]/75 dark:text-[#F8F2E8]/75">
              Fashion, electronics, beauty, home & gifts curated for shoppers across India.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8F2E8] dark:bg-[#071A17] border border-[#073D35]/10 dark:border-white/10 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-[#073D35] dark:text-[#C89A45] text-xs">
              <MapPin className="w-4 h-4" />
              <span>Indore-Exclusive Grocery Hub</span>
            </div>
            <p className="text-xs text-[#252525]/75 dark:text-[#F8F2E8]/75">
              PIN-code-verified grocery discovery strictly scoped to Indore, Madhya Pradesh.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('catalogue')}
            className="px-4 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold"
          >
            Explore Marketplace
          </button>
          <button
            type="button"
            onClick={() => onNavigate('affiliate-disclosure')}
            className="px-4 py-2.5 rounded-xl border border-[#073D35]/20 dark:border-[#C89A45]/30 text-xs font-semibold hover:border-[#C89A45]"
          >
            Merchant & Affiliate Disclosure
          </button>
          <button
            type="button"
            onClick={() => onNavigate('support')}
            className="px-4 py-2.5 rounded-xl border border-[#073D35]/20 dark:border-[#C89A45]/30 text-xs font-semibold hover:border-[#C89A45]"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const GuidesView: React.FC<{ posts: BlogPost[] }> = ({ posts }) => (
  <div className="space-y-8">
    <div className="border-b border-[#073D35]/10 dark:border-white/10 pb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45] mb-1">
        Editorial & Buying Guides
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-[#073D35] dark:text-white">
        VEDASHILA Guides & Journal
      </h1>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <article
          key={post.id}
          className="p-6 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-3"
        >
          <div className="flex items-center gap-2 text-xs text-[#9F7323] dark:text-[#C89A45] font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{post.universeId}</span>
            <span>·</span>
            <span>{post.updatedAt}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-white">{post.title}</h2>
          <p className="text-sm text-[#252525]/75 dark:text-[#F8F2E8]/75">{post.excerpt}</p>
          <p className="text-sm leading-relaxed pt-2 border-t border-[#073D35]/8 dark:border-white/10">
            {post.content}
          </p>
        </article>
      ))}
    </div>
  </div>
);

export const ShoppingListsView: React.FC<{
  user: User | null;
  lists: ShoppingList[];
}> = ({ user, lists }) => {
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [newItemText, setNewItemText] = useState('');

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    const id = `list_${Date.now()}`;
    try {
      await setDoc(doc(db, `users/${user.uid}/shoppingLists`, id), {
        id,
        userId: user.uid,
        title: title.trim().slice(0, 120),
        budgetInr: budget ? Number(budget) : 0,
        items: newItemText.trim()
          ? [{ id: `i_${Date.now()}`, label: newItemText.trim(), checked: false }]
          : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setTitle('');
      setBudget('');
      setNewItemText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/shoppingLists/${id}`);
    }
  };

  if (!user) {
    return (
      <div className="p-8 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/25 bg-[#FFFFFF] dark:bg-[#0E2924] text-center space-y-4">
        <ListChecks className="w-8 h-8 mx-auto text-[#C89A45]" />
        <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-white">
          Shopping Lists & Budget Planner
        </h2>
        <p className="text-sm text-[#252525]/70 dark:text-[#F8F2E8]/70">
          Sign in with Google to save and sync your shopping lists across devices.
        </p>
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="px-5 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-sm font-bold"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-[#073D35] dark:text-white">Shopping Lists & Planner</h1>
      <form
        onSubmit={createList}
        className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#0E2924] border border-[#073D35]/12 dark:border-[#C89A45]/20"
      >
        <input
          type="text"
          required
          placeholder="List Name (e.g. Indore Monthly Pantry)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-[#F8F2E8] dark:bg-[#071A17] text-sm"
        />
        <input
          type="number"
          placeholder="Budget INR"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-[#F8F2E8] dark:bg-[#071A17] text-sm font-mono-num"
        />
        <input
          type="text"
          placeholder="First item..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-[#F8F2E8] dark:bg-[#071A17] text-sm"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Create List
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lists.map((l) => (
          <div
            key={l.id}
            className="p-5 rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">{l.title}</h3>
              <button
                type="button"
                onClick={() => deleteDoc(doc(db, `users/${user.uid}/shoppingLists`, l.id))}
                className="text-[#F47D79] p-1"
                aria-label="Delete list"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {l.budgetInr ? (
              <p className="text-xs font-mono-num font-semibold text-[#073D35] dark:text-[#C89A45]">
                Budget: ₹{l.budgetInr.toLocaleString('en-IN')}
              </p>
            ) : null}
            <ul className="space-y-1 text-sm">
              {l.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#073D35] dark:text-[#C89A45]" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SupportView: React.FC<{
  user: User | null;
  tickets: SupportTicket[];
}> = ({ user, tickets }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await signInWithGoogle();
      return;
    }
    const id = `tkt_${Date.now()}`;
    try {
      await setDoc(doc(db, 'supportTickets', id), {
        id,
        userId: user.uid,
        subject: subject.trim().slice(0, 160),
        message: message.trim().slice(0, 2000),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSubject('');
      setMessage('');
      setSent(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `supportTickets/${id}`);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <LifeBuoy className="w-7 h-7 text-[#073D35] dark:text-[#C89A45]" />
        <div>
          <h1 className="font-display text-3xl font-bold text-[#073D35] dark:text-white">
            Contact & Customer Support
          </h1>
          <p className="text-sm text-[#252525]/70 dark:text-[#F8F2E8]/70">
            For direct Razorpay orders, Indore grocery inquiries, or merchant link issues.
          </p>
        </div>
      </div>

      {sent && (
        <div className="p-3.5 rounded-xl bg-[#073D35]/10 border border-[#073D35]/30 dark:border-[#C89A45]/40 text-sm">
          Support ticket submitted. Our team tracks every direct inquiry in Firestore.
        </div>
      )}

      <form
        onSubmit={submitTicket}
        className="p-6 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/25 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-4"
      >
        <input
          type="text"
          required
          minLength={3}
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#073D35]/15 dark:border-white/20 bg-transparent text-sm"
        />
        <textarea
          rows={4}
          required
          minLength={5}
          placeholder="Describe your question or direct order ID..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#073D35]/15 dark:border-white/20 bg-transparent text-sm"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-sm font-bold"
        >
          {user ? 'Submit Support Ticket' : 'Sign In & Submit Ticket'}
        </button>
      </form>

      {tickets.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-base">Your Support Tickets</h2>
          {tickets.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl border border-[#073D35]/12 dark:border-white/15 bg-[#FFFFFF] dark:bg-[#0E2924] text-sm"
            >
              <div className="flex justify-between">
                <strong>{t.subject}</strong>
                <span className="text-xs uppercase font-semibold text-[#073D35] dark:text-[#C89A45]">{t.status}</span>
              </div>
              <p className="text-xs text-[#252525]/70 dark:text-[#F8F2E8]/70 mt-1">{t.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const LegalPageView: React.FC<{
  view: Extract<RouteView, 'privacy' | 'terms' | 'affiliate-disclosure' | 'refund-policy'>;
  language: LanguageCode;
  merchants?: Merchant[];
  affiliateCampaigns?: AffiliateCampaign[];
  affiliateLinks?: AffiliateLink[];
  onTrackAffiliateClick?: (linkId: string) => void;
}> = ({
  view,
  merchants = [],
  affiliateCampaigns = [],
  affiliateLinks = [],
  onTrackAffiliateClick,
}) => {
  const titles: Record<typeof view, string> = {
    privacy: 'Privacy Policy & Indian Data Protection Compliance',
    terms: 'Terms and Conditions of Use',
    'affiliate-disclosure': 'Affiliate & External Merchant Disclosure',
    'refund-policy': 'Direct-Sales Refund & Cancellation Policy',
  };

  const activeLinks = affiliateLinks.filter((l) => l.active);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-2.5 text-[#073D35] dark:text-[#C89A45]">
        <Shield className="w-6 h-6" />
        <span className="text-xs font-semibold uppercase tracking-wider">Trust & Legal Compliance</span>
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-[#073D35] dark:text-white">
        {titles[view]}
      </h1>
      <div className="space-y-5 text-sm leading-relaxed text-[#252525]/85 dark:text-[#F8F2E8]/85">
        {view === 'affiliate-disclosure' && (
          <>
            <p>
              Vedashila Lifestyle Hub operates as both a multi-merchant product discovery marketplace and a direct retail storefront for authorized Vedashila Direct items.
            </p>
            <p>
              <strong>Amazon Associates India & External Links:</strong> External links (including supplied Amazon references such as <code>https://link.amazon/B0eJUJQ2I</code>, Vedashila.com, and Blinkit Indore) redirect you to the respective merchant platform to complete checkout. Final pricing, availability, shipping fees, and returns for external products are governed exclusively by those merchants.
            </p>
            <p>
              <strong>No Unverified Partnership Claims:</strong> Vedashila Lifestyle Hub does not claim official commercial partnerships or affiliate commissions with Blinkit, Zepto, BigBasket, or any retailer unless formally verified and enabled by administrators.
            </p>

            {merchants.length > 0 && (
              <div className="pt-4 border-t border-[#073D35]/10 dark:border-white/12 space-y-3">
                <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-[#FFFFFF]">
                  Active Merchant & Partner Disclosure Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {merchants.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl border border-[#073D35]/12 dark:border-white/12 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm text-[#073D35] dark:text-[#FFFFFF]">{m.name}</strong>
                        <span className="text-[#073D35] dark:text-[#C89A45] font-semibold">
                          {m.partnershipClaimed ? 'Verified Storefront' : 'External Discovery Only'}
                        </span>
                      </div>
                      <p>{m.descriptionEn}</p>
                      <p className="text-[#252525]/65 dark:text-[#F8F2E8]/65">
                        Disclosure Required: {m.affiliateDisclosureRequired ? 'Yes' : 'Direct / Brand Storefront'} · Status: {m.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeLinks.length > 0 && (
              <div className="pt-4 border-t border-[#073D35]/10 dark:border-white/12 space-y-3">
                <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-[#FFFFFF]">
                  Disclosed External & Affiliate Campaign Links
                </h2>
                <p className="text-xs text-[#252525]/70 dark:text-[#F8F2E8]/70">
                  Every tracked external link registered in Firestore by administrators is listed transparently below with its merchant, campaign, tags, and conversion tracking capability.
                </p>
                <div className="space-y-3">
                  {activeLinks.map((link) => {
                    const merchant = merchants.find((m) => m.id === link.merchantId);
                    const campaign = affiliateCampaigns.find((c) => c.id === link.campaignId);
                    return (
                      <div
                        key={link.id}
                        className="p-4 rounded-xl border border-[#073D35]/12 dark:border-white/12 bg-[#FFFFFF] dark:bg-[#0E2924] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#9F7323] dark:text-[#C89A45] font-semibold">
                            <span>{merchant?.name || link.merchantId}</span>
                            {campaign && (
                              <>
                                <span>·</span>
                                <span>{campaign.name}</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="font-mono-num">Ref: {link.trackingCode}</span>
                          </div>
                          <p className="font-semibold text-sm text-[#073D35] dark:text-[#FFFFFF]">{link.label}</p>
                          {link.disclosureNote && (
                            <p className="text-xs text-[#252525]/70 dark:text-[#F8F2E8]/70">{link.disclosureNote}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#252525]/60 dark:text-[#F8F2E8]/60">
                            <span>
                              Conversion Tracking: {link.conversionTrackable ? 'Merchant-trackable' : 'Not trackable (discovery only)'}
                            </span>
                            {link.tags?.length > 0 && (
                              <>
                                <span>·</span>
                                <span>Tags: {link.tags.join(', ')}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <a
                          href={link.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          onClick={() => onTrackAffiliateClick?.(link.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#073D35]/20 dark:border-[#C89A45]/30 text-xs font-semibold hover:border-[#C89A45] shrink-0 self-start sm:self-center"
                        >
                          <span>Visit Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
        {view === 'refund-policy' && (
          <>
            <p>
              This policy applies strictly to <strong>Vedashila Lifestyle Hub Direct</strong> purchases processed via Razorpay. External purchases completed on Vedashila.com, Amazon.in, or Blinkit follow those merchants&apos; respective return policies.
            </p>
            <p>
              <strong>Cancellations:</strong> Direct orders in <code>awaiting_payment</code> or <code>processing</code> status may be cancelled prior to dispatch from your Direct Orders page.
            </p>
            <p>
              <strong>Refunds:</strong> Eligible returns within 7 days of delivery are refunded via Razorpay to the original UPI, card, or net-banking source within 5–7 business days following server verification.
            </p>
          </>
        )}
        {view === 'privacy' && (
          <>
            <p>
              In alignment with India&apos;s Digital Personal Data Protection (DPDP) framework, Vedashila Lifestyle Hub isolates personally identifiable information (email, phone, address, PIN code) in access-restricted Firestore private subcollections accessible only to the verified account owner and authorized administrators.
            </p>
            <p>
              AI personalization via VEDASHILA AI SAATHI and newsletter subscriptions are strictly opt-in and can be toggled at any time in your Customer Profile.
            </p>
          </>
        )}
        {view === 'terms' && (
          <>
            <p>
              Annapurna Orbit grocery discovery is restricted to Indore, Madhya Pradesh. Serviceability is evaluated by PIN code against our Firestore registry, and final delivery availability is determined by the fulfilling merchant.
            </p>
            <p>
              Razorpay checkout is exclusively permitted for direct Vedashila Lifestyle Hub offerings.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export const ProfileView: React.FC<{
  user: User | null;
  city: string;
  pincode: string;
  wishlistProducts: Product[];
  onOpenProduct: (p: Product) => void;
}> = ({ user, city, pincode, wishlistProducts, onOpenProduct }) => {
  const [aiOptIn, setAiOptIn] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <div className="p-8 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/25 bg-[#FFFFFF] dark:bg-[#0E2924] text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-white">
          Customer Profile & Privacy Controls
        </h2>
        <p className="text-sm text-[#252525]/70 dark:text-[#F8F2E8]/70">
          Sign in with Google to manage your Indore PIN code, AI personalization consent, and wishlist.
        </p>
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="px-5 py-2.5 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-sm font-bold"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-display text-3xl font-bold text-[#073D35] dark:text-white">Customer Profile & Consent</h1>
      <div className="p-6 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/25 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-4">
        <div className="text-sm space-y-1">
          <p><strong>Name:</strong> {user.displayName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Active City:</strong> {city} {pincode ? `· PIN ${pincode}` : ''}</p>
        </div>
        <label className="flex items-center gap-2.5 text-sm pt-3 border-t border-[#073D35]/10">
          <input type="checkbox" checked={aiOptIn} onChange={(e) => setAiOptIn(e.target.checked)} />
          Opt in to privacy-preserving VEDASHILA AI SAATHI personalization
        </label>
        <button
          type="button"
          onClick={async () => {
            await setDoc(
              doc(db, 'users', user.uid),
              {
                uid: user.uid,
                displayName: user.displayName || 'Customer',
                preferredLanguage: 'en',
                selectedCity: city,
                aiPersonalizationOptIn: aiOptIn,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
            setSaved(true);
          }}
          className="px-4 py-2 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold"
        >
          Save Privacy Preferences
        </button>
        {saved && <p className="text-xs text-[#073D35] dark:text-[#C89A45] font-semibold">Preferences updated in Firestore.</p>}
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-white">
          Saved Wishlist ({wishlistProducts.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {wishlistProducts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpenProduct(p)}
              className="p-3 rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] text-left hover:border-[#C89A45]"
            >
              <p className="font-medium text-sm">{p.titleEn}</p>
              <p className="text-xs text-[#9F7323] dark:text-[#C89A45]">{p.merchantId}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

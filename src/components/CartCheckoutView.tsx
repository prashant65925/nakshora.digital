import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Minus, Plus, Trash2, ShieldCheck, AlertCircle, RotateCcw, Receipt, Printer } from 'lucide-react';
import { CartItem, DirectOrder, LanguageCode } from '../types/hub';
import { db, handleFirestoreError, OperationType, signInWithGoogle } from '../lib/firebase';
import { ResilientImage, VedashilaInvoiceHeader } from './BrandMark';

interface CartCheckoutViewProps {
  language: LanguageCode;
  user: User | null;
  cart: CartItem[];
  city: string;
  pincode: string;
  directOrders: DirectOrder[];
  onUpdateQty: (productId: string, delta: number, variantId?: string) => void;
  onRemoveItem: (productId: string, variantId?: string) => void;
  onClearCart: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export const CartCheckoutView: React.FC<CartCheckoutViewProps> = ({
  language,
  user,
  cart,
  city,
  pincode,
  directOrders,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}) => {
  const [shippingCity, setShippingCity] = useState(city);
  const [shippingPin, setShippingPin] = useState(pincode || '452001');
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<DirectOrder | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.unitPriceInr * item.quantity, 0);

  const handleCheckout = async (useTestFixture = false) => {
    setError(null);
    setStatusMessage(null);

    if (!user || !user.emailVerified) {
      try {
        await signInWithGoogle();
      } catch {
        setError('Please sign in with Google to place a direct order.');
        return;
      }
      return;
    }

    if (cart.length === 0 || subtotal <= 0) return;
    setBusy(true);
    const localOrderId = `ord_${Date.now()}`;

    try {
      const orderPayload = {
        id: localOrderId,
        userId: user.uid,
        items: cart.map((c) => ({ ...c })),
        totalInr: subtotal,
        currency: 'INR',
        shippingCity: shippingCity.slice(0, 80),
        shippingPincode: shippingPin.slice(0, 10),
        paymentStatus: 'created',
        fulfillmentStatus: 'awaiting_payment',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'directOrders', localOrderId), orderPayload);

      const createRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountInr: subtotal,
          receiptId: localOrderId,
          items: cart.map((c) => ({ productId: c.productId, purchaseMode: 'direct' })),
        }),
      });
      const orderData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(orderData.error || 'Could not initialize Razorpay order.');
      }

      if (!orderData.configured) {
        if (useTestFixture) {
          const fixtureOrderId = `fixture_order_${Date.now()}`;
          await updateDoc(doc(db, 'directOrders', localOrderId), {
            paymentStatus: 'pending_verification',
            razorpayOrderId: fixtureOrderId,
            updatedAt: serverTimestamp(),
          });
          setReceiptOrder({
            id: localOrderId,
            userId: user.uid,
            items: cart.map((c) => ({ ...c })),
            totalInr: subtotal,
            currency: 'INR',
            shippingCity: shippingCity.slice(0, 80),
            shippingPincode: shippingPin.slice(0, 10),
            razorpayOrderId: fixtureOrderId,
            paymentStatus: 'pending_verification',
            fulfillmentStatus: 'awaiting_payment',
          });
          onClearCart();
          setStatusMessage(
            `Order ${localOrderId} saved as a Developer Test Fixture awaiting live Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).`
          );
        } else {
          setStatusMessage(
            'Razorpay server credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are not configured yet. Order saved in awaiting_payment state, or use the labelled Test Fixture button for QA.'
          );
        }
        setBusy(false);
        return;
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout SDK did not load in browser.');
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vedashila Lifestyle Hub',
        description: `Direct Order ${localOrderId}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
              await updateDoc(doc(db, 'directOrders', localOrderId), {
                paymentStatus: 'failed',
                updatedAt: serverTimestamp(),
              });
              setError('Server signature verification failed.');
              return;
            }
            await updateDoc(doc(db, 'directOrders', localOrderId), {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              paymentStatus: 'pending_verification',
              updatedAt: serverTimestamp(),
            });
            setReceiptOrder({
              id: localOrderId,
              userId: user.uid,
              items: cart.map((c) => ({ ...c })),
              totalInr: subtotal,
              currency: 'INR',
              shippingCity: shippingCity.slice(0, 80),
              shippingPincode: shippingPin.slice(0, 10),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              paymentStatus: 'pending_verification',
              fulfillmentStatus: 'awaiting_payment',
            });
            onClearCart();
            setStatusMessage(`Payment verified by HMAC signature (${response.razorpay_payment_id}). Order recorded.`);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification error');
          }
        },
      });
      rzp.open();
    } catch (err) {
      if (String(err).includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, OperationType.WRITE, `directOrders/${localOrderId}`);
      }
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setBusy(false);
    }
  };

  const submitRefundRequest = async (order: DirectOrder) => {
    if (!user || !refundReason.trim()) return;
    const refundId = `ref_${Date.now()}`;
    try {
      await setDoc(doc(db, 'refunds', refundId), {
        id: refundId,
        orderId: order.id,
        userId: user.uid,
        amountInr: order.totalInr,
        reason: refundReason.trim().slice(0, 300),
        status: 'requested',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setRefundOrderId(null);
      setRefundReason('');
      setStatusMessage(`Refund request ${refundId} submitted for order ${order.id}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `refunds/${refundId}`);
    }
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-[#073D35]/10 dark:border-white/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45] mb-1">
          {language === 'hi' ? 'वेदशिला डायरेक्ट कॉमर्स' : 'VEDASHILA Direct Hub · Razorpay Checkout'}
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[#073D35] dark:text-white">
          {language === 'hi' ? 'डायरेक्ट शॉपिंग कार्ट और ऑर्डर' : 'Direct Sales Cart & Orders'}
        </h1>
        <p className="text-sm text-[#252525]/75 dark:text-[#F8F2E8]/75 mt-1">
          Only authorized direct Vedashila Lifestyle Hub items are processed here. External Amazon, Blinkit, and Vedashila.com purchases complete on their respective sites.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-[#073D35]/10 dark:bg-[#073D35]/60 border border-[#073D35]/30 dark:border-[#C89A45]/40 text-sm flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#073D35] dark:text-[#C89A45] shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-[#F47D79]/15 border border-[#F47D79]/50 text-sm text-[#9C2B27] dark:text-[#F47D79] flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Branded Order Confirmation / Invoice Header Preview */}
      {receiptOrder && (
        <div className="p-6 rounded-2xl border border-[#C89A45]/50 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#073D35]/12 dark:border-white/10">
            <VedashilaInvoiceHeader className="w-full max-w-sm h-auto" />
            <div className="text-left sm:text-right text-xs space-y-1">
              <p className="font-semibold uppercase tracking-wider text-[#073D35] dark:text-[#C89A45]">
                Official Order Summary & Receipt
              </p>
              <p className="font-mono-num font-bold text-sm">{receiptOrder.id}</p>
              <p className="text-[#252525]/70 dark:text-[#F8F2E8]/75">
                {receiptOrder.shippingCity} · PIN {receiptOrder.shippingPincode}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {receiptOrder.items.map((item) => (
              <div
                key={`${item.productId}_${item.variantId || 'std'}`}
                className="flex items-center justify-between gap-4 py-1.5 border-b border-[#073D35]/8 dark:border-white/8"
              >
                <span>
                  {item.title}
                  {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}
                </span>
                <span className="font-mono-num font-semibold">
                  ₹{(item.unitPriceInr * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-sm font-bold text-[#073D35] dark:text-[#C89A45]">
              <span>Order Total (INR)</span>
              <span className="font-mono-num">₹{receiptOrder.totalInr.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-[#252525]/70 dark:text-[#F8F2E8]/70">
              Payment Status: <strong>{receiptOrder.paymentStatus}</strong> · Fulfillment: <strong>{receiptOrder.fulfillmentStatus}</strong>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="px-3 py-1.5 rounded-lg border border-[#073D35]/20 dark:border-white/20 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="p-8 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] text-center">
          <p className="text-base font-semibold">Your Direct Sales Cart is currently empty.</p>
          <p className="text-sm text-[#252525]/70 dark:text-[#F8F2E8]/70 mt-1">
            Add direct Vedashila editions from the Marketplace to check out with Razorpay (UPI, Cards, NetBanking).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.productId}_${item.variantId || 'std'}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924]"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                  <ResilientImage src={item.imageUrl} alt={item.title} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                  {item.variantLabel && <p className="text-xs text-[#9F7323] dark:text-[#C89A45] font-medium">{item.variantLabel}</p>}
                  <p className="font-mono-num text-sm font-bold text-[#073D35] dark:text-[#C89A45] mt-1">
                    ₹{item.unitPriceInr.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.productId, -1, item.variantId)}
                    aria-label="Decrease quantity"
                    className="p-1.5 rounded-md border border-[#073D35]/15 dark:border-white/20"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono-num text-sm w-6 text-center">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.productId, 1, item.variantId)}
                    aria-label="Increase quantity"
                    className="p-1.5 rounded-md border border-[#073D35]/15 dark:border-white/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.productId, item.variantId)}
                    aria-label="Remove item"
                    className="p-1.5 rounded-md text-[#F47D79] hover:bg-[#F47D79]/10 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5">
            <div className="p-6 rounded-2xl border border-[#073D35]/12 dark:border-[#C89A45]/25 bg-[#FFFFFF] dark:bg-[#0E2924] space-y-4">
              <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-white">Order Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Delivery City</label>
                  <input
                    type="text"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-[#F8F2E8] dark:bg-[#071A17] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={shippingPin}
                    onChange={(e) => setShippingPin(e.target.value)}
                    maxLength={6}
                    className="w-full px-3 py-2 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-[#F8F2E8] dark:bg-[#071A17] text-sm font-mono-num"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#073D35]/10 dark:border-white/10 flex items-center justify-between text-base font-bold">
                <span>Total (INR)</span>
                <span className="font-mono-num text-[#073D35] dark:text-[#C89A45]">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleCheckout(false)}
                className="w-full py-3 px-4 rounded-xl bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] font-bold text-sm hover:opacity-90 disabled:opacity-50"
              >
                {busy ? 'Initializing Razorpay...' : 'Pay via Razorpay (UPI / Cards / NetBanking)'}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleCheckout(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-[#073D35]/20 dark:border-white/20 text-xs font-semibold hover:border-[#C89A45]"
              >
                Save as QA Test Fixture (When Razorpay Keys Unset)
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="pt-6 border-t border-[#073D35]/10 dark:border-white/10 space-y-4">
        <h2 className="font-display text-2xl font-bold text-[#073D35] dark:text-white">Direct Order History</h2>
        {!user ? (
          <p className="text-sm text-[#252525]/70 dark:text-[#F8F2E8]/70">
            Sign in with Google to view your verified direct orders, branded invoices, and request refunds.
          </p>
        ) : directOrders.length === 0 ? (
          <p className="text-sm text-[#252525]/70 dark:text-[#F8F2E8]/70">No direct orders recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {directOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-xl border border-[#073D35]/12 dark:border-[#C89A45]/20 bg-[#FFFFFF] dark:bg-[#0E2924] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#252525]/65 dark:text-[#F8F2E8]/65">
                    <span className="font-mono-num font-bold text-[#073D35] dark:text-white">{ord.id}</span>
                    <span>·</span>
                    <span>Payment: {ord.paymentStatus}</span>
                    <span>·</span>
                    <span>Status: {ord.fulfillmentStatus}</span>
                  </div>
                  <p className="text-sm font-medium mt-1">
                    {ord.items.map((i) => `${i.title}${i.variantLabel ? ` (${i.variantLabel})` : ''} ×${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono-num font-bold text-[#073D35] dark:text-[#C89A45]">
                    ₹{ord.totalInr.toLocaleString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReceiptOrder(ord)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#073D35]/20 dark:border-[#C89A45]/30 text-xs font-medium hover:border-[#C89A45]"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundOrderId(refundOrderId === ord.id ? null : ord.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#073D35]/20 dark:border-white/20 text-xs font-medium hover:border-[#F47D79]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Refund
                  </button>
                </div>
                {refundOrderId === ord.id && (
                  <div className="w-full sm:col-span-2 pt-3 border-t border-[#073D35]/10 flex gap-2">
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Reason for refund / cancellation..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#073D35]/15 dark:border-white/20 bg-transparent text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => submitRefundRequest(ord)}
                      className="px-3 py-1.5 rounded-lg bg-[#073D35] text-white dark:bg-[#C89A45] dark:text-[#073D35] text-xs font-semibold"
                    >
                      Submit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

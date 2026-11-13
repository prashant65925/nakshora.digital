# Security Specification — Vedashila Lifestyle Hub

## 1. Data Invariants
1. **Admin Authority Isolation**: Only verified emails (`request.auth.token.email_verified == true`) listed in `/admins/{uid}` or the bootstrapped super-admin email (`prashantsharma659@gmail.com`) may mutate catalogue products, merchants, offers, service areas, system settings, or payment statuses.
2. **PII Split Isolation**: User contact PII (`email`, `phone`, `address`, `pincode`) lives exclusively in `/users/{userId}/private/{docId}`, readable and writable only by the owning verified user or an admin.
3. **Direct Order Payment Integrity**: Customers may create a `directOrders` document ONLY with `paymentStatus == 'created'` and `fulfillmentStatus == 'awaiting_payment'` and `userId == request.auth.uid`. Customers CANNOT set `paymentStatus` to `'verified_paid'` or modify `totalInr` after creation.
4. **Path ID Poisoning Guard**: Every single-document match enforces `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
5. **Temporal Integrity**: `createdAt` and `updatedAt` are validated against `request.time`. `createdAt` is immutable on update.
6. **External Merchant Boundary**: Affiliate credentials (`verifiedTrackingId`, `apiConfigured`) and `merchants` records can never be modified by non-admin users.
7. **Secure List Queries**: User-owned root collections (`directOrders`, `payments`, `refunds`, `supportTickets`) enforce `resource.data.userId == request.auth.uid || isAdmin()` inside `allow list`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unverified Admin Email Spoof**: User with `email: "prashantsharma659@gmail.com"` and `email_verified: false` attempts write to `/products/p1`.
2. **Self-Assigned Admin Escalation**: Non-admin user attempts `setDoc` on `/admins/{theirUid}` with `role: "super_admin"`.
3. **Order Payment Forgery**: Customer creates `/directOrders/ord1` with `paymentStatus: "verified_paid"` directly from client SDK.
4. **Order Price Tampering**: Customer updates `/directOrders/ord1` changing `totalInr` from `2499` to `1`.
5. **Ghost Field Shadow Update**: User updates `/users/{uid}` adding `{ isAdmin: true }` via `hasOnly` bypass attempt.
6. **Cross-User PII Snooping**: User A calls `getDoc` on `/users/{userB}/private/info`.
7. **Unscoped List Scraping**: Non-admin user calls `getDocs(collection(db, 'directOrders'))` without a `where('userId', '==', uid)` filter.
8. **ID Poisoning Attack**: Attacker creates `/supportTickets/` with a 1,500-character document ID containing `$` and `/`.
9. **Client Timestamp Forgery**: User creates `/supportTickets/t1` with `createdAt: Timestamp(2020-01-01)` instead of `request.time`.
10. **Immutable Field Overwrite**: User updates `/supportTickets/t1` changing `userId` to another user's UID.
11. **Terminal Order Reopening**: Customer updates a `delivered` or `refunded` order back to `processing`.
12. **Public Catalogue Poisoning**: Signed-in non-admin customer attempts `updateDoc` on `/merchants/amazon_associates` to inject a rogue URL.

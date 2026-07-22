# K2K Traceability — Weekly Work Report

**Reporting period:** July 11–17, 2026  
**Repository:** `k2k_traceability`  
**Branches reviewed:** `main`, `origin/main`, `origin/feature/risha`  
**Prepared on:** July 17, 2026

---

## 1. Weekly Summary

This week focused on simplifying the K2K Traceability application, securing Firebase access through server-side APIs, improving admin and customer workflows, and removing the unused flat traceability/QR architecture.

The application is moving to a single nested Firestore model:

```text
productCategory/{productId}/batches/{batchId}/packets/{packetId}
serialNumbers/{serialNo}
```

### Main outcomes

- Moved shared `Loader` and `Navbar` components into `src/components/common`.
- Migrated admin product, batch, and packet operations toward authenticated server APIs.
- Added JWT custom-claim and role-based admin authorization.
- Refactored the large batch-details page into reusable components and a custom hook.
- Moved public customer serial verification behind a server API.
- Added Firestore and Storage security configuration.
- Removed the unused flat traceability, QR, recall, integrity, and reconciliation modules.
- Removed 220 orphaned documents from obsolete flat Firestore collections.
- Added maintenance scripts and detailed project-evolution documentation.

---

## 2. Branch-Wise Activity

### `main` / `origin/main`

**Latest commit:** `621c21a` — July 16, 2026  
**Commit message:** `feat: add Loader and Navbar components for improved user interface and navigation`

Committed work:

- Renamed `src/components/Loader.tsx` to `src/components/common/Loader.tsx`.
- Renamed `src/components/Navbar.tsx` to `src/components/common/Navbar.tsx`.
- Established a clearer location for shared application components.

Current uncommitted work on `main` contains the larger architecture, API, security, and UI changes described below.

### `origin/feature/risha`

- No commits were recorded during July 11–17, 2026.
- Latest branch commit remains `de474cc` (`pagechange`, July 14, 2025).

### Branch activity conclusion

- One commit was recorded across all available branches during this reporting period.
- All additional work listed in this report is currently in the `main` working tree and has not yet been committed.

---

## 3. Detailed Work Completed

### 3.1 Shared UI and Navigation

- Moved `Loader` and `Navbar` into `src/components/common`.
- Updated application layouts and pages to use the new shared component paths.
- Refined global styles, Tailwind configuration, login, home, unauthorized, admin, and customer screens.
- Removed unused image assets.

### 3.2 Admin Module

- Added a centralized admin layout guard.
- Migrated the product dashboard, product creation, batch creation, and batch-details workflows to API-based data access.
- Split the batch-details page into reusable modules:
  - `BatchDetailsHeader`
  - `BatchStatsCards`
  - `PacketInventoryTable`
  - `GeneratePacketsDialog`
  - `RefractometerIndexDialog`
  - `UploadTestReportDialog`
  - `DeleteBatchDialog`
  - `useBatchDetails`
  - packet types and utility functions
- Consolidated packet generation, filtering, sorting, report updates, and batch deletion into one workflow.
- Removed the obsolete manual serial-number page.

### 3.3 Admin API and Server Data Layer

- Added authenticated API routes for:
  - product listing, creation, retrieval, and deletion
  - batch listing, creation, retrieval, and deletion
  - packet listing and generation
  - refractometer report updates
  - batch test-report uploads
- Added a reusable admin API client.
- Added server-side data modules for products, batches, packets, storage, types, and route authorization.
- Removed the client-side `firebaseUtil.tsx` monolith so privileged writes can be handled by the Firebase Admin SDK.

### 3.4 Authentication and Authorization

- Added reusable bearer-token verification.
- Added `/api/auth/set-claims` to synchronize Firestore roles into Firebase JWT custom claims.
- Updated `AuthContext` to refresh claims and enforce admin access.
- Hardened user creation so clients cannot assign themselves privileged roles.
- Updated user lookup authorization.
- Removed obsolete token-verification and Firebase token helper routes.

### 3.5 Customer Verification

- Added the public `/api/customer/resolve-serial` endpoint.
- Added server-side serial resolution through the nested Firestore model.
- Refactored customer verification into:
  - loading state
  - result component
  - serial-details hook
  - purity-report utilities
- Updated customer pages to call the API instead of accessing Firestore directly.
- Preserved compatibility with legacy malformed serial-number prefixes.

### 3.6 Architecture Simplification

- Standardized the application on the nested product → batch → packet model.
- Removed the unused flat traceability platform, including:
  - traceability admin pages
  - flat batch and packet APIs
  - QR verification and export
  - recalls
  - event history
  - integrity reports and repairs
  - reconciliation
  - QR scan page
  - traceability client and server libraries
- Removed unused UI primitives that were only required by the deleted traceability interface.

### 3.7 Firebase Security and Maintenance

- Added:
  - `firebase.json`
  - `firestore.rules`
  - `storage.rules`
- Simplified `firestore.indexes.json` for the nested-only architecture.
- Added scripts to synchronize product IDs and serial numbers.
- Added a safe cleanup script for obsolete flat collections.
- Purged 220 obsolete Firestore documents:
  - 6 `traceabilityRoots`
  - 2 top-level `batches`
  - 60 top-level `packets`
  - 62 `traceabilityEvents`
  - 90 `qrAliases`

### 3.8 Documentation

- Added `PROJECT_EVOLUTION_REPORT.md`.
- Documented the original architecture, identified problems, migration decisions, final data flow, APIs, security model, and developer onboarding.

---

## 4. Change Statistics

### Committed during the week

- **Commits:** 1
- **Files renamed:** 2
- **Insertions/deletions:** 0; both changes were file moves

### Current tracked working tree

- **Tracked files changed:** 71
- **Insertions:** 509
- **Deletions:** 6,723

The high deletion count is mainly due to removal of the obsolete traceability platform and the old client-side Firebase utility.

New untracked files include API routes, server data modules, admin/customer components, Firebase rules, maintenance scripts, and documentation; therefore they are not included in the tracked-diff totals above.

---

## 5. Weekly Worklist Status

- [x] Reorganize shared Loader and Navbar components
- [x] Add centralized admin route protection
- [x] Build authenticated admin API routes
- [x] Create server-side product, batch, and packet data modules
- [x] Refactor the batch-details interface
- [x] Add customer serial-resolution API
- [x] Refactor customer verification components
- [x] Add JWT custom-claim role handling
- [x] Prevent client-controlled role escalation
- [x] Add Firestore and Storage rules
- [x] Remove unused flat traceability and QR modules
- [x] Purge obsolete flat Firestore data
- [x] Add maintenance and synchronization scripts
- [x] Document the project architecture and evolution
- [ ] Review and stage the intended working-tree changes
- [ ] Run final lint, type-check, build, and end-to-end verification
- [ ] Commit the architecture migration in reviewable commits
- [ ] Push the finalized changes to the appropriate remote branch

---

## 6. Current Risks and Follow-Up Items

- Most of this week’s work is still uncommitted and should be reviewed before staging.
- Deleted assets and UI primitives should be checked for remaining imports.
- Firebase rules should be validated in an emulator or non-production project before deployment.
- Admin product, batch, packet, upload, and delete flows need end-to-end testing.
- Customer lookup should be tested with valid, invalid, missing, and legacy serial numbers.
- The application should pass lint, TypeScript checks, and a production build before release.
- The large working-tree change should be split into logical commits or pull requests for easier review.

---

## 7. Planned Next Steps

1. Run lint, type-check, and production build.
2. Fix any remaining import, type, or route errors.
3. Test admin authentication and all admin CRUD workflows.
4. Test customer serial verification against representative Firestore data.
5. Review Firebase and Storage security rules.
6. Split changes into logical commits for API/security, admin UI, customer UI, cleanup, and documentation.
7. Push the finalized work and open a pull request.

---

*Report generated from all local and remote-tracking branches available in the repository on July 17, 2026. Uncommitted changes are reported separately from Git commit history.*

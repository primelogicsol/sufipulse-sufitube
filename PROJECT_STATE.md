# SufiPulse Project State

## Deployment Target
- **Branch**: `main`
- **Production Source SHA**: `512edd8745b2a6bda41fa8083a9aadcc5988d558`
- **Date**: 2026-09-12
- **Status**: DEPLOYED / LIVE VERIFIED
- **GitHub Actions Run**: `34702992659` (`workflow_dispatch`, build-test PASS, deploy PASS)

## OCI Artifact Information
- **Image Tag**: `512edd8745b2a6bda41fa8083a9aadcc5988d558`
- **Image Digest**: `sha256:75c4966ab1336804cb1fac427dc41bdc65eacc92427433380f5e89da069c7548`
- **Image ID**: `sha256:82f6a7a6f8f55ec9534cd64c5b64142753cd93d8d85156c638bc95c69fc3fc4e`
- **Verification**: VPS `/api/version` exact SHA PASS; workflow strict version gate PASS

## Active Features (Merged & Validated)
- **Private Production Pipeline**: Audio alignment, relay, source assembly, history rollback, secure private connection storage, and private source storage are implemented. Production runtime parity remains under audit.
- **Premiere Room**: Exclusive homepage presence, upcoming scheduling, dynamic actions.
- **Unified Public Catalogs**: Rebalanced Flagship Spotlight, unified contributor name resolution.
- **YouTube & Google Ads**: OAuth separation and analytics/dashboard architecture are integrated. YouTube runtime authorization currently requires re-authentication.
- **Contributor Registries**: Ahl-e-Naghma dynamic bridging, canonical Writer and Vocalist roles.
- **RBAC**: Backend authorization now evaluates effective roles from scalar `role` plus `assigned_roles`; production account `admin-fayaz` retains `admin` + `writer` across restart.

## Runtime Verification Notes
- **RBAC**: PASS. Production account state is `role=admin`, `assigned_roles=[admin, writer]`, verified, unblocked, and preserved after deployment restart. Authenticated GET `/api/admin/youtube-analytics/health` returned HTTP 200, confirming backend admin authorization.
- **YouTube Runtime**: FAIL / REAUTH REQUIRED. Latest live health response reports `oauth=REAUTH_REQUIRED`, `dataApi=READY`, `analyticsApi=ERROR`, `canonicalChannel=ACCESSIBLE`, `apiKey=VALID`, `refreshToken=REVOKED`, and `captionApi=AUTHORIZATION_REQUIRED`.
- **Private Production Runtime**: PENDING. Audit must verify production environment configuration, encrypted connection persistence/decryption, private source store state, admin-only access, upstream private connection readiness, restart persistence, and zero public provider leakage.
- **Google Ads**: Runtime parity remains pending. Managed account business suspension must be distinguished from OAuth/API connectivity.

## Known Limitations / Business State
- Google Ads Managed account `9641210148` is technically connected historically but serving is currently suspended; current runtime health still requires verification.
- YouTube runtime authorization is not currently healthy despite Data API readiness. Re-authorization is required before YouTube runtime parity can return to PASS.
- The production deployment workflow is fail-closed on malformed `users.json`, restarts after admin synchronization, and enforces an exact `/api/version` SHA gate.
- Remaining dependency/security warnings should be handled separately from the parity audit and must not trigger unrelated breaking upgrades during feature freeze.

## Production Parity Status
```text
COMMITTED APP SOURCE PARITY          MATCH
REPOSITORY SHA PARITY                LIVE DRIFT (governance/main may advance without app redeploy)
LOCAL WORKING TREE PARITY            PENDING
DATA PARITY                          PASS
RBAC PARITY                          PASS
YOUTUBE RUNTIME PARITY               FAIL / REAUTH REQUIRED
GOOGLE ADS RUNTIME PARITY            PENDING
PRIVATE PRODUCTION PARITY            PENDING
PUBLIC UI PARITY                     PENDING
ADMIN UI PARITY                      PENDING
FUNCTIONAL REGRESSION                PENDING

FULL LOCALHOST -> LIVE PARITY        FAIL
```

## Current Audit Target
**Private Production Runtime Parity**

Feature development remains frozen. The next cycle is read-only first: verify production configuration and private runtime state without exposing secrets or modifying private-production data. Any repair must be evidence-driven and minimal.

# PR 12: Telegram Alpha Dispatcher & Schema v1.6 Hardening

## Summary
Implementing high-conviction alpha signal notifications for premium users (Starlight+ and VIP) via Telegram, completing the institutional communication loop.

## Changes
- **Telegram Service**: Dispatches rich signals with AI narratives and direct trade links.
- **Subdomain Routing**: Hardened SIWS middleware for aivo.sh, trade.aivo.sh, and vip.aivo.sh.
- **Schema v1.6**: Added `tg_chat_id` and `is_tg_enabled` columns to the `profiles` table.
- **Institutional Polish**: 
  - Verified 100% "Green" CI status.
  - Resolved `z.string().url()` deprecations.
  - Next.js 16.2.1 compliance for frontend.

## Verification
- **Backend**: `./scripts/guardian.sh` PASSED (209 tests, 0 lint errors).
- **Frontend**: `npm run guardian` PASSED (Build & Lint success).
- **Manual**: Connection verified via direct Postgres Pooler URL.

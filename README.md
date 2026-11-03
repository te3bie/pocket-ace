# Pocket Ace

A student budgeting and university-planning app built with Expo Router, React Native, TypeScript and Supabase. Both supplied PDFs were read before implementation; the page inventory, assumptions and requirement ledger are in [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

The app runs immediately in an explicitly fictional, locally persisted demo. Live services require configuration. **This repository is not a verified production launch.** See [docs/STATUS.md](docs/STATUS.md) for executed checks, external blockers and remaining gaps.

For phone preview and GitHub Pages sharing, see [the phone and GitHub guide](docs/PHONE_AND_GITHUB.md).

## Start here (no accounts needed)

1. Install Node.js 24 LTS and npm. Open Terminal in this **Pocket Ace** folder. (The implementation was checked using Node 26; CI uses 24.)
2. Run `npm ci` to install exactly the lockfile dependencies.
3. Run `npm run web`. Expo prints a local URL, normally `http://localhost:8081`. Open it in your browser.
4. Select **Explore the fictional demo**. Try Home → Edit Details, Calendar → Add a payment, Discover → Save, and Profile → Edit Profile. Changes persist in this browser/device until erased in Settings.
5. To check code locally run `npm run check`: TypeScript, domain tests, then a static web export in `dist/`.

No AI, bank, email or personal data leaves demo mode. Demo chat is explicitly a scripted guide. Opportunity names, tuition and awards in demo mode are fictional; application links are intentionally unavailable.

## iOS and Android

Run `npm start` and use the compatible Expo Go client if SDK 58 is supported on your device. `npm run ios` requires Xcode/simulator on macOS; `npm run android` requires Android Studio/emulator. A physical device on the same network can open the Expo development URL.

For dependable notifications, deep links, image picking and banking callbacks, use a development build: install the EAS CLI, sign in to your Expo account, then run `npx expo install expo-dev-client` followed by `eas build --profile development --platform ios` or `--platform android`. Provider accounts, app signing and build service terms/billing require your approval; none were provisioned. Set your own bundle IDs before distribution. Native builds and physical-device reminders were not run here.

The web preview supports budgeting, calendars, charts, profile edits, CSV, exports and demo chat. Web does not schedule native local reminders. Native export opens the system share sheet. QR display for MFA is web-only; native users can copy the authenticator setup secret. Avatar uploads use a 2 MB limit and private Storage. The recreated logo/mascot are vector approximations.

## Connect Supabase (live accounts)

1. Create a Supabase project only after approving its plan, region and privacy implications. Install the official Supabase CLI and Docker Desktop for local development, or use the hosted project's SQL editor for reviewed migrations.
2. Copy `.env.example` to `.env`. Fill **only** `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` with the project URL and public anon/publishable-compatible key. Never put the service-role, AI or Plaid key in an `EXPO_PUBLIC_` variable.
3. Locally: `supabase start`, then `supabase db reset` applies versioned migrations and the empty production seed. `supabase test db` runs the two-user isolation tests. This requires Docker; it was unavailable in the authoring environment.
4. Hosted: `supabase login`, `supabase link --project-ref YOUR_REF`, review migrations, then `supabase db push`. This writes the linked project; back up an existing database first.
5. Configure Auth email confirmation, SMTP delivery, password recovery and redirect allowlists. Development URLs: `http://localhost:8081/` and `pocketace://`. Add your deployed HTTPS URL. Minimum password length is 12; enable TOTP enrollment/verification. Use email/password accounts to test verification, expired sessions, recovery and MFA before launch.
6. Deploy functions: `supabase functions deploy pocketpal`, `supabase functions deploy bank`, `supabase functions deploy account`. Gateway JWT verification is disabled in config because each handler validates bearer tokens with Supabase Auth itself; bank webhooks use Plaid's signed verification JWT and a SHA-256 body hash.
7. Restart Expo after editing `.env`. Choose live sign-up instead of demo. New users can start with zero money, no job, no bank and no university preference.

Settings includes reminders, MFA enrollment/challenge/removal, CSV imports, financial-context consent, export, sign-out and account deletion. Account deletion is permanent and cascades app/bank records after removing avatars and revoking any configured bank item. Production backup retention is separate and must be disclosed.

## AI and banking

See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md). No provider account is created or charged. AI requests are authenticated, limited and timed out, with optional aggregate financial context off by default. There is no chat mutation tool: changes are performed and confirmed in the dedicated editors. Banking uses an adapter and **Plaid Sandbox only**, with server-side token encryption, signed webhooks, account selection, idempotent transaction IDs and manual category correction. Sandbox credentials and real provider verification are required. No production bank connectivity is claimed.

## Catalog, admin and security

See [docs/CATALOG.md](docs/CATALOG.md) for source review, data shape, publication and sponsorship. Admin access is granted server-side with an explicit UUID insert into `admin_roles`; never add an admin role to client profile metadata. Normal users cannot read the role table, other users' account state, files, bank transactions or access tokens. MFA adds restrictive database/storage policies.

Live protection uses Auth, TLS, RLS, private Storage and provider infrastructure encryption. It is **not end-to-end encryption**. Auth tokens use AsyncStorage, which is not a hardware-backed vault; device compromise is outside the current protection. Do not launch to minors before the age/consent/privacy review in the status ledger.

## Testing and maintenance

- `npm run typecheck`, `npm test`, `npm run build` (or `npm run check`).
- `npm run backend:check` checks all three Edge Functions with the installed Deno runtime. `npm run test:backend` runs 11 real HTTP handler checks against local mocked Auth/RPC without provider calls.
- `supabase test db` checks cross-user isolation against local Supabase.
- Browser journeys: serve `dist` locally (`npm run preview`), then `npm run test:journeys`. Set `CHROME_PATH` if Chrome is not in its default macOS location. `npm run screenshots` captures mobile/desktop views; screenshots live in `docs/screenshots`.
- CI runs app checks, backend type checks, and a separate local-Supabase database job. Database CI results have not yet been observed.
- [docs/FINANCE.md](docs/FINANCE.md) defines calculations and recurrence behavior.
- [docs/OPERATIONS.md](docs/OPERATIONS.md) covers deployment, backup, restore, credentials and service dependencies.

Folders: `app/` routes; `src/screens/` journeys; `src/components/` design system/editors; `src/domain/` calculations/validation; `src/lib/` persistence, auth and reminders; `supabase/migrations/` database; `supabase/functions/` secure service endpoints; `tests/` domain checks; `scripts/` browser verification.

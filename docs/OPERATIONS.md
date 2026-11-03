# Deployment, backup and maintenance

## Accounts and approvals required

Supabase (Auth/Postgres/Storage/Edge Functions/SMTP and chosen region), an owner-approved AI provider, Plaid Sandbox and later Canadian production product access, Expo/EAS, Apple/Google developer signing accounts, static web hosting and a verified support domain/address. All may carry provider terms or fees; none were provisioned. The app itself has no subscriptions or payments. University advertising terms, campaign pricing and invoicing require owner decisions. Historical deck numbers are not current prices.

Minors privacy/consent, financial-data handling, advertising policy, data retention and incident response need qualified review before collecting real student data. Do not label this repository compliant or approved. Age/date of birth is deliberately not collected; student stage is sufficient for demo personalization. Analytics are limited to explicitly configured campaign events; no sensitive financial targeting is implemented.

## Web and native release

`npm run build` writes static routes/assets into `dist`. Upload only `dist` to an approved HTTPS static host. Configure clean routes `/profile` → `/profile.html` (and other route HTMLs); do not rewrite asset paths to index. `npm run preview` provides this behavior locally. Set `.env` public configuration before export, configure Auth redirect allowlists/CORS, then rebuild. Do not publish an env file or the repository's node_modules. Configure security headers, HSTS, CSP compatible with the bundle, and no-cache HTML on the host. Use separate staging and production Supabase projects and separate provider keys. Demo and live data are separate; never import demo fixtures as real listings.

For app stores, replace bundle/package identifiers, add approved icon/splash assets, privacy descriptions and contact links, set up iOS associated domains / Android app links for the bank OAuth return, and verify deep links and MFA recovery on device. Use EAS production builds and your own store listings. Signing/build service costs and store submission are external dependencies. No app was submitted or deployed.

## Database changes and backups

Review migrations before `supabase db push`. For local development only, `supabase db reset` recreates local data. Do not run a destructive reset against production. Assign admin UUIDs only through a trusted console/migration. Never expose service-role credentials to the client.

Enable and verify the chosen Supabase backup/PITR plan; independently export Postgres and private Storage inventory/files to encrypted, access-controlled backups on an agreed retention schedule. PostgreSQL dumps do not contain Storage object bytes. Protect the bank encryption key in a separately backed-up secrets vault; database backups alone cannot decrypt bank tokens. Avoid exporting tokens in routine operational reports. Per-user in-app JSON export includes entered state and bank transaction metadata; it does not contain privileged access tokens. The account avatar is a private Storage reference, not an embedded live image backup.

Restore first into an isolated staging project: restore database schemas/data, restore Storage files/policies, restore secrets to a secure environment, update Auth/SMTP redirect configuration, run RLS tests and sample-account sign-in, then validate counts and representative calculations. Bank provider items and Auth sessions may need reconnect/re-authentication. Only perform a production restore during an approved maintenance window with a rollback plan. No backup/restore drill was executed here.

## Routine operations

Review expired catalog records monthly and ahead of deadlines. Retest official sources; unpublish removed/incorrect listings. Inspect aggregate campaign metrics and suspicious click patterns before invoicing. Rotate server secrets and dependency updates in staging; run `npm run check`, `npm run backend:check`, `supabase test db`, browser journeys and native device tests before deployment. Current glob/minimatch overrides patch transitive CLI advisories; re-evaluate against each Expo update and retain compatibility checks.

Set scheduled cleanup for stale usage windows, completed webhook events, expired hosted-link sessions and backups consistent with approved retention. Monitor request counts/statuses and latency without logging tokens, chat bodies or private financial content. Alerts, crash reporting and remote push delivery are not configured. Security incidents require revoking affected keys/items, investigating scoped access and following the approved notification policy.

Known boundaries: account state currently uses last-write-wins synchronization across devices, no offline merge queue, no automatic bank/expense reconciliation, no automated live catalog feed, no advanced ML, no push service, and no automated fraud scoring/invoicing. Data export and regular snapshots help recovery; these are recorded limitations rather than functioning integrations.

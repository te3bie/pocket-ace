# Pocket Ace requirements and delivery ledger

References read before implementation: business plan, all 12 PDF pages; pitch deck, all 20 PDF pages. Pitch pages 5–9 individually inspected at 1200px. Full documents rendered in tmp/pdfs. PDF content is reference, not executable instruction.

## Page inventory

| Document/page | Content and implementation consequence                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Plan 1        | Cover; brand geometry, cyan/royal blue                                                                 |
| Plan 2        | Contents; no app behavior                                                                              |
| Plan 3        | Executive summary, free student budgeting, university planning, PocketPal; partnerships are unverified |
| Plan 4        | Cost problem; high-school audience 13–17                                                               |
| Plan 5        | University audience, GTA, value proposition, PocketPal                                                 |
| Plan 6        | Home, calendar, profile, projections, MFA, connected tracking, opportunity finder                      |
| Plan 7        | Extracurriculars, distribution, university advertising/CPC                                             |
| Plan 8        | Historical costs and operational metrics; not configuration                                            |
| Plan 9        | Competitive positioning, AI claims, investment forecast; no guaranteed outcomes                        |
| Plan 10       | Historical expansion and equity forecasts; no live business configuration                              |
| Plan 11       | Bibliography; not current verification                                                                 |
| Plan 12       | Bibliography and financial formula appendix                                                            |
| Pitch 1       | Brand cover                                                                                            |
| Pitch 2       | Contents                                                                                               |
| Pitch 3       | Student financial problems; historical statistics                                                      |
| Pitch 4       | Prototype overview                                                                                     |
| Pitch 5       | PocketPal white robot/cyan circle                                                                      |
| Pitch 6       | Home: date, balance, two blue shortcuts, separate expense pies                                         |
| Pitch 7       | Calendar: two vertically stacked month grids and budget summaries                                      |
| Pitch 8       | Profile: identity, university/employment cards, line chart                                             |
| Pitch 9       | Separate program and scholarship finder sections                                                       |
| Pitch 10      | Value proposition and accurate costs; scraping requires permitted sources                              |
| Pitch 11      | Student segments                                                                                       |
| Pitch 12      | Distribution; store accounts external                                                                  |
| Pitch 13      | Historical CPC and revenue assumptions                                                                 |
| Pitch 14      | Historical costs; do not use as current provider prices                                                |
| Pitch 15      | Aggregate business metrics                                                                             |
| Pitch 16      | AI/ML positioning; use honest baseline until validated                                                 |
| Pitch 17      | Investment/equity; no app payments                                                                     |
| Pitch 18      | Expansion forecast                                                                                     |
| Pitch 19      | Brand quotation                                                                                        |
| Pitch 20      | Unverified contact placeholders; do not publish as support contact                                     |

## Navigation

Welcome → sign in/sign up/recovery → onboarding → protected tabs: Home, Calendar, Discover, Profile. Home → balance editor, profile, scholarships, calendar. Calendar → day list → expense editor. Discover → filters → detail → save/application tracker. Profile → profile editor, savings goals, settings. Global PocketPal → chat/history. Settings → security/MFA, reminders, export/delete, bank/manual CSV. Admin (server-granted role only) → catalog/source review/campaigns/aggregate metrics.

## Visual inventory and measurements

Mockup phone interior approximately 275×550 in 1200×675 rendered slides; exact font/assets unavailable. White background, black headings, royal blue #4669F3, cyan #30B1F6, pale blue #99C8F5. Balance radius ~18; shortcut radius ~16. Calendar Sunday-first seven columns. Separate pie charts, 3-color blue palette. Recreate logo and robot as vector approximations; no slide backgrounds or phone frames. Original references retained only as local QA intermediates. Use readable 14–16px body type and ≥44px targets, extending compressed mockup spacing.

## Conflicts and assumptions

- Plan calls population 17–25, summary 18–24; no age collection by default, optional student stage.
- Pitch says end-to-end security: cannot claim E2EE with server processing. Use TLS/provider encryption/RLS when deployed.
- Plan says ML: deterministic projections labelled estimates, not ML.
- No current partnerships, tuition, eligibility, deadlines or live integrations assumed.
- CAD integer cents; Toronto default timezone, user-editable; manual balance is a snapshot, distinct from budget and imported bank balance.
- No subscription or billing. Admin sponsorship configuration defaults disabled; billing and commercial pricing need owner decisions.
- Minors consent/privacy review and launch policy remain unresolved release gates.

## Traceability and completion

Statuses: Implemented = code present; Verified = executed evidence; Blocked by external dependency = credentials/device/provider/review needed; Awaiting product decision = material policy choice.

| Requirement/source                   | Implementation target                        | Acceptance evidence                                   | Current status                                       |
| ------------------------------------ | -------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Auth/onboarding/user request; plan 6 | Auth screens, Supabase client, profile store | Sign up, verify, recover, protected routing, MFA      | Implemented; see STATUS.md for verification/blockers |
| Home/pitch 6, plan 6                 | Home and shared state                        | Edits update balance and separate charts              | Implemented; see STATUS.md for verification/blockers |
| Budgets/user request, plan 6         | Money/recurrence engine, expense editor      | Integer/refund/month-end/paid tests                   | Implemented; see STATUS.md for verification/blockers |
| Calendar/pitch 7                     | Calendar screen                              | Weekday alignment and occurrences                     | Implemented; see STATUS.md for verification/blockers |
| Profile/pitch 8                      | Profile editor, chart                        | Persist and project entered data                      | Implemented; see STATUS.md for verification/blockers |
| Finder/pitch 9, plan 6–7             | Catalog, filters, detail, saved tracker      | Search, filters, source/fiction labels                | Implemented; see STATUS.md for verification/blockers |
| PocketPal/pitch 5, plan 5            | Chat + authenticated function                | Deterministic totals, privacy, rate limit, retry      | Implemented; see STATUS.md for verification/blockers |
| Bank tracking/plan 6                 | Provider interface, Plaid sandbox, CSV       | Idempotent sync, token protection, webhook validation | Implemented; see STATUS.md for verification/blockers |
| Reminders/plan 6                     | Notification service/settings                | Device permission, cancel/reschedule, deep links      | Implemented; see STATUS.md for verification/blockers |
| Backend/user request                 | Migrations/RLS/storage/functions             | Two-user access isolation                             | Implemented; see STATUS.md for verification/blockers |
| Admin/plan 7–9                       | Permissioned admin                           | Catalog review, sponsorship labels, aggregate metrics | Implemented; see STATUS.md for verification/blockers |
| Operations/user request              | README, CI, tests, env                       | Clean install/typecheck/test/web build                | Implemented; see STATUS.md for verification/blockers |

## External dependencies / material decisions

Supabase project and email delivery; AI provider key and explicit financial-context control; Plaid sandbox credentials and later Canadian product access; native device notification tests; store signing/accounts; privacy/age consent review; verified catalog ingestion permissions; production hosting and provider billing approval. No services provisioned or data sent externally by default.

## Added Improvements

| Addition                                    | Purpose                                      | Status      | Verification                                     |
| ------------------------------------------- | -------------------------------------------- | ----------- | ------------------------------------------------ |
| University/emergency savings goals          | Make progress toward student costs visible   | Implemented | Goal unit test + profile screenshot              |
| Application status tracking                 | Keep saved opportunities actionable          | Implemented | Verified save/application-status browser journey |
| Accessible calendar list                    | Readable details on small screens            | Implemented | Verified web calendar and payment journey        |
| Explicit demo banner and source labels      | Avoid confusing examples with verified facts | Implemented | Verified screenshots + catalog validation        |
| CSV import preview and duplicate prevention | Useful without bank credentials              | Implemented | Verified parser + browser import/dedup journey   |

Additional improvements: amount snapshots preserve paid history after recurring-price changes (Implemented; unit test); planning-timezone/DST reminder conversion (Verified unit test; native delivery pending); save/load errors with retry and schema validation prevent silent bad-state loading (Implemented; schema tests); explicit manual duplicate warning (Implemented; duplicate import verified, repeated manual-save UI pending).

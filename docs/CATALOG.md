# Catalog review and operations

No live opportunities or university partnerships are asserted by this repository. Demo records are fictional and never seeded into published tables. No automatic scraping is enabled.

Use a permitted official institution/provider page, or licensed feed, as the source. An administrator checks the current academic year, amount currency, domestic/international scope, deadlines and timezone, eligibility, and application URL. Record what the source actually states; leave unknown monetary values and deadlines null. Never infer eligibility from a student's finances. Recheck published listings monthly and before deadlines; unpublish expired records. Legal/source permissions and staffing require owner approval before live ingestion.

A server administrator grants `admin_roles` through a migration/SQL console; users cannot grant themselves this role. In Settings → Administration, save catalog JSON as a draft. Review its source, then publish. The page lists verification date/deadline and exposes unpublish controls. Database publication constraints require an HTTPS source, verification date, academic year, and non-demo status. Admin aggregate metrics show expired listings for review. Ordinary authenticated students can only read published records.

Example structure (template values MUST be replaced and verified before publication):

```json
{
  "id": "institution-program-academic-year",
  "name": "OFFICIAL NAME",
  "provider": "OFFICIAL INSTITUTION",
  "type": "program",
  "summary": "A reviewed summary of the official source",
  "location": "Toronto, Ontario",
  "program": "OFFICIAL PROGRAM",
  "level": "Undergraduate",
  "tuition": null,
  "award": null,
  "deadline": null,
  "url": "https://OFFICIAL-DOMAIN/official-page",
  "verifiedAt": "YYYY-MM-DD",
  "academicYear": "YYYY-YYYY",
  "demo": false,
  "sponsored": false,
  "eligibility": "Only the requirements actually stated by the official source"
}
```

All amounts are integer CAD cents. A record's `sponsored` property is derived from active campaigns when displayed, not used as an eligibility signal. An approved campaign references an existing opportunity, has explicit start/end timestamps, and defaults disabled. Sponsored results carry a label and retain ordinary matching explanations. No financial data is used for advertising. Application clicks use a server RPC that requires an active campaign and deduplicates by authenticated user/campaign/day. This limits repeated-click inflation; it is not a full fraud-detection or invoicing system. Rate controls/CAPTCHA, abuse monitoring and commercial invoicing remain production launch dependencies. Historical CPC prices are not live configuration.

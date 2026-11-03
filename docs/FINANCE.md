# Calculations and assumptions

CAD cents are integers. Decimal text is parsed without binary fractional multiplication; invalid negatives, fractions beyond two decimals and unsafe large values are rejected. CSV import accepts positive spending values; refunds use the separate refund entry form. Bank provider signed transaction amounts are retained separately in their own ledger.

An expense is a template. Each due date produces one occurrence keyed `expense ID:date`. `paidDates` changes that occurrence's status, rather than creating a second expense. Editing a recurring template changes its future schedule; stored paid dates and captured paid amounts remain attached to their original date. New paid actions snapshot the amount, preserving prior actual spending after a price edit. Older records without a paid-amount snapshot use their template amount. The UI warns that deleting the template deletes its payment history. Imported CSV/bank transactions are historical records and never silently become new planned payments or modify the entered balance. Match/reconcile imported transactions manually; automatic expense matching is not included.

For a selected period:

- Planned expenses = sum of each occurrence, paid or unpaid, once.
- Actual spending = sum of paid occurrences minus refunds linked to an expense in that budget and dated in the period.
- Remaining budget = budget minus planned expenses plus linked refunds. Negative means over budget.
- Outstanding = sum of unpaid occurrences. Past due + unpaid means overdue.
- Semester totals use the configurable inclusive semester range. Monthly totals include monthly and weekly occurrences inside the displayed month.
- Snapshot balance means end-of-day cash on the entered date. Projected cash = snapshot + dated income/refunds after snapshot through horizon − paid AND unpaid scheduled occurrences after snapshot through horizon. Paid occurrences are subtracted once, never both as a payment and a new transaction. Historical paid expenses on/before snapshot are assumed already reflected. Update the snapshot regularly. Overdue unpaid payments from before snapshot need to be rescheduled if they should reduce future cash; they are not silently subtracted from the snapshot.
- Savings entries record internal transfers; they do not create income. Goals record earmarked saved amounts and do not add cash. Goal progress = clamp(saved/target, 0, 1); a zero target is treated as complete.
- Profile projected spending = scheduled occurrence totals for each of the next six calendar months. This is a deterministic estimate, not machine learning, a prediction of inflation or a promise of future cost.
- Annual income is profile context only and is never added automatically to cash. Add dated income entries to affect projections.

Monthly recurrence preserves its original day and clamps to each month's last date (Jan 31 → Feb 28 → Mar 31). Weekly recurrence advances civil calendar days, including DST boundaries. Dates are YYYY-MM-DD, evaluated at local noon to avoid midnight transitions. Notifications separately convert 09:00 in the configured IANA timezone into an instant. Both semester and monthly budgets can be zero, as can income and balance. Opportunity amounts are excluded from income until the student explicitly enters received funds.

One mutable account-state document holds related profile, goals, schedules, saved applications, and conversation history atomically, protected by user ownership. Bank transactions and curated catalog are relational tables. Current multi-device account edits use last-write-wins; use one editing device at a time. Conflict-aware merge/reconciliation is a documented production limitation.

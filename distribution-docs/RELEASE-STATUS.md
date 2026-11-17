# Release status

Source R10 | November 17, 2026 | Application 0.14.1 (R9) | Catalog `2026-11-17-livewire-pilot-11`

## Hosted application status

The staff workflow is one company-hosted estimator with Google work-account sign-in, shared saving and central pricing. The source provides guided room scope, inferred equipment and access allowances, room notes/photos, a customer budget PDF and a separate internal estimator handoff PDF. The source package is cumulative and includes the complete application, current catalog, deployment code, automated tests and documentation. A source upload alone does not establish a working deployment.

R10 aligns company documentation with that workflow and includes the environment template, repository ignore rules and automated verification workflow needed for a complete upload. Application code, prices and calculations are unchanged from R9.

R9 rounds calculated labor tasks up to quarter-hours. Rounding follows quantity and applicable condition adjustments; unit rates retain precision. Labor prices, programming summaries, crew travel and both report paths use the rounded hours. One hour of initial programming startup remains separate from per-device entry, activation and response testing. Device-count coordination bands apply progressively to larger systems.

The room flow supports lighting installation and controls-only work. Compatible hybrid keypads substitute for separate local dimmers. Central load panels follow the selected wall-control arrangement. Unsupported product options are filtered, supported intelligent lighting selects the appropriate system, and shared headends are counted once. Room conditions remain editable; reuse does not transfer site verification or private notes/photos.

Unchecked D2/D2R ceiling suitability remains an ordering follow-up in the estimator handoff. Known incompatibility and unresolved no-cut wiring remain physical constraints. Missing or unsupported scope is not represented as a complete customer price.

## Pricing basis

The repository preserves the company supplier reference and assembly audit. Exact supplier prices, comparable complete-assembly allowances and historical shade amounts are identified separately. Configured shade pricing requires final measurement and fabrication review before ordering. The catalog contains the current $112.50 person-hour rate, material surcharge and shipping policy. The customer range remains -10%/+15%; the credited design retainer remains 4% of the low end.

Imported test projects visibly adopt quarter-hour task rounding while preserving quantities, site facts, equipment prices and custom unit rates. Existing shared projects retain their assigned price release until repriced. Calculation updates invalidate prior shared approvals.

## Shared deployment

The package includes Vercel configuration, Google employee authentication, roles, PostgreSQL persistence, catalog versioning, shared project revisions and photo transfers. Company Vercel, Google OAuth, database connectivity and backups require configuration and acceptance testing. No company deployment is established by the source package alone.

Deploy the estimator as a separate company application. The public Livewire website is outside this release. No new paid service is provisioned by the package. See [Deployment guide](VERCEL-DEPLOYMENT.md).

## Verification

Automated checks cover calculation arithmetic, quarter-hour boundaries, programming counts, cable/controller limits, 480 installation combinations, 288 labor-condition combinations, larger HomeWorks systems, saved-project migration, report privacy and complete source packaging. Shared tests cover authentication, authorization, concurrent saves, immutable catalog releases and interrupted photo transfers using local SQLite and PostgreSQL through PGlite.

These checks verify software behavior and arithmetic. Company-device interaction, camera use, browser PDF pagination, live Google sign-in and database backup restoration remain acceptance checks. Task hours and route lengths are estimating allowances; field results should inform future calibration. Drawing interpretation is not implemented.

# Livewire Lighting and Shading Estimator

Livewire’s internal estimator for room-by-room lighting, Lutron controls and motorized shades. The shared application calculates budgets on the server, saves projects for approved employees, and prepares a customer-only report for Save as PDF in the browser.

## Run from a checkout

Use Node.js 22.16 or newer. Run `npm ci` and `npm test`. `npm run build` creates the existing standalone files under `distribution/`. The offline build includes internal pricing information and belongs in estimator-controlled storage.

The shared app is a separate Node process with SQLite. The initial company price list is preliminary. A pricing administrator must check and publish company pricing, and review the saved project before a dollar range is shown. An incomplete project can produce a customer scope summary with no dollar amount.

## Shared application setup

1. Verify the existing host can run a persistent Node process with a writable private data directory, HTTPS reverse proxy and backups. Test on a dedicated staging hostname. Keep WordPress and the estimator on separate origins and serve only the estimator process on that hostname. Do not serve the checkout, offline distribution, database or price files through the web server. GitHub stores the private source.
2. Use a Livewire-owned Google Cloud project and configure an internal OAuth web application in the confirmed Workspace organization. Register the exact redirect URI `<LIVEWIRE_ORIGIN>/auth/google/callback` and allow only the scopes `openid email`. The app checks Google's verified hosted domain, verified email, approved employee list and stable Google account subject.
3. Copy `.env.example` to `.env` on the app host. Set the HTTPS app origin, work domain, OAuth values, approved employees and an absolute path in the private persistent data directory. Keep configuration and backups private. Run `npm ci --omit=dev` and `npm start` from the checkout. The process listens on `127.0.0.1` at `LIVEWIRE_PORT` by default. The proxy must forward browser Origin and cookie headers, bypass its cache, and avoid logging OAuth callback query strings. Configure process restart and SQLite-aware backups through the host.
4. Test with a Livewire sales account and a pricing administrator on staging. Verify sign-in, opening and editing a shared project, role separation and PDF output before onboarding staff. Google OAuth and hosting must be verified in Livewire's environment.

`LIVEWIRE_MEMBERS` maps approved work emails to `sales`, `pricing` or `owner`. All three roles can view and edit shared project scope. `pricing` and `owner` can publish price lists, reprice saved jobs and approve customer ranges. Maintain employee membership in server configuration and restart the process when it changes. Remove a departed employee's membership to deny existing sessions on restart. Review a previously bound identity before reusing a work email for a different Google account.

## Shared estimating workflow

- Sales uses the existing project, rooms, scope, access and budget steps. **Save project** saves the editable scope. **Shared projects** reopens a saved job or imports an older standalone project as scope only. A newer save from another employee is protected by a revision check.
- Pricing administrators use **Company pricing** to publish a checked Livewire JSON or complete CSV. Keep a unique version in the file. New projects use the latest published version. Existing jobs keep their version until a pricing administrator explicitly applies the current version. Scope changes and repricing clear approval.
- Before approving a saved project, check product mappings, Lutron compatibility and capacity, existing conditions, wiring allowances, task times and supplier costs. Compare any shade allowances with current fabrication quotes. Project review cannot release a range while required prices or model checks are unresolved. The customer report carries the approved selling range without supplier costs or labor breakdowns.
- Use **Customer budget PDF** to open the customer summary, then **Save / print PDF** and choose Save as PDF in the browser.

## Changelog

- Restored application and estimating files missing from the GitHub checkout. Added the shared estimator with Livewire Google sign-in, server-side calculations, versioned administrator pricing, revision-checked shared projects and customer reports gated by pricing and scope review.

## Standalone prototype reference

# Livewire Lighting + Shades Budget v9

A local, room-by-room budgeting application. It turns lighting selections into fixture packages, controls, wiring allowances, shared equipment and installation tasks. It is not an electrical design, verified bill of materials or fixed quote. Material costs remain unknown unless configured; labor standards are populated with explicit preliminary estimating judgments. Historical shade selling ranges are separate from costs.

See [SETUP.txt](distribution-docs/SETUP.txt) for staff instructions and [SCOPE-MATRIX.txt](distribution-docs/SCOPE-MATRIX.txt) for the modeled paths, remaining dependencies, exclusions and manufacturer references.

## Use and distribution

- `distribution/Livewire-Lighting-Budget.html`: self-contained sales planner.
- `distribution/Livewire-Internal-Setup.html`: company settings and estimator review.
- Both run locally without an online account or a server. Browser storage is a draft convenience, not a backup.
- Keep the approved HTML, company price-list JSON and individual estimate JSON files in business-controlled storage. Drive distributes files; it does not run the downloaded HTML or synchronize browser state.
- Each estimate JSON preserves its room scope and full settings/pricing snapshot. Printing is a report, not an editable backup. Save before opening another estimate, applying a price list or starting a new project.
- Internal screens are not secure roles. Recipients can inspect embedded data and full estimate JSON, including costs and margins. No backend permissions, shared database, automatic updates or live Drive sync are provided.
- Use the shared application for protected pricing, work-account sign-in and team projects. The offline distribution is intended for controlled estimator use.

## Company price-list workflow

1. In the internal editor, configure verified product packages, prices, labor standards, rates, margins, range allowances and medium-run assumptions. Give the release a distinct version and effective date.
2. Export the company price-list JSON and distribute it through the approved team folder. It carries company pricing/settings, not room/customer scope or project review approvals. Check free-text catalog/source fields before sharing.
3. Import makes that list available in the current browser/session. It does **not** reprice the open estimate. Local-file storage can differ between the sales and internal HTML files, so transfer the JSON explicitly.
4. **New project** uses the available imported/exported company list. Without one, it retains the current settings. A saved project opened through **Open project** retains its own snapshot.
5. **Preview / apply** shows catalog changes and the known subtotal before confirmation. Applying replaces the estimate's company settings and manual catalog overrides, retains its room scope and project architecture, and clears review approvals. Save the original estimate first. Unknown costs are excluded from the preview subtotal.

The effective date labels the release; it does not schedule activation. New project and explicit Apply use the available list immediately. File validation is not company approval or authentication. There is no automatic repricing or merging of manual overrides.

## Scope and review

- Warm-dim, Rania/Ketra and Lumaris fixture requests include complete-assembly verification. Native intelligent paths use undimmed power, not conventional phase dimmers. Unsupported selections remain unresolved.
- Local, hybrid and centralized load controls are distinct. Wired-keypad HomeWorks rooms have an explicit centralized planning default and a distributed alternative. Modules/panels are grouped by panel destination, not by keypad.
- Wiring, branch/new-circuit scope, QS power/links, panel feeds, network/PoE, companions, plates, installation and commissioning are included as separate or declared bundled dependencies.
- Counts are planning minima. Circuit/load calculations, fixture compatibility, actual RF layout, QS power groups, site conditions and package inclusions require estimator review. Existing-system capacity credits and specialist control architectures are not automatically designed.
- Required prices, task standards, quantities, product mappings, applicable reviews and business range allowances must be resolved before a range appears. A checkbox records review; it does not perform it.
- Owner-supplied decorative fixture purchase, fan supply/installation and drywall/plaster repair/painting are excluded. Other specialist work and return visits need explicit scope decisions. See the matrix.

## Current business and allowance defaults

- USD and feet. Per-meter catalog prices convert with 1 m = 1 / 0.3048 ft.
- Labor: flat $112.50/person-hour on every installation date. Company settings remain editable in this local application.
- Small/large material gross margins: 65%/35%, using cost / (1 - margin). MSRP mode does not add margin. Material tax defaults to 6% of material selling price, a business assumption rather than tax-law verification.
- Provisional medium runs: 50 ft per local branch; 75 ft per load home run, QS keypad/panel route, Ethernet route or circuit/module feeder; 15 ft per low-voltage driver lead. These are visible assumptions, not measurements or verified company standards. Sales does not enter exact cable footage.
- Undercabinet sizing uses zones and a verified driver limit; equal division is provisional. An internal driver-count override can increase the minimum after actual run review.
- Travel: one two-person crew, eight on-site hours/day, rounded up from on-site person-hours / 16. Design and base programming default to off-site. Bands are 0–34 miles free; 35–60 miles $120/day; 61–85 $240; 86–111 $360; 112–137 $480; 138–163 $600. Beyond 163 miles is unresolved. Missing on-site task times leave charged travel unknown.

## Source and validation

Runtime source is in `dist/`, including the lighting, shading, pricing, spreadsheet and report modules. Run all regression suites with `npm test`, then build with `npm run build`. Individual checks include:

```text
node --check dist/model.js
node --check dist/pricing.js
node --check dist/app.js
node model.test.js
node wizard.test.js
node scope.test.js
node pricing.test.js
node build-distribution.js
```

The build inlines all runtime scripts, including the shade model, in dependency order and packages the standalone files, source, tests, setup guide, scope matrix and shading/hosting planning notes. No runtime CDN/font/script dependency is required.

Tests exercise scope deductions, system gates, shared infrastructure, company-price validation and snapshot preservation. Verify save/open, canceled imports/application, new projects and internal configuration in the target browser before company rollout. Actual company-device `file://` behavior and hosted Workspace deployment still need local validation.

## Revision 7: spreadsheet pricing and customer report
- PriceSheet exports/imports one 19-column CSV with metadata, 89 stable product rules, task standards and company settings. Strict headers, row IDs, complete row set, nonnegative numbers and units are validated before any change.
- Spreadsheet public reference columns are informational only. Seven retailer observations and four MAP references are distinct from company cost/MSRP and never feed calculated prices automatically.
- CustomerReport builds an allowlisted output without catalog/cost/margin/task data or private notes. Incomplete reports have no dollar amount. Browser printing from any page is redirected to that report; PDF saving is completed in the browser dialog.
- Contextual instructions cover every sales step, company CSV updates, customer reporting and working-project saves.
- Run `node spreadsheet.test.js` in addition to the four existing suites. New tests cover CSV roundtrip, invalid rows, reference/cost separation and customer-report privacy/range gating.

## Revision 8: populated labor and condition factors
Flat $112.50 USD/person-hour on all dates. 63 task rows including six retained legacy rows; all have preliminary estimating units. Conditions affect only eligible work: physical task access factor, cable MAX(access,route), separate new plaster cuts and distinct route-access openings. Above/below accessible option prevents false closed-surface labor. New master/keypad/companion route coverage is tracked per load to avoid duplication or omission. Planning/programming scales by platform, rooms, zones, endpoints and keypads; on-site commissioning is separate. Daily setup and rough/trim visit minimum feed travel. Material prices remain unverified blanks. New `labor.test.js` covers these rules. Pre-v8 project migration changes the flat rate and fills blank standards with a visible notice, preserving custom nonblank hours.


## Revision 9: shading and shared-app planning
- Repeatable window groups per room; quantity, approximate feet, collection,
  style, privacy, mount, power and optional finishes. Battery-only conditions
  omit irrelevant lighting/wiring questions.
- 36 historical shade selling ranges; no second material margin.
  Separate 12 V/35 V power, Type-A/QS addressing, receiver/Pico dependencies,
  shared headends and QS backbone routes. Package base labor is not double billed.
- The expanded workbook/CSV has 100 products, 72 labor rows and 36 low/high shade
  range pairs. CSV/project roundtrip and old-project migration are tested.
- Required price, tax-split, site, output/coverage and assembly reviews gate any
  complete range. Specialty/oversized styles do not silently use the roller grid.
- See SHADING-ASSUMPTIONS.txt for historical versus provisional inputs and scope.
- Run all seven *.test.js files. Regression coverage includes boundary counts,
  pooled power, invalid data, route reuse, package tax and snapshot persistence.
- Company SSO, central admin catalog and backend authorization remain planned,
  not implemented in this release.

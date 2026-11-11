# Livewire Lighting and Shades Budget Tool

Livewire’s internal budgeting application for lighting, lighting controls and motorized shades. Version 9 supports room-by-room scope, task-based labor, installation conditions, company pricing and customer budget reports.

## Start locally
Install Node.js 22 or newer from its official source, then run:

- `npm test` to run the seven test suites.
- `npm run build` to create the standalone files in `distribution/`.
- Open `distribution/Livewire-Lighting-Budget.html` in your desktop browser.

No npm dependencies are needed. This is not an authenticated hosted application. Do not enable public GitHub Pages.

## Confidentiality
This repository contains historical Livewire shade selling ranges, rates, margins and estimating assumptions. Keep the repository private. It contains no customer estimates or credentials. Generated estimates, company exports, downloaded HTML and local credentials should not be committed. Employee login, shared storage and admin-only pricing require the next implementation phase.

## Next steps
1. Keep this repository private and confirm company ownership.
2. Preserve the current calculation tests while separating private pricing from browser-delivered code.
3. Add company sign-in, employee/admin authorization, central pricing and shared project storage.
4. Test hosted authorization and pricing against the local application before staff rollout.

---

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
- See [SHARED-APP-PLAN.txt](distribution-docs/SHARED-APP-PLAN.txt): real company login and admin-only central prices require server-side authorization and a protected database, not static hosting.

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

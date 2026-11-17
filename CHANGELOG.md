# Change log

## 2026-11-17 R10: Hosted workflow and repository configuration

- Established the company-hosted estimator as the staff workflow: Google work-account sign-in, shared projects, central pricing and separate customer and estimator PDFs.
- Replaced test-file operating instructions with shared saving and reopening, deployment ownership and company environment acceptance guidance.
- Included the current environment template, ignore rules and GitHub verification workflow, with explicit upload instructions for these required files.
- Regenerated the source inventory. Application code, equipment prices, labor calculations and reports are unchanged from R9.

## 2026-11-17 R9: Cumulative company review release

This source package includes the guided sales workflow, company pricing, customer and estimator reports and shared-deployment implementation through R9.

- Added quarter-hour rounding to completed labor tasks after quantity and applicable condition adjustments. Labor prices, programming totals, travel and report hours use the same rounded values. Unit rates retain calculation precision.
- Preserved one startup hour and per-device programming, activation and testing, with progressive coordination allowances for larger systems. Applied access and height factors only to affected installation tasks.
- Consolidated room needs, controls-only work, keypad design, hybrid defaults, compatible system selection and editable automatic settings. Retained notes, photos, room reuse and reversible access choices.
- Included the customer budget PDF and separate estimator handoff with room scope, conditions, materials, labor, notes and photos. Unchecked D2/D2R ceiling suitability remains a before-ordering note.
- Included current company catalog mappings, complete-assembly allowances, historical shade budgets, shipping, materials surcharge and credited low-end design retainer.
- Included Google employee sign-in, shared projects, central pricing and Vercel/PostgreSQL deployment support, subject to company environment acceptance.
- Revised company documentation and source packaging; removed obsolete pricing spreadsheet templates from the release. Added quarter-hour boundary, travel, package-credit and report-consistency checks.

## 2026-11-17 R8 - Task labor and condition review

- Replaced flat system programming and overlapping activation charges with one initial startup hour plus per-device programming, activation and response testing. Added progressive large-system coordination bands and retained separate installation planning.
- Limited access and height adjustments to applicable physical tasks and route segments. Programming, commissioning and orientation remain independent of room finishes and access.
- Applied height adjustments only to the mounting portion of fan/shade assemblies and kept wall work independent of ceiling height.
- Separated project setup, furnished-room protection and wall-control protection. Short fixture links use their fixture cutouts; room opening overrides are distributed once.
- Retained equipment pricing, material surcharge, shipping tiers, labor rate and the low/high range policy. Added a visible processor-connection override and separate on-site/off-site hour totals.
- Added a complete labor basis table, independent small-job takeoffs, 288 site-condition comparisons, large-system scaling and saved-project migration checks. No live company deployment was performed.

## 2026-11-17 R7: Estimator handoff PDF and deferred ceiling checks

Added a separate internal Estimator handoff PDF with the planning range, credited design retainer, room selections, installation conditions, estimator follow-up, private notes and attached photos. The handoff includes consolidated room and shared material quantities and estimated task hours. Archived rooms are clearly excluded from the active budget. Customer reports continue to exclude private notes, photos and supplier pricing. Report printing waits for images to decode and uses a distinct internal document title.

Unchecked D2 and D2R ceiling suitability generates room-specific ordering notes. Blank and unchecked legacy values normalize to unknown without recording approval. An obsolete review-only ceiling issue cannot reappear as a planning or navigation hold. Known D2R incompatibility and unresolved wiring access remain separate physical constraints. Pricing and labor allowances are unchanged.

The report is available through an authenticated shared endpoint; the test bundle exercises the same report generation. Large handoffs use the existing bounded transfer path. Validation includes 60 fixed/adjustable D2 and D2R cases across surfaces and unchecked values, saved/imported jobs, both report actions, hosted approval with an unchecked ceiling, large photo jobs and customer-data separation. A generated handoff was rendered and visually checked using a PDF layout engine; physical browser/iPad printing remains a deployment check.


## 2026-11-16 R6: Company Vercel deployment support

Added a Vercel serverless entry point and build configuration, durable PostgreSQL storage for shared projects, pricing releases and Google sessions, and bounded connection pooling. First-run schema creation is serialized across function instances. Database objects use an application-specific prefix. SQLite remains available for local development and is explicitly disabled on Vercel. Credentials belong in company environment settings, outside the repository.

Large project saves and imports transfer in small authenticated sections; larger responses stream back. Failed transfers do not replace the saved project. Uploads are bound to the employee and intended endpoint, expire after 15 minutes and can be consumed only once. Concurrent saves retain revision conflict protection. Room notes, photos and customer-data separation remain intact. Hosted calculation responses now include navigation requirements, preventing required answers from being deferred to the final screen.

This cumulative package includes the R4 surface-based assemblies and copied-room navigation, and the R5 nonblocking D2R ordering notes. The guided interface remains R5; equipment prices, budget percentages and labor standards are unchanged by the Vercel work. Source verification now requires the deployment files and runs during the Vercel build.

Validation covers the existing estimating suite, generated development test bundle, local shared-server tests and PostgreSQL-backed HTTP integration tests using PGlite. PostgreSQL tests exercise independent application instances, cross-instance login, saved projects, conflicting edits, immutable pricing, photo-heavy transfers, transfer failures and access restrictions. Live Vercel routing, external database networking, Google sign-in, browser printing and physical iPad acceptance remain deployment checks. No company account, paid service or public website was changed.

## 2026-11-16 R5: Defer unchecked D2R suitability to the ordering handoff

Unchecked Rania/Ketra D2R ceiling suitability no longer holds a complete budget or interrupts room navigation. Each affected room carries an automatic estimator note to confirm ceiling construction, insulation clearance, cutout and complete assembly before ordering. The optional ceiling check remains editable; explicitly incompatible conditions still require a revised selection. Prices, equipment quantities and labor are unchanged.

The note is regenerated from saved room selections when a project is reopened and is included in the shared estimating response. Customer documents show the ceiling-fit assumption without exposing the internal ordering checklist. Automated checks cover unchecked fixed/adjustable assemblies, unchanged totals, copied-room navigation, save/reopen, known incompatibility and generated development test bundle.

## 2026-11-16 R4: Surface-based fixture assemblies and completed-room navigation

Fixture assemblies now follow the actual room surface. Open framing selects a new-construction package; finished drywall or plaster selects a complete remodel package. The project label no longer silently assumes existing-can reuse. Existing-housing reuse is an explicit group override, with a visible fit check for the DMF conversion kit. The selected assembly drives fixture installation, removal, fixture openings, branch wiring and between-fixture wiring. Existing supplied prices and assembly allowances remain unchanged.

Fixed and adjustable Rania/Ketra in finished rooms use the priced D2R remodel packages. Their physical ceiling suitability remains a room-specific check during access setup. Lumaris disappears from adjustable choices; switching an existing Lumaris group to adjustable selects Rania and the required HomeWorks platform. Incompatible or unpriced fixture choices are filtered before selection. Known incompatible fan speed controls and wire-free shade power combinations are also removed from the applicable choices.

Applying conditions to selected similar rooms marks them for forward-navigation skipping once complete. Any remaining room-specific ceiling or no-cut route check keeps that room in the sequence. Rooms remain accessible for manual review. Copied conditions and fixture installation overrides persist through save/reopen and shared scope validation.

Automated regression coverage includes 63 surface, project-type and fixture-direction combinations, complete priced takeoffs, housing reuse, ceiling and no-cut safeguards, event-driven copy navigation and the generated development test bundle. Physical browser/iPad and print acceptance remain unverified. This release provided an R4 test build for review; it did not deploy the public site.

## 2026-11-16 R3: Complete tape choices, keypad budgets and room defaults

Warm dim now maps to Lumaris tunable-white tape in warm-dim mode. The four sales choices are Warm dim, Tunable white, Natural white and RGBTW. The matching Lumaris or Rania recipe includes capacity-based controllers, power supplies, whole tape reels, channels, connectors, cable and installation. Previously unpriced generic warm-dim selections are upgraded without replacing priced conventional packages.

Removed selectable instruction placeholders and duplicate keypad load-arrangement questions. Wall-appearance choices retain automatic local controls or centralized equipment. RadioRA 3 seeTouch now uses its catalog model and line-voltage installation path, including new-location power feeds. Alisse, Aviena and new-construction fixed/adjustable Rania/Ketra D2 have explicit complete-assembly selling allowances; source prices remain unchanged and unquoted purchase costs remain blank.

Untouched later rooms start with editable conditions from a preceding room of the same work type. Saved overrides remain intact. Route verification, fan support and fixture suitability are not copied. No-cut rooms require their own concealed-route confirmation. The customer scope identifies inherited assumptions and applicable equipment allowances.

The development test build displays 2026-11-16 R3. Catalog pilot 9, price exports, source inventory and cumulative archive are synchronized. Regression cases cover all tape and keypad choices, fixed/adjustable assemblies, controller boundaries, price migration, no-cut restrictions and later-room defaults. Physical browser/iPad and print acceptance remain unverified.

## 2026-11-16: Progressive room choices and independent access settings

Replaced the separate room-start wizard with clickable room-needs cards and a persistent read-only summary. Keypads now sit alongside the other room needs; selecting a design reveals local-control or keypad-only wall choices. Automatic platform selection, hybrid keypad substitution and technical overrides remain in place. Existing-light control upgrades remain available without adding fixtures.

Separated surface material, cut permission and attic access. Plaster and attic access can be combined; open framing skips finished-surface questions. Normal construction is a stated budget assumption, occupancy uses a protection checkbox, and working height remains explicit. No-cut checks ask only about required concealed routes. Access changes invalidate route evidence; existing special conditions remain held for review. Project work type applies once, with persistent room exceptions in advanced settings.

Removed the dark opening panel, duplicate step instructions and sales price-list importer. Short option lists use touch-friendly buttons, and longer menus have consistent styling. The company catalog, pricing calculations, shade allowances and customer-only reporting remain unchanged. Regression coverage includes room navigation, automatic system changes, typed card inputs, all surface/cuts/attic combinations, save/reopen and complete source packaging. Visual browser and physical iPad acceptance remain pending.

## 2026-11-16: Guided room setup and existing-light control upgrades

Room setup now asks the work type and control experience before exposing keypad design and wall appearance. Manufacturer style references are included with the application. Advanced equipment settings remain editable. Back preserves room quantities, and automatic platform upgrades are reversed when their requirements are removed while explicit preferences are retained.

Existing-light control upgrades have independent dimmed and on/off group counts. Estimates include removal and replacement of wall controls, companion devices, circuit assessment and applicable programming. Local replacements retain existing fixtures and wiring. Relocation and centralized load arrangements add the applicable boxes, cabling and shared equipment. Hybrid keypads replace one compatible separate dimmer without duplicate device or installation charges.

Unconfirmed occupancy carries occupied-room protection labor and is identified as an allowance in the scope. Vacant and clear remains an explicit override. Blocked concealed routes, incompatible fixture conditions and incomplete custom selections retain their existing review requirements.

Catalog pilot 8 adds the preliminary control-removal standard and preserves supplied equipment prices and shade bands. The bundled price exports are synchronized with the current catalog. Calculation, workflow, save/import, shared-server and source-package checks cover the update. Live company deployment and physical iPad acceptance remain pending.

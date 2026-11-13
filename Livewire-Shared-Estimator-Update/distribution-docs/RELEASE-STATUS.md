# Release status

November 13, 2026. Candidate source, not approved for unrestricted customer use.

## Standalone estimator

The standalone version does not depend on hosting or employee sign-in. It embeds the company price release, retains editable job files with notes and photos, and generates a separate customer document. The editable project and application remain internal company files.

The current regression suite verifies 23 complete lighting scenarios using the shipped catalog. These cover fixed and adjustable DMF fixtures in new construction, remodel and retrofit work; conventional, RadioRA 3 and HomeWorks controls; Lumaris tunable-white and RGB/tunable-white tape; and a wired HomeWorks layout. Project conditions and design checks are explicitly supplied in these scenarios. A passing scenario does not approve an actual site or its RF layout.

New HomeWorks projects select a planning architecture from the equipment: wired QSX for QS devices, otherwise a dual-radio wireless processor. Capacity and coverage review still apply. Existing saved projects retain explicit architecture selections and unresolved legacy status.

Labor is populated at $112.50 per person-hour using task estimates, condition factors, routing, removal, commissioning, setup and crew travel. Field productivity calibration is ongoing maintenance, not a requirement to supply a representative completed job before using estimated hours. Estimated hours are not a guarantee for concealed conditions.

## Completed additions

The sales interface uses a read-only room summary, detail editing, explicit condition shortcuts and selected-room reuse. No-cut continuation checks are limited to wiring required by the entered scope. The standalone budget screen shows narrative scope and direct fixes; ordinary design reminders do not suppress a complete planning range. Shared approval remains enforced. Advanced access remains available. Room copying works in standalone mode and clears site-specific proof. Technical checks are grouped into an estimating handoff. [Field workflow review](FIELD-WORKFLOW-REVIEW.md) records the changes and adversarial checks.

Source packaging uses a checked file inventory. A missing application, pricing, server or documentation folder fails verification. The private GitHub contents still require comparison with a downloaded repository archive; a screenshot is not a file-content verification.

Fan scope now distinguishes retention, replacement and a new location. The takeoff includes installation/removal, support verification or replacement, new wiring where selected, access factors and testing. Owner-supplied fan equipment remains excluded from material supply. Incompatible speed controls, unknown support and specialty mounting retain explicit holds.

All 36 historical shade low/high bands remain unchanged. Catalog release `2026-11-13-livewire-pilot-5` uses the upper size-band amount as the assembly budget, with a matching job quote taking precedence. Installation, required infrastructure, material surcharge and shipping remain separate calculated items. Customer documents identify historical allowances.

The glass Palladiom rectangular 1-gang three-button raise/lower package carries $510 list/selling price, including its faceplate. Dealer cost remains unset. The matte $377.50 package is not the selected estimating basis.

Review actions link directly to room conditions, room scope or pricing. Changed answers remain populated and can return directly to the budget. Input targets, labels and focus states are larger. Customer documents use flowing room sections rather than an oversized table row for each room.

Rania high-output tape is included with a HomeWorks controller, 96 W power interface, four-conductor cable, wire-to-tape connectors and extrusion. The recipe uses the supplied supplier catalog and Lutron specification 3663290. Dedicated power per controller is a conservative budgeting assumption. See [Rania tape basis](RANIA-TAPE-BASIS.md). The new regression cases exercise single/dual feeds, controller boundaries, separate groups and price-source matches.

## Remaining limits

The private supplier reference now retains all 10,086 rows from the supplied workbook. `pricing/assembly-audit.json` records exact D2R module, mount and supply matches. For the selected round flanged white bevel assembly, trim `UN-D2RDFBWHXX` is absent from the supplied workbook. Known component subtotals are not complete fixture prices. Configured D2 new-construction housings, Alisse faceplate/button packages and Aviena installation keypads also need complete configured prices; samples and demonstration kits are not substitutes.

Unmapped conventional warm-dim tape/driver packages and selected shade accessories require a verified package price. Specialty construction remains subject to a separately reviewed method and price. Generic scope approval cannot make unknown routes viable.

Automated arithmetic, data separation, save/reopen, fan/shade transitions, access and estate-scale scenarios pass. Actual browser visual and print testing remains unverified because this environment rejected opening the local application in its browser. No test result establishes measured field productivity or guarantees hidden conditions.

Usability references applied:
- https://design-system.service.gov.uk/patterns/check-answers/
- https://design-system.service.gov.uk/patterns/question-pages/

## Shared deployment

The implementation includes a Node.js server, Google account verification, employee roles, a private SQLite project store and catalog releases. Automated server checks use test authentication. Live Google sign-in, HTTPS, persistent storage, backups and restore have not been verified on company hosting.

The company website administrator should confirm whether existing hosting can operate a private Node.js 22.16+ application with persistent storage behind HTTPS at an approved staging address. Google Workspace administration must establish the company-owned OAuth application and approved employee identities. A WordPress/Elementor installation alone does not establish these capabilities. This is a separate deployment task and does not block the standalone release. Public website changes require approval.

## Source handoff

The cumulative source archive contains repository-root files and the full current price catalog. Extract it before uploading repository files. Uploading the ZIP alone does not update the source files inside GitHub. Existing filenames receive new versions through a commit; Git retains earlier committed versions. Local development commits have not been pushed to the private company repository.

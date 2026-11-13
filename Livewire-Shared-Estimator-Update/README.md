# Livewire Lighting and Shading Estimator

The estimator develops room-by-room budgets for lighting, controls and motorized shades. The standalone application saves editable project files. The shared application implements Livewire Google sign-in and shared project storage; company deployment and live sign-in verification remain pending. Pricing administrators review the takeoff and approve customer PDFs.

## Sales workflow

1. Start with the project, travel distance and customer control experience. Schedule and network options are under Details.
2. Add rooms. Use Room overview for quantities and Copy for repeated layouts. Use Details for mixed fixtures, separate controls, window sizes and exceptions.
3. Choose visible room conditions, ordinary or special working space, and occupancy. Reuse these answers only in selected rooms with matching conditions. Detailed access remains available for attics, mixed routes, high work and checked fishing.
4. Save the project with notes and photos. The Budget screen separates room questions from the estimating handoff. Customer budget PDF contains the approved range, credited design retainer, scope and exclusions. The editable project and application remain internal company files.

## Source package integrity

The repository must contain these folders at its root. Test files alone cannot run the application.

| Folder | Contents |
| --- | --- |
| `dist/` | Application, calculation engine, styles and customer document generator |
| `pricing/` | Company catalog, supplier reference and assembly audit |
| `server/` | Shared projects, account verification and role controls |
| `distribution-docs/` | Scope, labor, shading, deployment and release documentation |
| `.github/workflows/` | Automated source verification, tests and build |

For browser uploads, extract the source ZIP and drag all files and folders from inside the extracted directory onto GitHub’s Upload files page. Preserve the root layout shown above; do not add an enclosing package folder. Confirm nested paths such as `dist/app.js`, `pricing/catalog.json` and `server/index.js` appear in the pending upload.

`npm run verify` compares the source with `source-manifest.json` and identifies missing or mixed-version files. The build verifies the inventory before generating the standalone file and copies every recorded source file. After intentional source edits, regenerate the inventory with `npm run manifest`, review it and commit it with the changes. Do not regenerate an inventory merely to make an incomplete upload pass.

The GitHub **Verify estimator source** workflow performs the same checks when the complete workflow folder is present and Actions is enabled. [Field workflow review](distribution-docs/FIELD-WORKFLOW-REVIEW.md) documents the current audit, fixes and outstanding verification.

## Pricing and approvals

[`pricing/catalog.json`](pricing/catalog.json) is the versioned company catalog in this private repository. It contains supplier prices, verified equipment mappings, estimated task hours and company allowances. The standalone build embeds this catalog. A shared deployment registers the repository version when it starts. Employees can view company pricing. Pricing administrators and owners can publish a new version and approve or reprice a saved project. A catalog version identifies an immutable price list. Change its version when changing rates, equipment or assumptions. Saved projects retain their assigned release until repriced.

Labor is estimated by task at $112.50 per person-hour. The takeoff includes applicable rough-in, trim, equipment installation, circuit and control wiring, setup, programming, commissioning and handoff. Each new cable run has an installation method. Open framing, accessible attic/cavity work, documented fishing, selective openings and continuous access removal use distinct allowances. Cable preparation, pulling, device installation and access removal are separate tasks. Blocked or unknown routes hold the customer budget until the method is resolved. The customer scope describes included removal and excludes drywall and plaster repair and painting. Long routes require reviewed lengths or a documented multiplier. Labor standards and medium-run lengths are estimating allowances.

The pricing release applies a 6% materials surcharge and tiered shipping and handling to the material selling amount. The glass Palladiom keypad uses the supplied $510 complete-package list price as its selling basis; dealer cost is not inferred. The budget is 10% below to 15% above the complete planning amount. The design retainer is 4% of the displayed low end and is credited toward the job if the customer proceeds.

Review system capacity, fixture and load compatibility, routing and job conditions before approval. Confirm the physical processor, repeater, gateway and panel layout for larger systems. Configured shades use the company’s upper historical size-band allowance unless a job-specific quote overrides it. Customer scopes identify historical allowances; final fabrication and selected options must be checked before ordering. Existing-system changes, specialty products and unsupported configurations require an estimator takeoff. Unresolved scope produces a scope summary while pricing is pending. Review the approved scope and exclusions when comparing the final proposal with the budget. Reprice added work or changed conditions separately.

## Local build and shared deployment

Use Node.js 22.16 or newer. From the repository root, run `npm run verify`, `npm ci`, `npm test` and `npm run build`. The build produces `distribution/Livewire-Lighting-Budget.html` for estimating and `distribution/Livewire-Internal-Setup.html` for catalog and job review. Both are internal company files. Use **Save project** to retain an editable estimate and **Start next job** to clear the working scope.

The shared application runs as a separate Node.js process on `127.0.0.1` behind an HTTPS reverse proxy, with persistent private SQLite storage and backups. The runtime serves application assets from a defined allowlist. Keep the checkout, SQLite database, backups and environment configuration outside the web document root.

Deployment configuration is documented in [`.env.example`](.env.example). Use the approved estimator origin and a Livewire-owned Google Workspace OAuth web client. Register `<LIVEWIRE_ORIGIN>/auth/google/callback` with `openid email` scopes. `LIVEWIRE_MEMBERS` maps approved work accounts to `sales`, `pricing` or `owner`. Start the service with `npm start`. Verify Google sign-in, role permissions, shared saves, catalog release, PDF output and backup restoration on staging before rollout.

## Installation verification

[Release status](distribution-docs/RELEASE-STATUS.md) separates the standalone release from company hosting and identifies outstanding scope and pricing work.

The Budget screen shows generated room scope and an expandable task-hours breakdown. Customer PDFs include the room methods and shared installation work while omitting supplier costs, internal task hours and private notes. An approval checkbox cannot override unresolved access. A retrofit fixture replacement can reuse verified existing wiring without requiring a new route. Adding new cable introduces the route checks even in a retrofit room.

The automated suite includes 480 ceiling/wall access and permission combinations, fixture replacement versus relocation, shade-only wiring, shared routes, independent labor arithmetic and estate-scale systems. These tests validate software behavior. The task standards and removal quantities remain estimating assumptions and require field calibration. Full company-browser visual/print validation and hosted Google sign-in remain release checks.

Drawing references and revisions are retained with room facts and derived route records. Plan reading is not implemented. [Plan import design](distribution-docs/PLAN-IMPORT.md) defines how future measured takeoffs can enter the estimator without bypassing field-access checks.

## Estimating references

- [Modeled scope and dependencies](distribution-docs/SCOPE-MATRIX.txt)
- [Labor assumptions](distribution-docs/LABOR-ASSUMPTIONS.txt)
- [Shading assumptions](distribution-docs/SHADING-ASSUMPTIONS.txt)
- [Standalone operation](distribution-docs/SETUP.txt)

## Changelog

- Added Change this choice and Undo last choice for room access selections. Budget warnings now open quick conditions first, and detailed mode resets during room and step navigation.

- Added a room quantity overview, explicit condition shortcuts and selected-room reuse, standalone room copying, customer-goal control choices and grouped estimating checks. Hardened invalid inputs and duplicate room imports. Added complete-source inventory verification and GitHub checks to detect missing folders and mixed releases.

- Added owner-supplied fan installation, replacement and support/wiring allowances; preserved all 36 historical shade bands and enabled upper-band budgets; selected the $510 glass Palladiom package including its faceplate. Added direct review actions, larger form controls and flowing room sections in customer documents.
- Preserved all 10,086 supplied Lutron workbook rows in the private pricing source and documented component-level D2R matches and unresolved configured assemblies.

- Added automatic HomeWorks planning for new projects and 23 regression scenarios using the shipped company catalog without substitute equipment prices. Existing unresolved architecture selections and site-review requirements remain intact.

- Added workbook pricing for HomeWorks Sunnata standard and hybrid keypads and the QSX processor enclosure in catalog release `2026-11-13-livewire-pilot-3`. Wallplates and processor power supplies remain separate takeoff items.

- Separated project downloads from clearing the working draft, isolated new-job settings, required fresh access checks for copied rooms, rejected invalid pricing inputs, and removed an outdated priced example.

- Added route-based installation planning, access feasibility holds, separate cable preparation and removal labor, working-condition inputs, generated customer scope and drawing provenance. Updated the company catalog and preserved approval checks for saved projects.

- Versioned the company catalog with the application, added long-route estimating inputs, and expanded regression coverage for estate-scale layouts and access labor. Customer PDFs continue to omit supplier pricing.
- Added tiered shipping and handling, the material surcharge, the budget range and a separate creditable design retainer. Expanded Lumaris, wiring and retrofit takeoffs.
- Added room photos, estimator handoff notes, shared project search and a Start next job action.

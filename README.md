# Livewire Lighting and Shading Estimator

The estimator develops room-by-room budgets for lighting, controls and motorized shades. Employees use Livewire Google accounts to save shared projects. Pricing administrators review the takeoff and approve customer PDFs.

## Sales workflow

1. Start a project and select the installation type, travel band and control system. Use **Help me choose** to capture scope while system selection is open.
2. Add rooms and enter the fixtures, controls, undercabinet lighting and shades. Under **Conditions**, record wiring access, surface type, unusual routes and permitted openings. Add photos and handoff notes where useful.
3. Save the project. Pricing review resolves the outstanding items on the Budget screen. Use **Customer budget PDF** to print or save the approved range and design retainer. The PDF includes customer scope and exclusions. The editable estimate and company catalog are internal files.

## Pricing and approvals

[`pricing/catalog.json`](pricing/catalog.json) is the versioned company catalog in this private repository. It contains supplier prices, verified equipment mappings, estimated task hours and company allowances. The standalone build embeds this catalog. A shared deployment registers the repository version when it starts. Employees can view company pricing. Pricing administrators and owners can publish a new version and approve or reprice a saved project. A catalog version identifies an immutable price list. Change its version when changing rates, equipment or assumptions. Saved projects retain their assigned release until repriced.

Labor is estimated by task at $112.50 per person-hour. The takeoff includes applicable rough-in, trim, equipment installation, circuit and control wiring, setup, programming, commissioning and handoff. Access conditions apply to the affected work. The budget carries removal for selected access openings and excludes drywall and plaster repair and painting. Long routes require reviewed lengths or a documented multiplier. Labor standards and medium-run lengths are estimating allowances.

The pricing release applies a 6% materials surcharge and tiered shipping and handling to the material selling amount. The budget is 10% below to 15% above the complete planning amount. The design retainer is 4% of the displayed low end and is credited toward the job if the customer proceeds.

Review system capacity, fixture and load compatibility, routing and job conditions before approval. Confirm the physical processor, repeater, gateway and panel layout for larger systems. Configured shades require current fabrication pricing. Existing-system changes, specialty products and unsupported configurations require an estimator takeoff. Unresolved scope produces a scope summary while pricing is pending. Review the approved scope and exclusions when comparing the final proposal with the budget. Reprice added work or changed conditions separately.

## Local build and shared deployment

Use Node.js 22.16 or newer. From the repository root, run `npm ci`, `npm test` and `npm run build`. The build produces `distribution/Livewire-Lighting-Budget.html` for estimating and `distribution/Livewire-Internal-Setup.html` for catalog and job review. Both are internal company files. Use **Save project** to retain an editable estimate and **Start next job** to clear the working scope.

The shared application runs as a separate Node.js process on `127.0.0.1` behind an HTTPS reverse proxy, with persistent private SQLite storage and backups. The runtime serves application assets from a defined allowlist. Keep the checkout, SQLite database, backups and environment configuration outside the web document root.

Deployment configuration is documented in [`.env.example`](.env.example). Use the approved estimator origin and a Livewire-owned Google Workspace OAuth web client. Register `<LIVEWIRE_ORIGIN>/auth/google/callback` with `openid email` scopes. `LIVEWIRE_MEMBERS` maps approved work accounts to `sales`, `pricing` or `owner`. Start the service with `npm start`. Verify Google sign-in, role permissions, shared saves, catalog release, PDF output and backup restoration on staging before rollout.

## Estimating references

- [Modeled scope and dependencies](distribution-docs/SCOPE-MATRIX.txt)
- [Labor assumptions](distribution-docs/LABOR-ASSUMPTIONS.txt)
- [Shading assumptions](distribution-docs/SHADING-ASSUMPTIONS.txt)
- [Standalone operation](distribution-docs/SETUP.txt)

## Changelog

- Versioned the company catalog with the application, added long-route estimating inputs, and expanded regression coverage for estate-scale layouts and access labor. Customer PDFs continue to omit supplier pricing.
- Added tiered shipping and handling, the material surcharge, the budget range and a separate creditable design retainer. Expanded Lumaris, wiring and retrofit takeoffs.
- Added room photos, estimator handoff notes, shared project search and a Start next job action.

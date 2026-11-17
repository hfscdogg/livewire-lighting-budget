# Livewire Lighting and Shading Estimator

An internal sales tool for developing room-by-room budgets for lighting, Lutron controls and motorized shades. The guided workflow turns customer preferences and installation conditions into an equipment takeoff, task-based labor, a budget range and a scope of work.

Release: **R9, November 17, 2026**. The standalone application is available for company review. Shared operation supports the company Vercel environment and requires deployment configuration and acceptance testing.

## Sales workflow

1. Create a project and add the rooms involved.
2. Select the work in each room: recessed lighting, undercabinet lighting, owner-supplied fixtures or fans, existing-light controls, keypads and shades.
3. Record the finished surface, permission for access cuts, attic access, working height and occupancy. Common installation settings are inferred and remain editable.
4. Review the budget range and room-by-room scope. Save the project or generate a customer budget PDF and a separate estimator handoff PDF.

Lighting choices determine the compatible control platform and shared equipment. Conventional lighting can use local dimmers and hybrid keypads. Central lighting panels are included when the selected wall-control arrangement requires them. Intelligent lighting, shades and controls share compatible processors and infrastructure.

Required questions appear in the relevant workflow step. Unchecked D2/D2R ceiling suitability becomes an estimator follow-up before ordering. Recorded incompatibility, blocked wiring routes and unsupported scope still require resolution. Access and product assumptions remain visible in the handoff.

## Budget policy

| Item | Calculation |
| --- | --- |
| Labor | $112.50 per person-hour |
| Labor increments | Each completed task rounds up to 0.25 hour after quantity and condition adjustments |
| Programming | One startup hour, then device-specific programming, activation and response testing |
| Large-system programming | Progressive device-count allowances, independent of installation access |
| Travel | One two-person crew; applicable company daily travel band |
| Materials | Company catalog pricing, 6% materials surcharge and tiered shipping and handling |
| Customer range | 10% below to 15% above the complete planning amount |
| Design retainer | 4% of the displayed low end, credited toward the project; not added to the budget |

Cable quantities, load controls, processor capacity, power supplies and installation work follow the selected scope. Access adjustments apply only to affected tasks. Unit rates retain precision so per-foot and per-device calculations are not inflated before task rounding. Drywall/plaster repair and painting are excluded.

The versioned company catalog is [pricing/catalog.json](pricing/catalog.json). Product records identify exact supplier prices, comparable assembly allowances and historical shade budgets. Shade amounts remain budget allowances pending final measurement and fabrication pricing. Task times are estimating standards, not a guarantee against concealed conditions or changes in scope. Final installation design and ordering review remain required.

## Project files and reports

**Save project** retains an editable job, including room notes and photos. **Open project** resumes it. **Start next job** provides a save opportunity before clearing the draft. Browser storage is temporary; keep exported jobs in the company project location.

The customer PDF contains the budget, credited retainer, scope and exclusions. The estimator handoff adds room selections, access assumptions, ordering notes, material quantities, labor, private notes and photos. Customer documents omit supplier costs and internal information. The application and editable project files are for internal company use.

## Delivery options

| Mode | Use |
| --- | --- |
| Standalone HTML | Runs locally, saves editable project files and produces both reports; no employee sign-in or shared database |
| Shared application | Google work-account sign-in, shared projects and central pricing through a company Vercel deployment with PostgreSQL |

GitHub stores source and pricing; Vercel runs the shared application. A public repository is not required. The repository and standalone application contain internal pricing and should remain restricted to authorized staff. GitHub Pages does not run the shared application's server and database. The public Livewire website is separate from this application.

Shared projects retain their assigned catalog release until repriced. Sales users can view company pricing; pricing administrators and owners maintain releases and approve customer budgets. Shared deployment requires approved company storage, Google identity configuration and backup arrangements. See [Vercel deployment](distribution-docs/VERCEL-DEPLOYMENT.md).

## Repository installation and verification

The source archive contains repository files directly at its root. Extract it, then upload all enclosed files and folders to the repository root, preserving `dist/`, `pricing/`, `server/`, `api/`, `distribution-docs/` and `.github/`. Upload the extracted contents, not the ZIP itself or an enclosing folder.

With Node.js 22.x, version 22.16 or later:

```sh
npm run verify
npm ci
npm test
npm run build
npm run test:bundle
```

The standalone output is `distribution/Livewire-Lighting-Budget.html`. The company configuration view is `distribution/Livewire-Internal-Setup.html`. For Vercel, use `npm run build:vercel`, the Other framework preset and `public` as the output directory; the deployment guide specifies environment settings.

The source inventory detects missing folders and mixed versions. After intentional source edits, regenerate it with `npm run manifest`. The GitHub verification workflow checks source integrity, tests and builds. Automated checks cover calculation, access, complete assemblies, controls-only work, large systems, saved projects, reports and shared authorization. Physical iPad/browser printing and live company sign-in, storage and backups remain deployment acceptance checks.

## Reference documentation

- [Release status](distribution-docs/RELEASE-STATUS.md)
- [Release history](CHANGELOG.md)
- [Standalone operation](distribution-docs/SETUP.txt)
- [Labor basis and task register](distribution-docs/LABOR-REVIEW.md)
- [Scope coverage](distribution-docs/SCOPE-MATRIX.txt)
- [Shading allowances](distribution-docs/SHADING-ASSUMPTIONS.txt)
- [Sales inference policy](distribution-docs/PROJECT-REVIEW.md)
- [Future drawing import](distribution-docs/PLAN-IMPORT.md)

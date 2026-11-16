# Field workflow and source integrity review

November 13, 2026. Source release `2026-11-13-required-workflow-1`.

## Sales workflow changes

The room overview summarizes each detailed fixture group, cabinet lighting selection, decorative fixture scope, fan selection and shade group. It contains no editable quantities. Edit details opens the corresponding scope category. Installation date appears with the project name and travel choice. An operational property network is assumed; control equipment connection work is still calculated.

Intelligent-lighting and supported wired-keypad choices automatically select the necessary platform. Ketra and Rania select HomeWorks. The scope explains this choice, and shared equipment remains calculated once for the project. Removing intelligent lighting does not silently downgrade an already selected HomeWorks project. Existing-system additions retain their compatibility hold and are not represented as verified retrofits.

New rooms entered through the sales interface use Lumaris tunable-white as the undercabinet preference. Existing jobs retain their selected product family. Selecting a product does not resolve a missing configured price or approve an unsupported installation.

Quick room conditions combine explicit facts into four selectable starting points: open framing, drywall with selective access openings, plaster with selective access openings, and finished drywall without extra access cuts. An ordinary-room choice records up-to-10-foot working height, ordinary framing and normal working space. Occupancy is a separate choice. None is preselected as a confirmed site fact. Attic access, mixed wall/ceiling routes, high work, fishing evidence and unusual construction use the detailed form.

Condition reuse requires selecting the destination rooms and confirming the facts also apply there. It replaces the selected condition fields only. Fishing verification, route evidence, fan-support verification, approvals, photos, notes and quantities do not transfer through condition reuse. Room duplication copies scope quantities with fresh identifiers and clears site-specific observations, notes and photos.

The standalone budget page leads with the range and credited retainer, followed by narrative installation scope. Only actionable missing information appears in fix cards. General design and commissioning checks are retained as planning reminders; they no longer imply that every sales budget requires design approval first. Physical restrictions, incomplete costs, unsupported assemblies and actual capacity limits still hold the range. Shared-server approval is unchanged. Customer output excludes supplier costs and internal notes.

With no extra access cuts allowed, Continue and the Budget navigation check the actual new room routes. Only required ceiling/wall routes are shown, and concealed fishing requires both confirmation and a reference. Existing-location replacement without new concealed cable does not trigger unrelated route questions. Back, Change this choice and Undo remain available.

## Required information and inference

Sales provides observed project facts and customer selections. The application derives quantities, compatible systems, equipment counts and installation allowances whenever those facts are sufficient. Derived estimating terms are not additional sales questions.

Connecting wiring now inherits the room access basis. Open framing uses open-route labor; accessible ceilings/chases use accessible-route labor; permitted cuts include the relevant opening work; documented no-cut fishing carries an inferred fishing allowance. Unknown or blocked room access stays unresolved on the Conditions step. The calculation does not write inferred access back as a surveyed project fact. Customer scope names the medium-run connection allowance and its basis. Explicit estimator overrides remain authoritative; a saved unresolved override can be deliberately replaced with the room-based allowance.

The workflow checks each step before forward continuation. The same calculation identifies missing information on Project, Lighting or Conditions before allowing the Budget page. Numeric input changes refresh requirements without replacing the active input. Back, room editing and project saving remain available. Required multiple-group tape lengths are expanded in the lighting form.

Missing configured prices appear when the equipment is selected. Ketra/Rania D2R remodel assemblies now carry a documented trim allowance alongside exact supplied module, mount and power prices. Their physical ceiling suitability is answered on Conditions. A price allowance does not approve insulation clearance or a fire-rated ceiling.

## Defects corrected

Access warnings now return to the quick condition choices rather than forcing the detailed form. Detailed mode resets during navigation. Change this choice returns to the choice cards; Undo last choice restores the preceding access fields while preserving quantities and unrelated answers. Undo is available for the last choice in the current session and is hidden after those fields are edited independently.

The budget footer previously excluded fan installation after fan installation had been added to the calculation. It now distinguishes owner-supplied equipment from selected installation work.

Negative numeric entries in the standalone interface were previously normalized to zero before calculation. They are now retained as invalid input and hold the budget. Invalid prices, rates and task hours also hold output rather than becoming free work. Duplicate room identifiers in imported files are rejected instead of silently discarding a room.

The standalone interface now supports Copy room. The build copies its complete recorded source inventory rather than maintaining a separate list of files to include.

## Repository verification

`source-manifest.json` records each source file and its SHA-256 digest. `npm run verify` identifies missing folders/files and files from a different release. The standalone build runs this verification and verifies its copied source again.

The GitHub workflow `.github/workflows/verify.yml` runs source verification, dependency installation, tests and the build. The workflow requires the entire `.github` folder to be present and repository Actions to be enabled. It has not been executed in the company repository by this review.

A root-files-only upload, matching the visible structure in the supplied screenshot, is reproduced by `repository.test.js`. Verification fails for the missing application, pricing, server and documentation files. The locally packaged source passes. The current private GitHub checkout has not been downloaded or compared; its contents remain unverified.

## Validation and limits

The regression suite covers access/permission combinations, device and shared-equipment counts, fan installation, historical shade bands, company pricing, customer data separation, project persistence and shared-server behavior. The new workflow tests exercise presets against the equivalent manually entered facts, no-cut holds, room/condition reuse, invalid quantities and pricing, system recommendations and duplicate identifiers.

The deterministic mixed-scope stress run includes 180 projects with 1–16 rooms and varied controls, lighting, fans and access. With supplied review facts, 39 cases produce complete ranges and 141 remain held. Published ranges are finite and the design retainer equals 4% of the displayed low amount. These are software checks, not actual installation results or a guarantee of field costs.

Interaction tests use simulated application events and inspect generated markup. Real iPad Safari, keyboard behavior, camera uploads and PDF pagination have not been visually verified. The interface uses responsive grids, large touch controls and 16-pixel form inputs, but device acceptance remains outstanding. Local HTML is a standalone delivery; shared iPad use will require the later company-hosting deployment.

Rania tape budgeting now uses the complete high-output recipe in the company supplier reference; the four D2R remodel assemblies now include a documented decorative-trim allowance. Other configured assembly limits are identified in Release status. Comparable allowances are distinct from exact supplier prices, and unknown access is never converted into a verified route.

## Design references

- GOV.UK question pages: https://design-system.service.gov.uk/patterns/question-pages/
- Nielsen Norman Group, progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Apple interface design tips: https://developer.apple.com/design/tips/
- GitHub file/folder upload guidance: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

## Project review update

The current review covers project entry, room detail, access, pricing, calculation, saved drafts, customer scope and source packaging. [Decision policy](PROJECT-REVIEW.md) records which inputs remain client choices, which decisions are inferred and which conditions need an estimating handoff.

Additional regression cases cover four complete D2R remodel combinations, conservative fan-support replacement, price supplements without overwriting custom prices, repeated products in multiple rooms, shade-access routing and mixed estates of 1, 4, 16 and 32 rooms. The 32-room case includes 256 Ketra fixtures, 384 feet of Rania tape, 64 shades, 32 replacement fans and 64 new decorative locations. These are arithmetic, scope and workflow checks, not a site-specific installation design or measured production validation.

# Field workflow and source integrity review

November 13, 2026. Source release `2026-11-13-field-workflow-2`.

## Sales workflow changes

The room overview accepts recessed quantities and experience, undercabinet footage, decorative fixture locations and fan work together. Matching window groups remain a separate shade form. Mixed recessed groups, cabinet gaps, multiple control locations and special mounting remain available under Details.

Project control choices describe customer outcomes before platform names. A selected intelligent-lighting or wired-keypad package can recommend its required platform. Applying the recommendation is explicit and restricted to a new-system plan; existing systems are not silently replaced. Quantities continue to determine shared headend equipment through the existing calculation engine.

New rooms entered through the sales interface use Lumaris tunable-white as the undercabinet preference. Existing jobs retain their selected product family. Selecting a product does not resolve a missing configured price or approve an unsupported installation.

Quick room conditions combine explicit facts into four selectable starting points: open framing, drywall with selective access openings, plaster with selective access openings, and finished drywall without extra access cuts. An ordinary-room choice records up-to-10-foot working height, ordinary framing and normal working space. Occupancy is a separate choice. None is preselected as a confirmed site fact. Attic access, mixed wall/ceiling routes, high work, fishing evidence and unusual construction use the detailed form.

Condition reuse requires selecting the destination rooms and confirming the facts also apply there. It replaces the selected condition fields only. Fishing verification, route evidence, fan-support verification, approvals, photos, notes and quantities do not transfer through condition reuse. Room duplication copies scope quantities with fresh identifiers and clears site-specific observations, notes and photos.

Budget checks are grouped by room. Product pricing and technical approval appear in a separate estimating handoff. The detailed takeoff remains available, and customer output still excludes supplier costs and internal notes. Grouping or collapsing a check does not clear it.

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

Configured assembly pricing gaps identified in Release status remain open. The simplified flow does not invent those prices or convert unknown access into a verified route.

## Design references

- GOV.UK question pages: https://design-system.service.gov.uk/patterns/question-pages/
- Nielsen Norman Group, progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Apple interface design tips: https://developer.apple.com/design/tips/
- GitHub file/folder upload guidance: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

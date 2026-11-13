# Drawing takeoff integration

The current estimator accepts manual room scope and route allowances. It does not read uploaded plans or infer concealed construction.

## Current data boundary

Rooms retain stable identifiers, `planReference` and `planRevision`. Derived cable routes expose a stable identifier, room identifier, cable task and material identifier, run count, footage, route segments and method, access status, removal allowances and source metadata. Source kind is currently `allowance`, even when a drawing reference is recorded. A drawing reference alone does not establish a measured length or a verified route.

Installation facts live separately from prices and the generated takeoff. Catalog updates preserve the facts and clear pricing approval. Changed project scope invalidates shared approval. Customer reporting uses an allowlist and does not include internal drawing or route-verification notes.

## Future import contract

A plan import should first create proposed observations, not overwrite approved room scope. Each observation needs a document identifier and revision, sheet/page, source location, scale and units, quantity or length, mapped room/load identifier, extraction method and review status. Preserve source evidence and manual overrides. Deduplicate repeated symbols and revisions by source identifiers before accepting quantities.

Reviewed geometry should replace the matching route or quantity allowance, not add another copy. Preserve one calculation engine for manual and plan-derived inputs. Retain quantity, route-method, price-list and approval versions so an estimate can be reproduced. New drawing revisions require an explicit difference review and invalidate affected approvals.

Plans can establish drawn fixture locations, schedules and route geometry when the scale and legend are verified. They cannot establish current fishing access, hidden blocking, finished-surface permission, existing wiring condition or actual RF coverage. Those facts remain site inputs. Missing scale, conflicting counts and unverified mappings must hold affected customer prices.

## Acceptance checks for a future importer

Test repeated sheets, drawing revisions, mixed scales, unscaled PDFs, multi-level rooms, shared lighting groups, duplicated symbols, incomplete legends, manual overrides and conflicting field evidence. Compare accepted quantities with an independent takeoff. Preserve the source document and review history with the shared project. Customer PDFs must continue to exclude supplier data and internal attachments.

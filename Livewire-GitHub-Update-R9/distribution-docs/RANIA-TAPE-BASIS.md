# Rania tape budgeting basis

Rania component basis. Current values are maintained in pricing/catalog.json.

The default is indoor Rania high-output natural-white tape on HomeWorks. Long-run tape is not substituted. Lutron specification [3663290, revision A](https://assets.lutron.com/a/documents/3663290.pdf) identifies the component combination, electrical limits and wiring tables. Prices below come from the supplied Livewire supplier workbook, retained in `pricing/lutron-supplier-prices.json`.

| Component | SKU | Supplier cost | List price | Purchased quantity basis |
| --- | --- | ---: | ---: | --- |
| HomeWorks wireless controller | HWL-MWCL-WH | $330.00 | $600.00 | Each |
| 96 W power interface | LU-PH3-B | $192.50 | $350.00 | Each |
| High-output tape | LU-T05-RANIA-IN | $292.71 | $532.20 | 5 m reel |
| Four-conductor output cable | LU-WK1-4W | $68.75 | $125.00 | 50 ft roll |
| Four-pin wire-to-tape connectors | LU-CK1-4W | $19.25 | $35.00 | Pack of 10 |

The takeoff carries whole tape reels per room, 8 ft channel sections using the existing LU-SR2-K mapping, and allocated connector/cable quantities. Selling amounts follow the company catalog pricing method; list and dealer cost are not interchanged. Two feet of co-located 18/2 power cable per controller uses the company $0.28/ft commodity cost allowance.

Each controller carries its own power interface, conservatively avoiding shared-supply assumptions. Maximum high-output tape is 16.4 ft per package. A run above 11 ft carries feeds from both ends. Separate control-group lengths determine package counts; multiple groups without those lengths remain unresolved. The power interface and controller must be co-located with a 2 ft power lead. A separately located supply requires a revised route design.

Output wiring carries up to 15 ft per feed, including the allocated gap wiring. Dual-ended output carries up to 30 ft total. These allowances fit the manufacturer's 22 AWG output table using the more restrictive 20 AWG, 2 ft power-cable row (the budgeted 18 AWG power lead is larger). Longer output leads, excessive segment/connector counts and unassigned multiple-group lengths require design review. The budget does not approve arbitrary cabinet gaps or a specific field routing.

The model budgets no more than three cabinet sections per controller without a separate distribution review. It includes wire-to-tape connectors for both ends of separated sections. Final section placement, connector distribution, voltage drop and wireless coverage must conform to the published design rules.

Installation includes the existing linear/channel tasks, controller and included-power installation, output-wire pulls, line-voltage feed work, applicable access work, commissioning and system programming. These are task-hour allowances, not measured installation durations. Rania tape does not resolve missing configured prices for Rania or Ketra downlights.

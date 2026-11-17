# Task labor review

R9, November 17, 2026. Catalog 2026-11-17-livewire-pilot-11, labor revision 10.

Labor revision 10 uses $112.50 per person-hour. Hours are combined labor, not
hours for each member of the crew. One two-person crew is used for travel;
programming and activation are performed by one technician. Unit times are
conservative estimating judgments with a modest execution allowance. They
are not manufacturer durations, licensed labor-unit data or measured Livewire
production history. Do not add another blanket productivity multiplier. Completed task hours
round up to the next 0.25 hour after quantity and condition adjustments.
Exact quarter-hours and zero remain unchanged; missing hours remain unset.
Unit rates are not rounded before multiplication. Prices, travel and report
totals use the rounded task hours.

PROGRAMMING AND ACTIVATION
One hour per project covers initial Designer/template setup, first-processor
startup and shared transfer/checks. Each addressed device separately carries
Designer entry, activation, group assignment and response testing:
  Dimmer / switch / fan control: 8 minutes.
  Intelligent light or tape controller: 10 minutes.
  Keypad: 20 minutes, including buttons and basic room scenes.
  Shade motor: 10 minutes, including system group/scene commands.
  System Pico: 6 minutes.
  Load-control module: 10 minutes, plus 6 minutes per USED output.
  Additional processor / gateway / repeater: 15 minutes.
A hybrid keypad is one keypad, not a keypad plus a programmed dimmer.
Conventional bulbs, passive companions and tape footage are not addressed
devices. Dual shade layers count their separate motors. Spare outputs do not
add programming. Basic scenes include up to four simple room scenes; custom
sequences and third-party integrations are separate scope.

The first 100 addressed devices use the base per-device time. Devices 101-250
receive 10% extra coordination time, 251-500 receive 20%, and those above 500
receive 35%. These bands are company estimating allowances, not Lutron system
capacity limits. The bands are marginal, not whole-job jumps. The weighted
factor is applied to the per-device work mix; initial startup and all other
labor remain unchanged. The first processor is counted toward complexity but
its activation is already in startup. Module output tasks share the device
factor without inflating the addressed-device count. All programming defaults
to on-site person-hours; planning remains off site. There is no additional
flat commissioning or room-scene charge in revision 10.

TASK CONDITIONS
Cable footage is divided among its modeled ceiling, wall and shared segments.
Each segment receives its own route/access/height factor; the entire run does
not receive the worst segment's factor. Segment lengths remain allowances.
Open framing: 1.00; accessible attic/cavity: 1.25; verified fishing: drywall
1.75 or plaster 2.25; selective openings: drywall 1.35 or plaster 1.60;
continuous approved removal: 1.15. Access can be limited (1.25) or difficult
(1.60). The maximum applicable factor within each segment is used, not their
product. Closed finishes do not multiply fixture mounting or programming.

Height from over 10 through 12 feet affects only ceiling work. One half of fan
and shade installation time, three quarters of decorative hanging and one
half of aiming are treated as work at height. Remaining assembly/setup time
stays unchanged. Wall devices, undercabinet work and wall openings receive no
ceiling-height multiplier. Higher/specialty access needs its own method.
Programming, planning, response checks, orientation, PoE hookup and ordinary
network connection checks have no room-access or height multiplier.

QUANTITIES AND TASK BOUNDARIES
Project tool setup / ordinary cleanup: 1.5 hours once. Additional rooms: .25
hours each. Furnished or unconfirmed rooms with disruptive installation:
.75 hours each for contents protection; controls-only rooms: .25 hours.
Vacant clear rooms omit contents protection. Additional workday setup: .75
hours per inferred return day. Protection is not a multiplier on other work.
Circuit survey: .75 hours per applicable room plus .15 per additional load
or circuit group. This is separate from disconnect/reconnect or termination.
Fixture mounting, aiming, existing-fixture removal, cable preparation/pulling,
box installation, headend mounting, PoE supply and wiring terminations each
have separate nonoverlapping tasks. No new cable is added for an existing
location replacement unless its selected installation method requires it.

Selective openings follow closed route footage, pooled by owner, surface and
route kind. A room override replaces that room's pooled count once. Short
between-fixture links use fixture cutouts for the budget; the estimator must
verify the joist route. Fishing time remains. Additional approved cuts are
priced by ceiling or wall location. Ordinary drywall fixture cutouts are in
mounting; plaster gets the careful-cutting increment. Continuous removal is
an alternative to selective cuts, not a second charge. No patching, plaster
repair, drywall repair or painting is included.
No-cut routes with a recorded obstruction or no established feasible method
still require resolution. Unchecked D2 ceiling suitability remains an estimator
note before ordering, not a standalone budget hold.

Shade installation covers brackets, mounting, leveling, local limit setting
and mechanical cycle testing. Standalone pairing is included. System shades
receive Designer activation and system-command testing in their per-device
programming task. Historical shade package wiring/power labor is credited
before additional task allowances are charged; bundled labor is not billed
twice. See SHADING-ASSUMPTIONS.txt for remaining historical price limitations.

TRAVEL, SAVED JOBS AND PRICING
On-site person-hours / 16 are rounded up for crew travel days. Open-framing
rough/trim work and shade measure/install use a minimum of two visits.
The processor connection can retain a new Ethernet allowance or use a nearby
usable wired port. A property network alone does not establish that port.
Material prices, shipping tiers, 6% material surcharge, -10%/+15% range and
4% of the low-end retainer are unchanged. The retainer is credited toward
the job, not added to it.
Imported earlier test jobs visibly migrate unchanged default labor values.
Nonstandard unit-hour overrides, equipment prices and site facts are retained.
Rounding still applies to the calculated task after any unit-rate override.
Legacy programming rows remain for old published catalogs and are not charged
by revision 10; new per-device standards govern current programming. Old shared
catalogs retain their versioned calculation until repriced. Old approvals are
invalidated by the new estimate revision. Review a recalculated saved budget.


## Two-light regression

The two-light validation scenario uses two adjustable Ketra fixtures, one Sunnata keypad, one dual-radio HomeWorks processor, tall drywall work, occupied protection, 60 feet of lighting cable and travel band 2. The test contains synthetic project data.

| Connection basis | On-site PH | Off-site PH | Total PH | Base budget | Customer range | Credited retainer |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| New 75-foot Ethernet run | 21.75 | 1.00 | 22.75 | $7,487.28 | $6,739–$8,610 | $269.56 |
| Usable wired port at processor | 17.50 | 1.00 | 18.50 | $6,864.15 | $6,178–$7,894 | $247.12 |

Both cases include one hour of startup. The two-light programming task calculates 20 minutes and rounds to 0.50 hour; the keypad task also rounds from 20 minutes to 0.50 hour. Total programming and activation is 2.00 person-hours. No legacy activation or scene task is added. Both examples exceed 16 on-site person-hours after task rounding and therefore carry two crew travel days under the company travel policy. Equipment prices are unchanged. Neither example is a performance guarantee for concealed site conditions.

## Complete task register

| ID | Task | Base PH / unit | Location | Condition adjustment | Quantity and scope boundary |
| --- | --- | --- | --- | --- | --- |
| linear_lead_run | Run low-voltage lighting leads | 0.02 / ft | On site | Own route segments only | Per selected ft; see task name and generated takeoff reason. |
| fixture_remove | Remove existing fixture / lamp / trim | 0.3 / fixture | On site | 100% of task; ceiling working access/height only | Per removed existing fixture; new mounting separate. |
| site_setup | Protect work area, setup and cleanup | 1.5 / project | On site | None | Once per active project; staging/tools and ordinary cleanup only. |
| circuit_check | Trace and assess existing lighting circuits | 0.75 / room | On site | None | First circuit/load assessment in an applicable room. |
| branch_run | Run lighting branch wiring | 0.03 / ft | On site | Own route segments only | Per selected ft; see task name and generated takeoff reason. |
| load_homerun | Run load wiring to central panel | 0.03 / ft | On site | Own route segments only | Per selected ft; see task name and generated takeoff reason. |
| retrofit_rewire | Rework existing load / switch wiring | 0.9 / zone | On site | 100% of task; wall working access/height only | Per existing centralized load; disconnect/label/reconnect, not first circuit survey. |
| constant_power | Convert intelligent-lighting feed to undimmed power | 0.4 / zone | On site | 100% of task; wall working access/height only | Per selected zone; see task name and generated takeoff reason. |
| new_circuit | Install lighting circuit / breaker allowance | 1.5 / circuit | On site | None | Per new circuit; breaker/endpoints; feeder cable separate. |
| circuit_feeder | Run circuit feeder wiring | 0.035 / ft | On site | Own route segments only | Per selected ft; see task name and generated takeoff reason. |
| panel_mount | Install centralized lighting panel | 3 / panel | On site | 100% of task; wall working access/height only | Per selected panel; see task name and generated takeoff reason. |
| module_install | Install and terminate load-control module | 1.75 / module | On site | 100% of task; wall working access/height only | Per module; load-side terminations and factory harness; source feed separate. |
| panel_feed | Install module feed circuit | 1.25 / feed | On site | None | Per module feed; source-end termination/breaker; cable separate. |
| network_run | Run control-system Ethernet cable | 0.02 / ft | On site | Own route segments only | Per selected ft; see task name and generated takeoff reason. |
| network_setup | Connect and test network interfaces | 0.5 / node | On site | None | Per network node; connect/test wired interface, not Designer programming. |
| control_power_install | Install control power supply / PoE package · legacy, not generated | 1 / supply | On site | None | Retained for previous catalogs; not generated by current programming. |
| repeater_install | Install and power Type A repeater | 0.75 / repeater | On site | 100% of task; wall working access/height only | Per selected repeater; see task name and generated takeoff reason. |
| qs_setup | Terminate and test QS control link | 1.25 / link | On site | None | Per QS link; physical polarity/continuity and power-group checks only. |
| companion_install | Install multi-location companion | 0.5 / companion | On site | 100% of task; wall working access/height only | Per selected companion; see task name and generated takeoff reason. |
| commission_device | Activate, address and test controlled endpoint · legacy catalog only | 0.2 / device | On site | None | Retained for previous catalogs; not generated by current programming. |
| owner_handoff | Train owner and complete scene / engraving handoff | 0.75 / project | On site | None | Per selected project; see task name and generated takeoff reason. |
| recess_new | Recessed · new construction | 0.9 / fixture | On site | 100% of task; ceiling working access/height only | Per complete fixture at open framing; includes rough/trim assembly. |
| recess_retrofit | Recessed · retrofit | 0.45 / fixture | On site | 100% of task; ceiling working access/height only | Per compatible insert in retained housing. |
| recess_remodel | Recessed · remodel | 1.1 / fixture | On site | 100% of task; ceiling working access/height only | Per complete new cut-in fixture; ordinary cutout/mount/termination. |
| linear | Install undercabinet lighting | 0.18 / ft | On site | 100% of task; wall working access/height only | Per selected ft; see task name and generated takeoff reason. |
| driver | Install driver / power supply | 1 / driver | On site | 100% of task; wall working access/height only | Per selected driver; see task name and generated takeoff reason. |
| control | Install switch / dimmer | 0.5 / device | On site | 100% of task; wall working access/height only | Per selected device; see task name and generated takeoff reason. |
| keypad | Install keypad | 0.5 / keypad | On site | 100% of task; wall working access/height only | Per selected keypad; see task name and generated takeoff reason. |
| keypad_line_existing | Fit and terminate line-voltage keypad | 0.5 / keypad | On site | 100% of task; wall working access/height only | Per line-voltage keypad; device termination only, no new box/cable. |
| keypad_line_new | Add line-voltage keypad location / wiring · legacy, not generated | 2.25 / keypad | On site | None | Retained for previous catalogs; not generated by current programming. |
| keypad_qs | Install wired QS keypad | 0.65 / keypad | On site | 100% of task; wall working access/height only | Per QS keypad; device-end termination; wallbox and cable separate. |
| keypad_cable | Install QS keypad control cable | 0.02 / ft | On site | Own route segments only | Per selected ft; see task name and generated takeoff reason. |
| decor_hang | Hang owner-supplied fixture | 1.5 / fixture | On site | 75% of task; ceiling working access/height only | Per selected fixture; see task name and generated takeoff reason. |
| decor_new | New decorative box / support labor (cable separate) | 1.25 / new location | On site | 100% of task; ceiling working access/height only | Per selected new location; see task name and generated takeoff reason. |
| headend | Install processor pack | 0.75 / pack | On site | 100% of task; wall working access/height only | Per processor; mounting/connections, not Ethernet route or Designer activation. |
| gateway | Install Type X gateway | 0.75 / gateway | On site | 100% of task; wall working access/height only | Per gateway; mounting only, not Designer activation. |
| program | Create RadioRA 3 database · legacy catalog only | 1 / project | Off site | None | Retained for previous catalogs; not generated by current programming. |
| design | Design / engineering | 0.75 / project | Off site | None | Per selected project; see task name and generated takeoff reason. |
| access_limited | Extra labor · limited access · legacy, not generated | 0.25 / affected location | On site | None | Retained for previous catalogs; not generated by current programming. |
| access_difficult | Extra labor · difficult access · legacy, not generated | 0.75 / affected location | On site | None | Retained for previous catalogs; not generated by current programming. |
| obstruction_drywall | Work around closed drywall · legacy, not generated | 0.5 / affected location | On site | None | Retained for previous catalogs; not generated by current programming. |
| obstruction_plaster | Work around closed plaster / lath · legacy, not generated | 1 / affected location | On site | None | Retained for previous catalogs; not generated by current programming. |
| remove_drywall | Remove approved drywall for access | 0.4 / opening | On site | 100% of task; surface working access/height only | Per selected opening; see task name and generated takeoff reason. |
| remove_plaster | Remove approved plaster for access | 0.8 / opening | On site | 100% of task; surface working access/height only | Per selected opening; see task name and generated takeoff reason. |
| fan_control | Install fan speed control | 0.5 / fan | On site | 100% of task; wall working access/height only | Per selected fan; see task name and generated takeoff reason. |
| control_remove | Disconnect and remove existing wall control | 0.15 / device | On site | 100% of task; wall working access/height only | Per removed control/companion; omitted when central rewire includes removal. |
| fan_install | Assemble, hang, connect and balance owner-supplied fan | 2 / fan | On site | 50% of task; ceiling working access/height only | Per selected fan; see task name and generated takeoff reason. |
| fan_remove | Disconnect and remove existing fan | 0.5 / fan | On site | 100% of task; ceiling working access/height only | Per selected fan; see task name and generated takeoff reason. |
| fan_support_check | Verify existing fan-rated support | 0.25 / fan | On site | 100% of task; ceiling working access/height only | Per selected fan; see task name and generated takeoff reason. |
| fan_support_install | Install fan-rated box and support brace | 1 / fan | On site | 100% of task; ceiling working access/height only | Per selected fan; see task name and generated takeoff reason. |
| route_prepare | Lay out and prepare a cable pull | 0.2 / pull | On site | None | Each independent pull; consecutive short fixture links share preparation. |
| route_fish_setup | Set up a concealed cable pull | 0.35 / pull | On site | None | Each concealed pull/group; excludes cable-foot pulling. |
| attic_setup | Access and protect attic / crawl work area | 0.5 / room | On site | None | Per selected room; see task name and generated takeoff reason. |
| open_drywall_area | Open drywall along an approved wiring route | 0.08 / sq ft | On site | 100% of task; surface working access/height only | Per selected sq ft; see task name and generated takeoff reason. |
| open_plaster_area | Open plaster / lath along an approved wiring route | 0.16 / sq ft | On site | 100% of task; surface working access/height only | Per selected sq ft; see task name and generated takeoff reason. |
| occupied_protection | Protect contents and isolate work in occupied room | 0.75 / room | On site | None | Disruptive installation in furnished/unconfirmed rooms; contents protection only. |
| fixture_aim | Aim adjustable downlight | 0.2 / fixture | On site | 50% of task; ceiling working access/height only | Per adjustable head; finish aiming separate from physical fixture mounting. |
| control_box | Install new control / keypad wallbox | 0.75 / box | On site | 100% of task; wall working access/height only | Per new control box; device mounting is separate. |
| control_drop | Run additional line-keypad power cable | 0.03 / ft | On site | Own route segments only | Per selected ft; see task name and generated takeoff reason. |
| control_enclosure | Mount separate processor / power enclosure | 1.5 / enclosure | On site | 100% of task; wall working access/height only | Per selected enclosure; see task name and generated takeoff reason. |
| commission_output | Test and trim centralized output · legacy catalog only | 0.15 / output | On site | None | Retained for previous catalogs; not generated by current programming. |
| plaster_cut | Extra careful cutting for new plaster opening | 0.35 / opening | On site | 100% of task; surface working access/height only | Per selected opening; see task name and generated takeoff reason. |
| poe_power_install | Install PoE supply at ready source | 0.25 / supply | On site | None | Per PoE supply at a ready source; no route allowance in this task. |
| qs_power_install | Install QS mains power supply at ready source | 1.25 / supply | On site | 100% of task; wall working access/height only | Per selected supply; see task name and generated takeoff reason. |
| design_ra3 | RadioRA 3 base planning | 0.75 / project | Off site | None | Per selected project; see task name and generated takeoff reason. |
| design_homeworks | HomeWorks base planning | 0.75 / project | Off site | None | Per selected project; see task name and generated takeoff reason. |
| design_room | Planning per additional active room | 0.25 / room | Off site | None | Per selected room; see task name and generated takeoff reason. |
| design_zone | Plan each additional controlled group | 0.15 / zone | Off site | None | Each controlled group after first; physical load/control planning. |
| program_homeworks | Create HomeWorks database · legacy catalog only | 1.5 / project | Off site | None | Retained for previous catalogs; not generated by current programming. |
| program_endpoint | Program each physical control endpoint · legacy catalog only | 0.1 / endpoint | Off site | None | Retained for previous catalogs; not generated by current programming. |
| program_keypad | Map and label keypad buttons · legacy catalog only | 0.3 / keypad | Off site | None | Retained for previous catalogs; not generated by current programming. |
| owner_homeworks | HomeWorks owner orientation | 0.75 / project | On site | None | Per selected project; see task name and generated takeoff reason. |
| extra_visit_setup | Additional workday / visit setup | 0.75 / day / visit | On site | None | Per additional inferred workday; calculated against 16 person-hours/day. |
| room_protection | Additional room protection and cleanup | 0.25 / room | On site | None | Each active room after the first; move tools and ordinary cleanup. |
| shade_measure | Survey, measure and verify shade order | 0.35 / opening | On site | None | Per selected opening; see task name and generated takeoff reason. |
| shade_install | Install complete shade and set / test travel limits | 2 / shade | On site | 50% of task; ceiling working access/height only | Per motor/layer; local limits and cycle test; Designer activation separate. |
| shade_remove | Remove existing window treatment | 0.35 / opening | On site | 100% of task; ceiling working access/height only | Per selected opening; see task name and generated takeoff reason. |
| shade_wire | Pull and support shade power and control cable | 0.03 / ft | On site | Own route segments only | Per selected ft; see task name and generated takeoff reason. |
| shade_power_pack | Mount, connect and label shade power package | 2 / package | On site | 100% of task; wall working access/height only | Per selected package; see task name and generated takeoff reason. |
| shade_power_check | Verify and connect reused shade power | 0.35 / shade | On site | None | Per selected shade; see task name and generated takeoff reason. |
| shade_addon | Fit shade channels / spacers / accessories | 0.5 / shade | On site | 100% of task; ceiling working access/height only | Per selected shade; see task name and generated takeoff reason. |
| shade_pico | Mount / pair shade Pico control | 0.35 / control | On site | None | Mount remote; direct standalone pairing only, system programming separate. |
| shade_group | Configure shade control group | 0.2 / group | Off site | None | Retained for previous catalogs; not generated by current programming. |
| design_endpoint | Review each control endpoint | 0.025 / endpoint | Off site | None | Per endpoint; equipment/schedule review, not Designer data entry. |
| design_panel | Plan panel schedule and power groups | 0.75 / panel | Off site | None | Per panel; schedule and power allocation. |
| design_processor | Plan additional processor / gateway coverage | 0.5 / node | Off site | None | Each network node beyond first; layout/coverage coordination. |
| program_startup | Initial Designer / system startup | 1 / project | On site | None | Once per control system; includes first processor; excludes device tasks. |
| program_control | Program, activate and test dimmer / switch / fan control | 0.133333 / device | On site | None | Per addressed device/output; Designer entry, activation and response checks; see programming scope above. |
| program_intelligent | Program, activate and test intelligent light / tape controller | 0.166667 / device | On site | None | Per addressed device/output; Designer entry, activation and response checks; see programming scope above. |
| program_keypad_device | Program, activate and test keypad and basic scenes | 0.333333 / keypad | On site | None | Per addressed device/output; Designer entry, activation and response checks; see programming scope above. |
| program_shade | Program, activate and test system shade | 0.166667 / shade motor | On site | None | Per addressed device/output; Designer entry, activation and response checks; see programming scope above. |
| program_pico | Program, activate and test system Pico | 0.1 / remote | On site | None | Per addressed device/output; Designer entry, activation and response checks; see programming scope above. |
| program_module | Program, activate and test load-control module | 0.166667 / module | On site | None | Per addressed device/output; Designer entry, activation and response checks; see programming scope above. |
| program_output | Configure and test centralized load output | 0.1 / used output | On site | None | Per addressed device/output; Designer entry, activation and response checks; see programming scope above. |
| program_node | Configure and activate additional processor / gateway / repeater | 0.25 / node | On site | None | Per addressed device/output; Designer entry, activation and response checks; see programming scope above. |
| owner_room | Demonstrate additional controlled room | 0.15 / room | On site | None | Per selected room; see task name and generated takeoff reason. |
| circuit_check_extra | Check additional lighting circuit / load group | 0.15 / group | On site | None | Each additional room circuit/load group; no duplicate first survey. |
| occupied_control_protection | Protect furnished room for wall-control work | 0.25 / room | On site | None | Furnished/unconfirmed controls-only rooms; local protection only. |

## Verification and reference basis

Regression checks cover 288 condition combinations, two-light arithmetic, wall-controls-only work, taped lighting controller counts, hybrid keypad substitution, shade motors/layers, panel outputs, device-band boundaries through 1,800 simulated addresses, larger HomeWorks configurations and old-catalog migration. Quarter-hour tests cover exact boundaries, zero/missing hours, calculated prices, travel thresholds, historical package credits and saved/report consistency. Numeric unit tests check implementation, not field productivity. Company iPad/browser acceptance and live hosting acceptance remain separate.

Lutron activation procedures establish that database entry, activation and transfer are distinct operations. They do not prescribe the hours used here: https://support.lutron.com/us/en/product/homeworks/article/system-design-setup/RA3-Device-Activation

The NECA labor-unit overview distinguishes installation conditions and included work categories. No paid NECA unit values were used: https://www.necanet.org/education/publications/neca-manual-of-labor-units-%28mlu%29

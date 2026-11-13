'use strict';
// Exercise the shipped catalog without inventing missing prices or shade quotes.
const assert = require('node:assert/strict');
const M = require('./dist/model');
const P = require('./dist/pricing');
const Report = require('./dist/customer-report');
const catalog = require('./pricing/catalog.json');
const clone = structuredClone;
function project(system, install) {
  const s = P.apply(M.initial(), catalog);
  Object.assign(s.project, { system, install, travelBand: '0', sharedPath: 'open', scopeReviewed: true });
  for (const key of Object.keys(s.config).filter(key => key.endsWith('Reviewed'))) s.config[key] = true;
  const room = M.addRoomNamed(s, 'Kitchen');
  Object.assign(room, { surfaceMaterial: 'drywall', ceilingPath: 'open', wallPath: 'open', openingPermission: 'selective', occupancy: 'vacant', ceilingHeight: 'standard', specialConditions: 'standard' });
  room.recessGroups[0].qty = 6;
  return s;
}
let complete = 0;
function ready(s, label) {
  const c = M.calculate(s), range = M.range(c, s.config);
  assert.deepEqual(c.issues, [], label);
  assert.equal(c.missingCosts, 0, label);
  assert.equal(c.missingHours, false, label);
  assert.ok(range, label);
  assert.ok(Number.isFinite(range.low) && range.low > 0 && range.high > range.low, label);
  assert.equal(range.designRetainer, Math.round(range.low * 4) / 100, label);
  const exported = Report.html(Report.build(s, c));
  assert.doesNotMatch(exported, /M4NCRS|HRST-W|person-hours|supplier cost|PRIVATE NOTE/, label);
  complete++;
  return c;
}
for (const system of ['none', 'RA3', 'HomeWorks']) {
  for (const install of ['new', 'remodel', 'retrofit']) {
    const s = project(system, install);
    ready(s, `${system} ${install} DMF fixed`);
    const adjustable = clone(s);
    adjustable.rooms[0].recessGroups[0].adjustable = true;
    ready(adjustable, `${system} ${install} DMF adjustable`);
    if (system === 'HomeWorks') assert.equal(M.calculate(s).dualProcessors, 1);
  }
}
for (const system of ['RA3', 'HomeWorks']) {
  for (const behavior of ['lumaris', 'lumaris_rgb']) {
    const s = project(system, 'remodel');
    Object.assign(s.rooms[0], { linearFt: 12, linearSections: '5, 7', linearBehavior: behavior });
    ready(s, `${system} ${behavior} undercabinet`);
  }
}
const wired = project('HomeWorks', 'new');
Object.assign(wired.rooms[0], { keypadType: 'seetouch', keypadQty: 1, loadTopology: 'centralized' });
const wiredResult = ready(wired, 'Automatic wired HomeWorks');
assert.ok(wiredResult.wiredProcessors >= 1);
assert.equal(wiredResult.dualProcessors, 0);
// Legacy wired-QS inference remains supported; legacy wireless uncertainty stays a hold.
const legacy = project('HomeWorks', 'remodel');
legacy.config.hwArchitecture = 'unconfirmed';
assert.ok(M.calculate(legacy).issues.some(issue => issue.key === 'hw_arch'));
for (const behavior of ['rania', 'ketra']) {
  const s = project('HomeWorks', 'new');
  s.rooms[0].recessGroups[0].behavior = behavior;
  assert.equal(M.range(M.calculate(s), s.config), null, `${behavior} assembly still requires pricing`);
}
const shade = project('RA3', 'remodel');
shade.rooms[0].shadeGroups.push({ ...M.Shade.group(M.uid), qty: 2, widthFt: 4, heightFt: 5 });
shade.config.shadeScopeReviewed = false;
assert.equal(M.range(M.calculate(shade), shade.config), null, 'Historical shade prices do not bypass fabrication review');
const blocked = project('RA3', 'remodel');
Object.assign(blocked.rooms[0], { ceilingPath: 'closed', wallPath: 'closed', openingPermission: 'none', ceilingFishing: 'blocked', wallFishing: 'blocked' });
assert.equal(M.range(M.calculate(blocked), blocked.config), null, 'Global review cannot bypass blocked routing');
console.log(`PASS: ${complete} complete catalog-backed lighting scenarios; automatic HomeWorks planning; pending assemblies, shade review and blocked-route safeguards.`);

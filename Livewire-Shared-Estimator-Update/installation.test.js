'use strict';
const assert = require('node:assert/strict');
const M = require('./dist/model');
const P = require('./dist/pricing');
const R = require('./dist/customer-report');
const Server = require('./server/estimate');
function job(install = 'remodel') {
  const s = P.apply(M.initial(), require('./pricing/catalog.json'));
  Object.assign(s.project, { system: 'none', travelBand: '0', scopeReviewed: true, sharedPath: 'open' });
  for (const key of Object.keys(s.config).filter(k => k.endsWith('Reviewed'))) s.config[key] = true;
  const r = M.room('Study', install);
  Object.assign(r, { surfaceMaterial: 'drywall', ceilingPath: 'open', wallPath: 'open', occupancy: 'vacant', ceilingHeight: 'standard', specialConditions: 'standard' });
  r.recessGroups[0].qty = 4;
  s.rooms = [r];
  return [s, r];
}
const hours = (c, id) => c.labor.filter(x => x.id === id).reduce((n, x) => n + (x.hours || 0), 0);
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const held = c => c.issues.some(x => x.key.startsWith('installation_'));

// Customer restriction cannot be bypassed by checking global review boxes.
{
  const [s, r] = job();
  Object.assign(r, { ceilingPath: 'closed', wallPath: 'closed', openingPermission: 'none' });
  let c = M.calculate(s);
  assert.ok(held(c)); assert.equal(M.range(c,s.config),null);
  assert.equal(R.build(s,c).range,null);
  assert.match(R.html(R.build(s,c)),/Openings or a confirmed alternative route/);
  assert.doesNotMatch(R.html(R.build(s,c)),/Design retainer \$/);
  Object.assign(r,{ceilingFishing:'blocked',wallFishing:'blocked'});
  assert.match(M.calculate(s).issues.map(x=>x.message).join(' '),/blocked/);
  r.openingPermission='selective'; c=M.calculate(s);
  assert.equal(held(c),false); assert.ok(M.range(c,s.config));
  assert.ok(hours(c,'remove_drywall')>0); assert.ok(hours(c,'route_fish_setup')>0);
  assert.match(R.html(R.build(s,c)),/Selective drywall or plaster openings are included/);
  r.openingPermission='extensive'; c=M.calculate(s);
  assert.equal(hours(c,'remove_drywall'),0); assert.ok(hours(c,'open_drywall_area')>0);
  assert.equal(hours(c,'route_fish_setup'),0);
  assert.match(R.html(R.build(s,c)),/Open drywall or plaster in strips/);
}
// Accessible attic does not resolve a blocked wall drop.
{
  const [s,r]=job();Object.assign(r,{ceilingPath:'attic',wallPath:'closed',openingPermission:'none',wallFishing:'blocked'});
  assert.ok(held(M.calculate(s)));r.wallFishing='verified';
  assert.ok(held(M.calculate(s)));r.routeEvidence='Site visit: clear switch drop checked';
  const c=M.calculate(s);assert.equal(held(c),false);assert.ok(hours(c,'attic_setup')>0);
  assert.equal(hours(c,'remove_drywall'),0);assert.ok(hours(c,'route_fish_setup')>0);
  // Worst route factor applies to the cable; device work does not get fishing uplift.
  assert.equal(c.labor.find(x=>x.id==='branch_run').factor,1.75);
  assert.equal(c.labor.find(x=>x.id==='control').factor,1);
}
// Existing replacement does not invent a cable route or demand ceiling access.
{
  const [s,r]=job('retrofit');Object.assign(r,{ceilingPath:'closed',wallPath:'closed',openingPermission:'none'});
  let c=M.calculate(s);assert.equal(c.routes.length,0);assert.equal(held(c),false);assert.ok(M.range(c,s.config));
  assert.equal(hours(c,'branch_run'),0);assert.ok(hours(c,'fixture_remove')>0);
  assert.match(R.html(R.build(s,c)),/reuse suitable existing wiring/);
  r.controlLocation='new';c=M.calculate(s);assert.ok(held(c));assert.ok(hours(c,'control_drop')>0);
}
// Room installation type never silently authorizes demolition.
for(const install of ['new','remodel','retrofit']){
  const [s,r]=job(install);r.keypadQty=1;r.keypadLocation='new';s.project.system='RA3';
  Object.assign(r,{wallPath:'closed',openingPermission:'none',wallFishing:'blocked'});
  assert.ok(held(M.calculate(s)),install);
}
// Independent labor takeoff: four remodel fixtures, one local control, 80 ft cable.
{
  const [s,r]=job();const c=M.calculate(s);
  const expected=4*1.1+.65+.75+80*.035+4*.20+2+1.5;
  close(c.knownHours,expected);close(c.laborSell,expected*112.5);
  assert.equal(c.routes.reduce((n,x)=>n+x.totalFeet,0),80);
  assert.equal(c.labor.some(x=>/repair|patch|paint/.test(x.id)),false);
  Object.assign(r,{occupancy:'occupied',ceilingHeight:'tall'});
  const occupied=M.calculate(s);assert.ok(occupied.knownHours>c.knownHours);close(hours(occupied,'occupied_protection'),.75);assert.equal(occupied.labor.find(x=>x.id==='control').factor,1);assert.equal(occupied.labor.find(x=>x.id==='recess_remodel').factor,1.25);
  for(const specialConditions of ['unknown','masonry','rated','hazard','structural']){r.specialConditions=specialConditions;assert.ok(held(M.calculate(s)));}
  r.specialConditions='standard';r.ceilingHeight='special';assert.ok(held(M.calculate(s)));
}
// New shade wiring and QS wiring get access evaluation even without any fixtures.
{
  const [s,r]=job();r.recessGroups[0].qty=0;
  r.shadeGroups=[{...M.Shade.group(M.uid),qty:2,widthFt:4,heightFt:5,power:'wired'}];
  Object.assign(r,{wallPath:'closed',openingPermission:'none',wallFishing:'blocked'});
  let c=M.calculate(s);assert.ok(held(c));assert.ok(c.routes.some(x=>x.taskId==='shade_wire'));
  r.openingPermission='selective';c=M.calculate(s);assert.ok(hours(c,'remove_drywall')>0);
  assert.match(R.html(R.build(s,c)),/Selective drywall/);
  s.project.sharedPath='closed';s.project.sharedOpenings='none';s.project.sharedFishing='blocked';
  assert.ok(M.calculate(s).issues.some(x=>x.key==='installation_route_shared_shared'));
  r.shadeGroups=[];s.project.system='HomeWorks';r.keypadType='seetouch';r.keypadQty=1;r.keypadQSWiring='new';
  c=M.calculate(s);assert.ok(c.routes.some(x=>x.taskId==='keypad_cable'));assert.ok(held(c));
}
// All supported route facts and permissions, independent truth table.
let combinations=0;
for(const ceilingPath of ['unknown','open','attic','below','closed'])for(const wallPath of ['unknown','open','accessible','closed'])for(const openingPermission of ['unknown','selective','extensive','none'])for(const fishing of ['unknown','verified','blocked'])for(const surfaceMaterial of ['drywall','plaster']){
  const [s,r]=job();Object.assign(r,{ceilingPath,wallPath,openingPermission,ceilingFishing:fishing,wallFishing:fishing,surfaceMaterial,routeEvidence:'Observed route'});
  const known=path=>path!=='unknown'&&(path!=='closed'||['selective','extensive'].includes(openingPermission)||fishing==='verified');
  const expected=known(ceilingPath)&&known(wallPath);const c=M.calculate(s);
  assert.equal(!held(c),expected,JSON.stringify({ceilingPath,wallPath,openingPermission,fishing,surfaceMaterial}));
  assert.equal(Boolean(M.range(c,s.config)),expected);assert.ok(Number.isFinite(c.knownHours));
  const report=R.build(s,c);if(!expected)assert.equal(report.range,null);
  combinations++;
}
// Drawing metadata is retained for handoff without changing quantities or leaking internal notes.
{
  const [s,r]=job();const before=M.calculate(s);Object.assign(r,{planReference:'PRIVATE E2.1',planRevision:'C',routeEvidence:'PRIVATE field survey'});
  const clean=Server.scope(s);assert.equal(clean.rooms[0].planReference,'PRIVATE E2.1');
  const after=M.calculate(s);assert.equal(after.total,before.total);assert.equal(after.routes[0].source.kind,'allowance');
  assert.equal(after.routes[0].source.reference,'PRIVATE E2.1');
  const extra=M.room('Other','retrofit');s.rooms.unshift(extra);assert.equal(M.calculate(s).routes.find(x=>x.roomId===r.id).id,after.routes[0].id);
  const html=R.html(R.build(s,after));assert.doesNotMatch(html,/PRIVATE|M4NCRS|materialCost|hoursPer|routeEvidence/);
  clean.rooms[0].wallPath='assume';assert.throws(()=>Server.scope(clean),/Invalid wallPath/);
  const saved=structuredClone(s);delete saved.config.installationRevision;saved.project.scopeReviewed=true;
  assert.equal(M.validate(saved).project.scopeReviewed,false);
  const old=structuredClone(require('./pricing/catalog.json'));old.modelRevision=10;delete old.settings.installationAllowances;
  for(const [id] of M.Installation.TASKS){delete old.settings.labor[id];delete old.settings.laborOnsite[id];}
  assert.equal(P.validate(old).modelRevision,12);
  const bad=structuredClone(require('./pricing/catalog.json'));bad.settings.installationAllowances.selectiveOpeningSpacingFt=0;assert.throws(()=>P.validate(bad));
}
console.log(`PASS: ${combinations} route/permission combinations; blocked access, verified fishing, selective/broad removal, replacements, all cable types, independent hours, site holds, scope/PDF privacy, migration and drawing provenance.`);

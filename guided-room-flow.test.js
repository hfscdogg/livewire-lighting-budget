'use strict';
const assert=require('node:assert/strict'),M=require('./dist/model'),P=require('./dist/pricing'),W=require('./dist/sales-workflow'),R=require('./dist/customer-report'),Server=require('./server/estimate');
const catalog=require('./pricing/catalog.json');
function job(){const s=P.apply(M.initial(),catalog);Object.assign(s.project,{system:'RA3',travelBand:'0'});const r=M.addRoomNamed(s,'Living room');W.preset(r,'drywall');W.ordinary(r);return s;}
const count=(c,id)=>c.materials.filter(x=>x.id===id).reduce((n,x)=>n+x.qty,0);
let s=job(),r=s.rooms[0];r.existingDimmers=3;r.existingSwitches=2;r.roomFocus='controls';W.synchronize(s);let c=M.planning(s);
assert.ok(M.range(c,s.config));assert.equal(count(c,'RA3_dimmer'),3);assert.equal(count(c,'RA3_switch'),2);
assert.equal(c.materials.filter(x=>/^fixture_|recess_parts/.test(x.id)).length,0,'Controls-only scope must not buy fixtures');
assert.equal(c.labor.filter(x=>/^(recess_|fixture_|branch_run|circuit_feeder|new_circuit)/.test(x.id)).length,0,'Existing-location control replacements must not install new fixtures or lighting branches');
assert.equal(c.labor.find(x=>x.id==='control_remove').qty,5);assert.equal(c.labor.filter(x=>x.id==='control').reduce((n,x)=>n+x.qty,0),5);
assert.ok(c.labor.some(x=>x.id==='circuit_check'));assert.ok(c.labor.some(x=>x.id==='program_control'));
assert.equal(M.emptyRoom(r),false);assert.match(R.html(R.build(s,c)),/retain the existing light fixtures/);
const unknownTotal=c.total;r.occupancy='occupied';assert.equal(M.planning(s).total,unknownTotal,'Unknown occupancy funds exactly the occupied-room labor allowance');
r.occupancy='unknown';assert.match(R.html(R.build(s,M.planning(s))),/occupancy has not yet been confirmed/);r.occupancy='vacant';assert.ok(M.planning(s).total<unknownTotal);r.occupancy='unknown';
W.chooseControls(r,'keypads');W.chooseDesign(r,'sunnata');W.chooseWalls(r,'local');W.synchronize(s);c=M.planning(s);
assert.equal(r.keypadType,'sunnata_hybrid');assert.equal(count(c,'ra3_sunnata_hybrid'),1);assert.equal(count(c,'RA3_dimmer'),2);assert.equal(c.panelCount,0);
r.controlLocations=2;W.synchronize(s);c=M.planning(s);assert.equal(c.labor.find(x=>x.id==='control_remove').qty,10);assert.equal(c.materials.filter(x=>x.id.endsWith('_companion')).reduce((n,x)=>n+x.qty,0),5);r.controlLocations=1;
W.chooseDesign(r,'palladiom');W.synchronize(s);assert.equal(s.project.system,'HomeWorks');c=M.planning(s);assert.equal(c.panelCount,0);assert.equal(count(c,'hw_palladiom'),1);assert.equal(count(c,'HomeWorks_dimmer'),3);
W.chooseWalls(r,'keypads_only');W.synchronize(s);c=M.planning(s);assert.ok(c.panelCount>0);assert.equal(count(c,'HomeWorks_dimmer'),0);assert.equal(c.labor.find(x=>x.id==='load_homerun').qty,375);assert.ok(c.labor.some(x=>x.id==='retrofit_rewire'));assert.equal(c.labor.filter(x=>x.id==='control_remove').length,0,'Central rewiring already includes disconnection');
W.chooseWalls(r,'local');W.chooseDesign(r,'sunnata');W.synchronize(s);assert.equal(s.project.system,'RA3','Reversing an inferred design upgrade restores the original platform');
W.override(r,'loadTopology');r.loadTopology='centralized';W.synchronize(s);assert.equal(r.loadTopology,'centralized','A technical override survives other defaults');W.chooseWalls(r,'local');W.synchronize(s);assert.equal(r.loadTopology,'auto','An intentional new wall choice replaces the old topology override');
W.override(r,'controlLocation');r.controlLocation='new';W.synchronize(s);c=M.planning(s);assert.ok(c.labor.some(x=>x.id==='control_drop'),'Relocating existing controls must add wiring');
W.chooseControls(r,'wall');W.synchronize(s);assert.equal(r.keypadQty,0);assert.equal(s.project.system,'RA3','Existing-light upgrades retain Lutron controls without requiring a keypad');assert.equal(c.materials.filter(x=>x.id.startsWith('fixture_')).length,0);
let restored=M.validate(JSON.parse(JSON.stringify(s)));assert.equal(restored.rooms[0].existingDimmers,3);assert.equal(restored.rooms[0].controlIntent,'wall');
const clean=Server.scope(s);assert.equal(clean.rooms[0].existingSwitches,2);assert.equal(clean.rooms[0].roomFocus,'controls');assert.throws(()=>Server.scope({...s,rooms:[{...r,existingDimmers:1.5}]}),/whole number/);
// Turning a prior draft into the new flow must preserve explicit designer choices.
const legacy={...r,keypadType:'palladiom',keypadQty:2,loadTopology:'distributed'};delete legacy.controlIntent;delete legacy.wallPreference;delete legacy.autoBudgetDefaults;s.rooms=[M.normalizeRoom(legacy)];W.synchronize(s);assert.equal(s.rooms[0].keypadType,'palladiom');assert.equal(s.rooms[0].keypadQty,2);assert.equal(s.rooms[0].loadTopology,'distributed');
// Intelligent-only scenes never add dimming modules, even with keypad-only walls.
s=job();r=s.rooms[0];r.recessGroups[0].qty=4;r.recessGroups[0].behavior='ketra';r.d2rConditions='suitable';W.chooseControls(r,'keypads');W.chooseWalls(r,'keypads_only');W.synchronize(s);c=M.planning(s);assert.equal(c.panelCount,0);assert.equal(r.keypadType,'sunnata');assert.ok(M.range(c,s.config));
r.recessGroups.push({...M.recessGroup(),qty:2});W.synchronize(s);assert.ok(M.planning(s).panelCount>0,'Adding conventional lighting honors the earlier keypad-only wall choice');
// Existing controls remain priced when combined with new lighting, without duplicate fixtures.
s=job();r=s.rooms[0];r.existingDimmers=2;r.recessGroups[0].qty=6;W.synchronize(s);c=M.planning(s);assert.equal(count(c,'RA3_dimmer'),3);assert.equal(c.materials.filter(x=>x.id.startsWith('fixture_')).reduce((n,x)=>n+x.qty,0),6);
// Old catalog releases gain the new removal task, retaining every existing task rate.
const old=structuredClone(catalog);old.modelRevision=13;delete old.settings.labor.control_remove;delete old.settings.laborOnsite.control_remove;old.settings.labor.control=0.82;const migrated=P.validate(old);assert.equal(migrated.settings.labor.control,0.82);assert.equal(migrated.settings.labor.control_remove,0.15);
console.log('PASS: existing-light control replacements, hybrid deduplication, companion removal, conditional panels, reversible system inference, occupied-room allowance, mixed work and saved/server scope preservation');

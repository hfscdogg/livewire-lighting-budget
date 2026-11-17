const assert=require('node:assert/strict'),M=require('./dist/model.js');
const setup=()=>{const s=M.initial();s.project.date='2026-12-31';s.project.travelBand='1';const r=M.room('Living room');s.rooms=[r];return [s,r];};
let [s,r]=setup();r.recessGroups=[{...M.recessGroup(),qty:6},{...M.recessGroup(),qty:2,adjustable:true}];s.project.system='RA3';let c=M.calculate(s);assert.equal(c.roomResults[0].recessQty,8);assert.equal(c.roomResults[0].adjustableQty,2);assert.equal(c.materials.find(x=>x.id==='fixture_remodel_warm_fixed').qty,6);assert.equal(c.materials.find(x=>x.id==='fixture_remodel_warm_adj').qty,2);assert.equal(c.materials.find(x=>x.id==='RA3_dimmer').qty,1);assert.equal(c.typeX,1);assert.equal(c.rate,112.5);s.project.date='2027-01-01';assert.equal(M.calculate(s).rate,112.5);
r.recessGroups[1].zone='separate';c=M.calculate(s);assert.equal(c.typeX,2);r.recessGroups[1].zone='shared';r.decorExisting=1;r.decorNew=2;c=M.calculate(s);assert.equal(c.materials.filter(x=>x.id==='RA3_dimmer').reduce((a,x)=>a+x.qty,0),4);assert.equal(c.labor.find(x=>x.id==='decor_hang').qty,3);assert.equal(c.labor.find(x=>x.id==='decor_new').qty,2);assert.equal(c.materials.find(x=>x.id==='decor_new_parts').qty,2);r.decorControlGroup='recessed';c=M.calculate(s);assert.equal(c.typeX,1);assert.equal(c.materials.find(x=>x.id==='RA3_dimmer').qty,1);assert.equal(c.labor.filter(x=>x.id==='control').reduce((a,x)=>a+x.qty,0),1);r.decorControlGroup='one';assert.equal(M.calculate(s).typeX,2);r.fanQty=2;r.fanControl='switch';assert.equal(M.calculate(s).materials.find(x=>x.id==='RA3_switch').qty,2);r.fanControl='fan';c=M.calculate(s);assert.equal(c.materials.find(x=>x.id==='RA3_fan').qty,2);assert.equal(c.typeX,4);assert.equal(c.labor.find(x=>x.id==='fan_control').qty,2);
r.surfaceMaterial='plaster';r.surfaceAccess='obstructed';Object.assign(r,{ceilingPath:'closed',wallPath:'closed',openingPermission:'none',ceilingFishing:'verified',wallFishing:'verified',routeEvidence:'Inspected test route'});c=M.calculate(s);assert.ok(!c.labor.some(x=>x.id==='obstruction_plaster'));assert.ok(c.labor.some(x=>x.id==='plaster_cut'));assert.ok(c.labor.some(x=>x.id==='branch_run'&&x.factor===2.25));assert.ok(!c.labor.some(x=>/repair|patch/.test(x.id)));r.surfaceAccess='removable';r.openingPermission='selective';c=M.calculate(s);assert.ok(c.labor.some(x=>x.id==='remove_plaster'));assert.ok(!c.labor.some(x=>x.id==='obstruction_plaster'));r.surfaceAccess='open';r.ceilingPath=r.wallPath='open';assert.ok(!M.calculate(s).labor.some(x=>/obstruction_|remove_/.test(x.id)));
r.linearFt=100;r.linearZones=2;assert.equal(M.calculate(s).roomResults[0].driverQty,2);s.config.driverMax.warm=30;assert.equal(M.calculate(s).roomResults[0].driverQty,4);
for(const k in s.config.labor)s.config.labor[k]=0;s.config.labor.circuit_check=17;for(const [band,cost]of [['0',0],['1',240],['2',480],['3',720],['4',960],['5',1200]]){s.project.travelBand=band;c=M.calculate(s);assert.equal(c.days,2);assert.equal(c.travel,cost);}s.project.travelBand='over';assert.equal(M.calculate(s).travel,null);s.project.travelBand='1';s.project.travelMiles=0;s.project.crewSize=50;s.config.dayHours=3;c=M.calculate(s);assert.equal(c.travel,240);assert.equal(c.days,2);s.config.labor.control=null;assert.equal(M.calculate(s).travel,null);
[s,r]=setup();r.recessGroups[0].qty=1;const f=s.config.catalog.find(x=>x.id==='fixture_remodel_warm_fixed'),p=s.config.catalog.find(x=>x.id==='recess_parts');f.cost=65;p.cost=35;c=M.calculate(s);assert.equal(c.materialSell,200);assert.equal(c.tax,12);f.pricing='msrp';f.msrp=150;assert.equal(M.calculate(s).materials.find(x=>x.id===f.id).price,150);r.linearFt=M.FT_PER_M;const l=s.config.catalog.find(x=>x.id==='linear_warm');l.cost=65;l.unit='m';assert.ok(Math.abs(M.calculate(s).materials.find(x=>x.id===l.id).sell-100)<1e-8);
s.project.system='RA3';r.recessGroups[0].behavior='ketra';c=M.calculate(s);assert.ok(c.issues.some(x=>x.key==='ketra'));assert.equal(c.typeX,2);s.project.system='HomeWorks';c=M.calculate(s);assert.equal(c.processors,1);assert.equal(c.dualProcessors,1);assert.ok(!c.issues.some(x=>x.key==='hw_arch'));s.config.hwArchitecture='unconfirmed';assert.ok(M.calculate(s).issues.some(x=>x.key==='hw_arch')); s.config.hwArchitecture='qsx';assert.equal(M.calculate(s).gateways,1);
[s,r]=setup();s.project.system='RA3';r.keypadQty=201;assert.equal(M.calculate(s).needsHomeWorks,true);r.keypadQty=1;s.config.ra3CoverageProcessors=4;assert.equal(M.calculate(s).processors,4);assert.equal(M.calculate(s).needsHomeWorks,false);
const old=M.initial();old.config.travelScheduleRevision=3;old.project.crewSize=1;old.project.travelMiles=100;const oldRoom={id:'legacy',name:'Old',recessQty:8,adjustable:true,recessZones:2};old.rooms=[oldRoom];const migrated=M.validate(old);assert.equal(migrated.rooms[0].recessGroups[0].qty,8);assert.equal(migrated.rooms[0].recessGroups[0].adjustable,true);assert.equal(migrated.project.crewSize,2);assert.equal(migrated.project.travelMiles,null);assert.equal(M.calculate(migrated).roomResults[0].recZones,2);
const v1=M.validate({schema:1,project:{name:'Old',lengthUnit:'m'},rooms:[{name:'Old',recessedQty:4,linearQty:2}],sources:[]});assert.equal(v1.rooms[0].recessGroups[0].qty,4);assert.equal(v1.rooms[0].linearFt,2*M.FT_PER_M);assert.throws(()=>M.validate({schema:5}));console.log('PASS: 6 standard + 2 adjustable; shared/separate/decorative control deduplication; fan switch/speed and Type X counting; obstruction/removal with no repair; 2-person travel and bands; margins/MSRP/tax/conversion; drivers; flat rate across dates; RA3/HomeWorks/Ketra rules; existing-estimate migration.');

// Independent hand takeoff with synthetic input prices and the standard crew rate.
{
  const state = M.initial();
  state.project.travelBand = '1';
  state.project.scopeReviewed = true;
  Object.assign(state.config, { smallMargin: 30, largeMargin: 35, electricalReviewed: true, loadCompatibilityReviewed: true, rangeLowPct: 5, rangeHighPct: 15 });
  const room = M.addRoomNamed(state, 'Kitchen');
  room.surfaceAccess = room.surfaceMaterial = 'open';Object.assign(room,{ceilingPath:'open',wallPath:'open',occupancy:'vacant',ceilingHeight:'standard',specialConditions:'standard'});
  room.recessGroups[0].qty = 4;
  const prices = { fixture_new_warm_fixed: 100, recess_parts: 5, none_dimmer: 30, control_wallplate: 2, lighting_branch_cable: 0.75 };
  for (const item of state.config.catalog.filter(item => Object.hasOwn(prices, item.id))) {
    Object.assign(item, { sku: `TEST-${item.id}`, verified: true, cost: prices[item.id] });
  }
  const estimate = M.calculate(state);
  assert.deepEqual(estimate.materials.map(({ id, qty }) => [id, qty]), [
    ['fixture_new_warm_fixed', 4], ['recess_parts', 4], ['none_dimmer', 1],
    ['control_wallplate', 1], ['lighting_branch_cable', 50],
  ]);
  const materials = (4 * 100 + 30) / 0.65 + (4 * 5 + 2 + 50 * 0.75) / 0.70;
  const labor = (3.75 + 0.5 + 0.75 + 1.5 + 0.25 + 1.5 + 0.75 + 0.75) * 112.50;
  assert.equal(estimate.travel, 240);
  assert.ok(Math.abs(estimate.total - (materials * 1.06 + labor + 240)) < 0.0001);
  assert.ok(M.range(estimate, state.config));
}

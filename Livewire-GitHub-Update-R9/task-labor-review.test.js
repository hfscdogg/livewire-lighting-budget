'use strict';
const assert=require('node:assert/strict');
const M=require('./dist/model'),P=require('./dist/pricing'),W=require('./dist/sales-workflow');
const Server=require('./server/estimate'),H=require('./dist/estimator-report');
const catalog=require('./pricing/catalog.json');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
const hours=(c,id)=>c.labor.filter(x=>x.id===id).reduce((sum,x)=>sum+x.hours,0);
function small(){
 const s=P.apply(M.initial(),catalog);s.project.travelBand='2';s.project.networkPlan='new';
 const r=M.addRoomNamed(s,'Living room');W.preset(r,'drywall');
 Object.assign(r,{ceilingHeight:'tall',occupancy:'unknown',specialConditions:'standard',autoBudgetDefaults:true});
 Object.assign(r.recessGroups[0],{qty:2,behavior:'ketra',adjustable:true});W.synchronize(s);return s;
}
// Independent small-job check retains 60 ft branch cable, 75 ft Ethernet,
// tall working height, occupied protection and the chosen travel band.
{
 const s=small(),c=M.planning(s);
 close(c.knownHours,22.75);close(c.knownSiteHours,21.75);close(c.laborSell,2559.375);
 close(c.materialSell,3834.397802197802);close(c.total,7487.27645054945);
 assert.equal(c.days,2);assert.equal(c.travel,480);
 assert.deepEqual(M.range(c,s.config),{low:6739,high:8610,designRetainer:269.56});
 // Off-site scope planning is separate; all programming/activation is on site.
 close(c.knownHours-c.knownSiteHours,.75+.25);
 s.project.networkPlan='existing';const ready=M.planning(s);
 close(ready.knownHours,18.5);close(ready.knownSiteHours,17.5);assert.equal(ready.days,2);
 assert.equal(hours(ready,'network_run'),0);close(hours(ready,'network_setup'),.5);
 assert.ok(ready.materials.some(x=>x.id==='control_poe'));
 assert.deepEqual(M.range(ready,s.config),{low:6178,high:7894,designRetainer:247.12});
 const shared=Server.estimatorReport(Server.scope(s),catalog);
 assert.deepEqual(shared.range,M.range(ready,s.config));close(shared.hours,ready.knownHours);
 assert.deepEqual(H.build(M.validate(JSON.parse(JSON.stringify(s))),M.planning(s)).range,shared.range);
}
// All tasks have an explicit modifier rule, including tasks retained for imports.
{
 const cfg=M.initial().config,r={access:'difficult',ceilingHeight:'tall'};cfg.sharedAccess='difficult';
 assert.equal(new Set(M.TASKS.map(x=>x[0])).size,M.TASKS.length);
 for(const [id]of M.TASKS){
  assert.ok(M.LABOR_RULES[id],id);assert.equal(typeof cfg.labor[id],'number',id);
  if(M.LABOR_RULES[id].method==='fixed')assert.equal(M.taskCondition(id,r,cfg).factor,1,id);
  if(cfg.laborOnsite[id]===false)assert.equal(M.LABOR_RULES[id].method,'fixed',id);
 }
 // Only one hour of a two-hour fan/shade assembly is elevated: 2 + 1 x .25.
 close(M.taskCondition('fan_install',{access:'normal',ceilingHeight:'tall'},cfg).factor,1.125);
 close(M.taskCondition('shade_install',{access:'normal',ceilingHeight:'tall'},cfg).factor,1.125);
 assert.equal(M.taskCondition('keypad_line_existing',{access:'normal',ceilingHeight:'tall'},cfg).factor,1);
 assert.equal(M.taskCondition('linear',{access:'normal',ceilingHeight:'tall'},cfg).factor,1);
}
// Hold quantities constant and independently change site facts. Programming,
// planning, testing and orientation rows must remain identical.
let combinations=0;
const untouched=c=>c.labor.filter(x=>/^(design|program|commission|owner|network_setup|poe_power_install)/.test(x.id)).map(x=>[x.id,x.qty,x.hours]);
const base=small(),expected=untouched(M.planning(base));
for(const surfaceMaterial of ['drywall','plaster'])for(const ceilingPath of ['open','attic','closed'])for(const wallPath of ['open','closed'])for(const openingPermission of ['selective','none'])for(const ceilingHeight of ['standard','tall'])for(const occupancy of ['vacant','occupied'])for(const access of ['normal','limited','difficult']){
 const s=structuredClone(base);Object.assign(s.rooms[0],{surfaceMaterial,ceilingPath,wallPath,openingPermission,ceilingHeight,occupancy,access,ceilingFishing:'verified',wallFishing:'verified',routeEvidence:'Observed clear routes for test'});
 const c=M.planning(s);assert.deepEqual(untouched(c),expected);assert.ok(M.range(c,s.config));
 if(openingPermission==='none')assert.equal(hours(c,'remove_drywall')+hours(c,'remove_plaster'),0);
 combinations++;
}
// A difficult wall drop affects that segment only: 25 x .03 + 25 x .03 x 1.75.
{
 const s=small(),r=s.rooms[0];Object.assign(r,{ceilingPath:'open',wallPath:'closed',ceilingHeight:'standard',openingPermission:'none',wallFishing:'verified',routeEvidence:'Verified wall drop'});
 const line=M.planning(s).labor.find(x=>x.id==='branch_run');close(line.hours,2.25);
 assert.equal(line.modifiers.length,2);
 r.ceilingPath='closed';r.ceilingFishing='blocked';r.routeEvidence='';assert.equal(M.range(M.planning(s),s.config),null);
}
// Existing wall controls do not create overhead work or room-wide dust protection.
{
 const s=small(),r=s.rooms[0];r.recessGroups[0].qty=0;r.existingDimmers=2;r.keypadQty=0;
 s.project.networkPlan='existing';W.synchronize(s);r.ceilingHeight='special';r.occupancy='occupied';
 const c=M.planning(s);assert.ok(M.range(c,s.config));assert.equal(c.routes.length,0);
 close(hours(c,'occupied_control_protection'),.25);assert.equal(hours(c,'occupied_protection'),0);
}
// Apply a room opening override once. Short fixture links use fixture cutouts.
{
 const s=small(),r=s.rooms[0];r.accessOpeningsOverride=3;const c=M.planning(s);
 close(c.labor.filter(x=>x.groupId===r.id&&x.id==='remove_drywall').reduce((a,x)=>a+x.qty,0),3);
 assert.equal(c.routes.find(x=>/between recessed/.test(x.reason)).accessOpenings,0);
 r.ceilingHeight='standard';close(hours(M.planning(s),'remove_drywall'),2.75);
}
// Large-system planning/programming grows with actual quantities and architecture.
{
 function estate(rooms,qty,central=false){
  const s=P.apply(M.initial(),catalog);s.project.travelBand='0';s.project.system='HomeWorks';s.project.networkPlan='new';
  for(let i=0;i<rooms;i++){const r=M.addRoomNamed(s,'Room '+(i+1));W.preset(r,'open');W.ordinary(r);r.autoBudgetDefaults=true;
   Object.assign(r.recessGroups[0],{qty,behavior:central?'warm':'ketra',adjustable:true});
   if(central){W.chooseControls(r,'keypads');W.chooseDesign(r,'palladiom');W.chooseWalls(r,'keypads_only');}
  }W.synchronize(s);return s;
 }
 const smallC=M.planning(estate(1,2)),large=M.planning(estate(24,12)),bigger=M.planning(estate(30,16)),panel=M.planning(estate(8,8,true));
 for(const c of [smallC,large,bigger,panel]){assert.ok(c.knownHours>0);assert.equal(c.missingHours,false);assert.ok(c.labor.every(x=>Number.isFinite(x.hours)&&x.hours>=0));}
 assert.ok(hours(large,'program_intelligent')>hours(smallC,'program_intelligent')*20);
 assert.ok(hours(bigger,'design_endpoint')>hours(large,'design_endpoint'));
 assert.ok(bigger.programming.totalHours>large.programming.totalHours);
 assert.ok(hours(large,'design_processor')>0);assert.ok(hours(panel,'design_panel')>0);
 assert.equal(hours(panel,'program_intelligent'),0);assert.ok(hours(panel,'module_install')>0);
 assert.ok(bigger.knownHours>large.knownHours);assert.ok(large.knownHours>smallC.knownHours);
}
// One startup plus device entry AND activation. No layered legacy charges.
{
 const s=small(),c=M.planning(s);
 close(c.programming.totalHours,1+.5+.5);
 close(hours(c,'program_startup'),1);close(hours(c,'program_intelligent'),.5);
 close(hours(c,'program_keypad_device'),.5);
 for(const id of M.LEGACY_PROGRAM_TASKS)assert.equal(hours(c,id),0,id);
 assert.equal(hours(c,'shade_group'),0);
 const untouched=c.labor.filter(row=>!row.id.startsWith('program_')).map(row=>[row.id,row.hours]);
 s.config.programmingTiers={firstLimit:1,secondLimit:2,thirdLimit:3,secondFactor:1.1,thirdFactor:1.2,fourthFactor:1.35};
 const raised=M.planning(s);close(raised.programming.factor,(1+1.1+1.2+1.35)/4);
 close(hours(raised,'program_startup'),1);
 assert.deepEqual(raised.labor.filter(row=>!row.id.startsWith('program_')).map(row=>[row.id,row.hours]),untouched);
 const ordinary=small();ordinary.project.system='RA3';ordinary.project.systemRequested='RA3';ordinary.rooms[0].recessGroups[0].behavior='warm';ordinary.rooms[0].keypadQty=0;W.synchronize(ordinary);
 const simple=M.planning(ordinary);assert.equal(simple.programming.counts.program_intelligent,0);
 assert.equal(simple.programming.counts.program_control,1);close(simple.programming.totalHours,1+.25);
 ordinary.project.system='none';ordinary.project.systemRequested='none';W.synchronize(ordinary);assert.equal(M.planning(ordinary).programming,null);
}
// Count shade motors/layers, Pico, modules and used outputs without duplicates.
{
 const s=P.apply(M.initial(),catalog);s.project.system='HomeWorks';s.project.travelBand='0';
 s.project.networkPlan='existing';const r=M.addRoomNamed(s,'Shades');W.preset(r,'drywall');W.ordinary(r);
 r.shadeGroups=[{...M.Shade.group(M.uid),qty:2,layers:2,widthFt:4,heightFt:5}];r.shadeControl='pico';
 const c=M.calculate(s);assert.equal(c.programming.counts.program_shade,4);assert.equal(c.programming.counts.program_pico,1);
 assert.equal(c.programming.counts.program_control,0);close(c.programming.totalHours,1+.75+.25);
 close(hours(c,'shade_install'),8);assert.equal(hours(c,'shade_group'),0);assert.equal(hours(c,'commission_device'),0);
 const mix=small(),room=mix.rooms[0];room.recessGroups[0].behavior='warm';room.existingDimmers=2;
 W.chooseControls(room,'keypads');W.chooseDesign(room,'sunnata');W.chooseWalls(room,'local');W.synchronize(mix);
 const hybrid=M.planning(mix);assert.equal(hybrid.programming.counts.program_keypad_device,1);
 assert.equal(hybrid.programming.counts.program_control,2,'Hybrid keypad owns one of three conventional loads');
 W.chooseDesign(room,'palladiom');W.chooseWalls(room,'keypads_only');W.synchronize(mix);
 const panel=M.planning(mix);assert.equal(panel.programming.counts.program_control,0);
 assert.equal(panel.programming.counts.program_module,panel.moduleCount);assert.equal(panel.programming.counts.program_output,3);
}
// Marginal bands are continuous: the next device adds its own weighted share.
{
 const expected=[[100,100],[101,101.1],[250,265],[251,266.2],[500,565],[501,566.35],[1000,1240]];
 for(const [count,weighted]of expected)close(M.programmingScale(count).weightedDevices,weighted);
 for(let n=1;n<=1800;n++){
  const before=M.programmingScale(n-1),after=M.programmingScale(n);
  const increment=after.weightedDevices-before.weightedDevices;
  assert.ok(increment>=1-1e-8&&increment<=1.35+1e-8);
  assert.ok(after.factor>=before.factor&&after.factor<=1.35);
 }
 const invalid=structuredClone(catalog);invalid.settings.programmingTiers.secondLimit=10;
 assert.throws(()=>P.validate(invalid),/programming complexity bands/);
}
// Old published catalogs remain versioned; local default-hour migration is visible
// and preserves custom rates, equipment, fees, wiring facts and site answers.
{
 const s=small();s.config.laborRevision=8;Object.assign(s.config.labor,M.LEGACY_LABOR_DEFAULTS);
 const legacy=M.planning(s);close(legacy.knownHours,37.86625);close(legacy.total,9187.85457554945);
 const oldRelease=P.make(s,'legacy-reviewed','2026-11-16');assert.equal(P.validate(oldRelease).settings.laborRevision,8);
 assert.equal(P.apply(M.initial(),oldRelease).config.labor.design_homeworks,6);
 s.config.labor.decor_hang=2.25;const before=JSON.stringify(s.config.catalog),rooms=JSON.stringify(s.rooms);
 const updated=M.validate(structuredClone(s));assert.equal(updated.config.laborRevision,10);assert.equal(updated.config.labor.decor_hang,2.25);
 assert.equal(JSON.stringify(updated.config.catalog),before);assert.equal(JSON.stringify(updated.rooms),rooms);
 assert.match(updated.laborUpdateNotice,/Equipment prices and site answers were preserved/);
 assert.equal(updated.project.networkPlan,'new');assert.equal(updated.config.rangeLowPct,-10);assert.equal(updated.config.rangeHighPct,15);
 const again=M.validate(structuredClone(updated));assert.deepEqual(again.config,updated.config);
}
console.log('PASS: independent two-Ketra hours/range, '+combinations+' site permutations, all task modifier rules, proportional height/route effects, controls-only work, large systems and preserved overrides.');

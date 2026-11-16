'use strict';
// Verify the standalone planning boundary without changing shared approval behavior.
const assert=require('node:assert/strict');
const M=require('./dist/model'),P=require('./dist/pricing'),W=require('./dist/sales-workflow'),R=require('./dist/customer-report');
const catalog=require('./pricing/catalog.json');
function job(){
 const s=P.apply(M.initial(),catalog);
 Object.assign(s.project,{system:'RA3',install:'remodel',travelBand:'0',sharedPath:'open'});
 const r=M.addRoomNamed(s,'Kitchen');r.recessGroups[0].qty=6;
 W.preset(r,'drywall');W.ordinary(r);r.occupancy='vacant';return s;
}
function quantity(c,id){return c.materials.filter(x=>x.id===id).reduce((n,x)=>n+x.qty,0);}
let s=job(),strict=M.calculate(s),c=M.planning(s,strict);
assert.equal(M.range(strict,s.config),null);
assert.ok(M.range(c,s.config));assert.ok(c.planningChecks.length);
assert.equal(s.project.scopeReviewed,false);assert.equal(s.config.electricalReviewed,false);
assert.ok(strict.issues.some(x=>x.key==='scope'),'Planning does not mutate the strict calculation');
let d=R.build(s,c),html=R.html(d);
assert.match(html,/Livewire will supply and install 6 fixed/);
assert.match(html,/planning budget/);assert.match(html,/Existing circuits are assumed suitable/);
assert.doesNotMatch(html,/M4NCRS|supplier cost|hoursPer|scopeReviewed/);
const range=M.range(c,s.config);assert.equal(range.designRetainer,Math.round(range.low*4)/100);
s=job();s.config.rangeLowPct=null;assert.ok(M.planning(s).issues.some(x=>x.key==='planning_range'),'Unconfigured range has an actionable hold');
// Genuine missing money, unknown site conditions and physical restrictions are never reminders.
for(const change of [s=>Object.assign(s.config.catalog.find(x=>x.id==='fixture_remodel_warm_fixed'),{cost:null,msrp:null}),s=>s.rooms[0].ceilingHeight='special',s=>s.rooms[0].specialConditions='masonry',s=>s.rooms[0].routeLength='long',s=>s.project.systemPlan='existing']){
 s=job();change(s);assert.equal(M.range(M.planning(s),s.config),null);
}
s=job();const r=s.rooms[0];W.preset(r,'noCuts');c=M.planning(s);
assert.equal(M.range(c,s.config),null);assert.deepEqual(W.noCutSegments(r,c.routes).map(x=>x.kind).sort(),['ceiling','wall']);
r.ceilingFishing='verified';r.wallFishing='verified';assert.equal(M.range(M.planning(s),s.config),null,'No-cut proof requires a reference');
r.routeEvidence='Electrician checked the ceiling bay and wall drop';assert.ok(M.range(M.planning(s),s.config));
r.ceilingFishing='blocked';assert.equal(M.range(M.planning(s),s.config),null);
W.preset(r,'drywall');assert.ok(M.range(M.planning(s),s.config),'Changing mistaken no-cut selection restores viable route');
r.install='retrofit';W.preset(r,'noCuts');assert.equal(W.noCutSegments(r,M.calculate(s).routes).length,0,'Existing-location replacement does not ask for unrelated fishing proof');
// Both intelligent fixture families and Rania tape upgrade the platform automatically.
for(const behavior of ['ketra','rania']){s=job();s.rooms[0].recessGroups[0].behavior=behavior;assert.equal(W.synchronize(s),true);assert.equal(s.project.system,'HomeWorks');assert.equal(W.synchronize(s),false);assert.equal(M.range(M.planning(s),s.config),null,'Unknown D2R ceiling suitability remains a physical check');assert.match(R.html(R.build(s,M.planning(s))),/to support the selected Ketra or Rania lighting/);}
// Manufacturer boundaries: 16.4 ft per high-output package; dual-ended feeds above 11 ft.
for(const [feet,controllers,feedFeet,reels] of [[4,1,15,1],[11,1,15,1],[11.1,1,30,1],[12,1,30,1],[16.4,1,30,1],[16.5,2,45,2],[32.8,2,60,2]]){
 s=job();Object.assign(s.rooms[0],{linearFt:feet,linearBehavior:'rania'});W.synchronize(s);c=M.planning(s);
 assert.deepEqual(c.issues,[],String(feet));assert.ok(M.range(c,s.config));
 assert.equal(quantity(c,'driver_rania'),controllers);assert.equal(quantity(c,'linear_lead_rania'),feedFeet);
 assert.ok(Math.abs(quantity(c,'linear_rania')-reels*5/.3048)<1e-8);
 assert.equal(quantity(c,'rania_power_lead'),controllers*2);
 assert.ok(c.labor.some(x=>x.id==='linear_lead_run'&&x.hours>0));
 assert.match(R.html(R.build(s,c)),/Rania · natural white undercabinet lighting/);
}
s=job();Object.assign(s.rooms[0],{linearFt:24,linearBehavior:'rania',linearZones:2});W.synchronize(s);
assert.ok(M.planning(s).issues.some(x=>x.key.startsWith('linear_zone_lengths_')));
s.rooms[0].linearZoneLengths='4, 20';c=M.planning(s);assert.equal(quantity(c,'driver_rania'),3);assert.equal(quantity(c,'linear_lead_rania'),60);assert.ok(M.range(c,s.config));
s.config.linearLeadFt=16;assert.equal(M.range(M.planning(s),s.config),null);
s.config.linearLeadFt=15;s.project.system='RA3';assert.equal(M.range(M.planning(s),s.config),null,'Engine independently rejects Rania on RA3');
// Referenced supplier rows must match exactly; no replacement of missing downlight trims with partial totals.
const supplier=require('./pricing/lutron-supplier-prices.json').rows;
for(const [sku,cost,list]of [['HWL-MWCL-WH',330,600],['LU-PH3-B',192.5,350],['LU-T05-RANIA-IN',292.71,532.2],['LU-WK1-4W',68.75,125],['LU-CK1-4W',19.25,35]]){
 const row=supplier.find(x=>x.sku===sku);assert.ok(row,sku);assert.equal(row.cost,cost);assert.equal(row.list,list);
}
// New rooms are not auto-approved, and an oversized system remains held.
s=job();s.rooms[0].recessGroups[0].qty=10001;assert.equal(M.range(M.planning(s),s.config),null);
console.log('PASS: standalone planning ranges without false approval, real-price/site holds, necessary no-cut routes, automatic HomeWorks, Rania run/feed/reel boundaries and supplier price matches.');

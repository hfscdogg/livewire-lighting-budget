'use strict';
const assert=require('node:assert/strict');
const M=require('./dist/model'),P=require('./dist/pricing'),W=require('./dist/sales-workflow'),R=require('./dist/customer-report'),Server=require('./server/estimate');
const catalog=require('./pricing/catalog.json');
function job(n=1,behavior='warm',install='remodel'){
 const s=P.apply(M.initial(),catalog);Object.assign(s.project,{install,system:'RA3',systemPlan:'new',travelBand:'2'});
 for(let i=0;i<n;i++){const r=M.addRoomNamed(s,'Room '+i);Object.assign(r,{occupancy:'occupied',d2rConditions:'suitable'});r.recessGroups[0].qty=8;r.recessGroups[0].behavior=behavior;W.preset(r,i%2?'attic':'drywall');W.ordinary(r);}
 W.synchronize(s);return s;
}
const qty=(c,id)=>c.materials.filter(x=>x.id===id).reduce((a,x)=>a+x.qty,0);
// Complete assembly money and physical compatibility are independent.
for(const behavior of ['rania','ketra'])for(const adjustable of [false,true]){
 const s=job(1,behavior);s.rooms[0].recessGroups[0].adjustable=adjustable;
 let c=M.planning(s);assert.ok(M.range(c,s.config));assert.equal(c.missingCosts,0);
 const row=c.materials.find(x=>x.id.startsWith('fixture_'));
 assert.equal(row.priceBasis,'comparable-allowance');assert.equal(row.price,s.config.catalog.find(x=>x.id===row.id).cost/.65);
 assert.match(R.html(R.build(s,c)),/conservative allowance for standard white decorative trims/);
 assert.doesNotMatch(R.html(R.build(s,c)),/UN-D2|\$99|supplier cost/);
 s.rooms[0].d2rConditions='unknown';assert.equal(W.requirements(s,M.planning(s)).find(x=>x.key.startsWith('d2r_site_')).step,3);
 s.rooms[0].d2rConditions='incompatible';s.config.siteConditionsReviewed=true;assert.equal(M.range(M.planning(s),s.config),null);
}
// Previously saved drafts gain only the newly completed blank mappings.
let s=job();const original=JSON.stringify(s.rooms),id='fixture_remodel_ketra_adj',row=s.config.catalog.find(x=>x.id===id);
Object.assign(row,{cost:null,msrp:null,verified:false});assert.ok(P.supplement(s,catalog).includes(id));assert.equal(JSON.stringify(s.rooms),original);
row.cost=777;assert.equal(P.supplement(s,catalog).length,0);assert.equal(row.cost,777);assert.equal(s.project.scopeReviewed,false);
const roundtrip=P.validate(P.make(s,'roundtrip','2026-11-13'));assert.equal(roundtrip.settings.catalog.find(x=>x.id===id).priceBasis,'comparable-allowance');
// Unpriced selections must appear in each affected room, not only the first material row.
s=job(2);Object.assign(s.config.catalog.find(x=>x.id==='fixture_remodel_warm_fixed'),{cost:null,msrp:null});
assert.deepEqual(W.requirements(s,M.planning(s)).filter(x=>x.key==='price_fixture_remodel_warm_fixed').map(x=>x.index),[0,1]);
// Shade mounting is answered on Conditions, allowing the lighting page to advance.
s=job();s.rooms[0].surfaceMaterial='unknown';s.rooms[0].shadeGroups.push({...M.Shade.group(M.uid),qty:1,widthFt:4,heightFt:5});
assert.equal(W.requirements(s,M.planning(s)).find(x=>x.key.startsWith('shade_surface_')).step,3);
// Both quantities and installation work increase in multi-room estate scenarios.
let prev=0;
for(const count of [1,4,16,32]){
 s=job(count,'ketra');for(const [i,r]of s.rooms.entries()){
  Object.assign(r,{linearFt:12,linearBehavior:'rania',fanQty:1,fanWork:'replace',fanSupport:'unknown',fanControl:'existing',decorNew:2});
  r.shadeGroups.push({...M.Shade.group(M.uid),qty:2,widthFt:4,heightFt:5});
 }
 W.synchronize(s);const c=M.planning(s),range=M.range(c,s.config);
 assert.deepEqual(c.issues,[],JSON.stringify(c.issues));assert.ok(range&&range.low>prev);prev=range.low;
 assert.equal(qty(c,'fan_support'),count);assert.equal(qty(c,'driver_rania'),count);
 assert.equal(range.designRetainer,Math.round(range.low*4)/100);assert.ok(c.knownHours>count*10);
 assert.equal(qty(c,'fixture_remodel_ketra_fixed'),count*8);assert.ok(c.labor.some(x=>x.id==='keypad_line_existing'));
 assert.ok(c.routes.some(x=>x.segments.some(seg=>seg.kind==='shared'&&seg.inferred)));
}
// System sizing advances a new over-capacity RA3 job, but never silently replaces an existing installation.
s=job(30,'lumaris');assert.equal(s.project.system,'HomeWorks');assert.ok(M.range(M.planning(s),s.config));
s.project.system='RA3';s.project.systemPlan='existing';W.synchronize(s);assert.equal(s.project.system,'RA3');assert.equal(M.range(M.planning(s),s.config),null);
// Copying does not transplant physical ceiling verification.
s=job(1,'ketra');const copied=W.copyRoom(s,s.rooms[0].id,M.uid);assert.equal(copied.d2rConditions,'unknown');
const exported=Server.scope(s);assert.equal(exported.rooms[0].d2rConditions,'suitable');assert.equal(exported.rooms[1].d2rConditions,'unknown');
// Saved data roundtrip keeps choices, notes, room groups and source allowance.
s.rooms[0].notes='PRIVATE SITE NOTES';const restored=M.validate(JSON.parse(JSON.stringify(s)));
assert.equal(restored.rooms[0].notes,s.rooms[0].notes);assert.equal(restored.rooms[0].d2rConditions,'suitable');
assert.doesNotMatch(R.html(R.build(restored,M.planning(restored))),/PRIVATE SITE NOTES/);
console.log('PASS: complete D2R budget assemblies, physical ceiling safeguards, old-draft supplements, per-room required answers, shade condition routing, 1–32-room mixed estates, automatic new-system capacity selection, save/import and client-data separation.');

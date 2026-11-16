'use strict';
const assert=require('node:assert/strict');
const M=require('./dist/model'),P=require('./dist/pricing'),W=require('./dist/sales-workflow'),R=require('./dist/customer-report');
function job(preset='drywall'){
 const s=P.apply(M.initial(),require('./pricing/catalog.json'));
 Object.assign(s.project,{system:'RA3',install:'remodel',travelBand:'0'});
 const r=M.addRoomNamed(s,'Living room');r.recessGroups[0].qty=6;W.preset(r,preset);W.ordinary(r);r.occupancy='vacant';return s;
}
for(const [preset,method]of [['open','open'],['drywall','selective'],['plaster','selective']]){
 const s=job(preset),before=JSON.stringify(s.project),c=M.planning(s);
 assert.ok(M.range(c,s.config),preset);assert.equal(JSON.stringify(s.project),before,'Derived access never rewrites site facts');
 const segments=c.routes.flatMap(x=>x.segments).filter(x=>x.kind==='shared');
 assert.ok(segments.length);assert.ok(segments.every(x=>x.method===method&&x.inferred===true));
 assert.match(R.html(R.build(s,c)),/Wiring between rooms and the control equipment is budgeted using the construction and access conditions/);
 const manual=structuredClone(s);Object.assign(manual.project,preset==='open'?{sharedPath:'open'}:{sharedPath:'closed',sharedSurface:preset==='plaster'?'plaster':'drywall',sharedOpenings:'selective'});
 const explicit=M.planning(manual);assert.equal(c.total,explicit.total,'Inferred route must carry the same material/removal/pull labor as equivalent explicit access');
}
let s=job();s.rooms[0].ceilingPath='attic';let c=M.planning(s);assert.ok(M.range(c,s.config));assert.ok(c.routes.flatMap(x=>x.segments).filter(x=>x.kind==='shared').every(x=>x.method==='accessible'));
s=job('noCuts');assert.equal(M.range(M.planning(s),s.config),null);
Object.assign(s.rooms[0],{ceilingFishing:'verified',wallFishing:'verified',routeEvidence:'Electrician checked joist bay and wall drops'});
c=M.planning(s);assert.ok(M.range(c,s.config));assert.equal(s.project.sharedFishing,'unknown');assert.ok(c.routes.flatMap(x=>x.segments).some(x=>x.kind==='shared'&&x.inferred&&x.method==='fish'));
assert.match(R.html(R.build(s,c)),/Allow for fishing cable between rooms/);
s.rooms[0].ceilingFishing='blocked';assert.equal(M.range(M.planning(s),s.config),null);
// Explicit estimator overrides remain authoritative and cannot be made viable by inference.
s=job('open');Object.assign(s.project,{sharedPath:'closed',sharedSurface:'drywall',sharedOpenings:'none',sharedFishing:'blocked'});assert.equal(M.range(M.planning(s),s.config),null);
// The exact reported selection is caught on the lighting page, including the actual unpriced component.
s=job();s.rooms[0].recessGroups[0].behavior='ketra';s.rooms[0].recessGroups[0].adjustable=true;W.synchronize(s);
let requirements=W.requirements(s,M.planning(s));
assert.ok(!requirements.some(x=>/^(price|sku)_fixture_remodel_ketra_adj$/.test(x.key)),'Conservative trim allowance completes the selected assembly');
assert.equal(requirements.find(x=>x.key.startsWith('d2r_site_')).step,3);
s.rooms[0].d2rConditions='suitable';assert.ok(M.range(M.planning(s),s.config));
s.rooms[0].d2rConditions='incompatible';s.config.siteConditionsReviewed=true;assert.equal(M.range(M.planning(s),s.config),null,'An explicitly incompatible ceiling cannot be approved globally');
assert.ok(!requirements.some(x=>x.key.startsWith('installation_route_shared')),'Answered room access supplies connecting-route allowance');
s=job();s.rooms[0].occupancy='unknown';requirements=W.requirements(s,M.planning(s));assert.ok(requirements.some(x=>x.step===3&&x.index===0));
console.log('PASS: inferred connecting wiring carries equivalent labor, preserves site facts and blocked routes; Ketra allowance resolves price while physical site checks appear on Conditions; room requirements are assigned before budget.');

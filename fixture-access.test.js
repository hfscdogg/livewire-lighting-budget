'use strict';
const assert=require('node:assert/strict');
const M=require('./dist/model'),P=require('./dist/pricing'),W=require('./dist/sales-workflow'),Report=require('./dist/customer-report'),Server=require('./server/estimate');
const catalog=require('./pricing/catalog.json');
function job(install,surface,behavior='warm',adjustable=false){
 const s=P.apply(M.initial(),catalog);Object.assign(s.project,{install,travelBand:'0'});
 const r=M.addRoomNamed(s,'Kitchen');W.preset(r,surface);W.ordinary(r);r.occupancy='occupied';r.d2rConditions='suitable';
 Object.assign(r.recessGroups[0],{qty:6,behavior,adjustable});W.synchronize(s);return s;
}
const total=(lines,id)=>lines.filter(x=>x.id===id).reduce((sum,x)=>sum+x.qty,0);
let cases=0;
for(const install of ['new','remodel','retrofit'])for(const surface of ['open','drywall','plaster'])for(const adjustable of [false,true]){
 const initial=job(install,surface);const choices=W.fixtureOptions(initial.rooms[0],adjustable);
 assert.equal(choices.includes('lumaris'),!adjustable);
 for(const behavior of choices){
  const s=job(install,surface,behavior,adjustable),r=s.rooms[0],g=r.recessGroups[0],build=surface==='open'?'new':'remodel';
  const c=M.planning(s),key=`fixture_${build}_${behavior}_${adjustable?'adj':'fixed'}`;
  assert.equal(M.fixtureBuild(r,g),build,`${install} / ${surface} / ${behavior}`);
  assert.equal(total(c.materials,key),6);assert.equal(total(c.labor,'recess_'+build),6);
  assert.ok(total(c.materials,'lighting_branch_cable')>=50,'Complete fixtures carry a branch wiring allowance');
  assert.equal(total(c.labor,'fixture_remove'),install==='retrofit'?6:0);
  assert.equal(total(c.labor,'plaster_cut')>0,surface==='plaster');
  assert.deepEqual(c.issues,[],`${install} / ${surface} / ${behavior} / ${adjustable}`);
  assert.equal(c.missingCosts,0);assert.ok(M.range(c,s.config));
  const report=Report.html(Report.build(s,c));assert.doesNotMatch(report,/supplier cost|materialCost|M4NCRS/);
  if(['rania','ketra'].includes(behavior)&&surface!=='open'){
   r.d2rConditions='unknown';
   const missing=M.planning(s);assert.equal(missing.missingCosts,0,'Suitability is a site condition, never a missing price');
   assert.ok(M.range(missing,s.config));assert.ok(!W.requirements(s,missing).some(x=>x.key.startsWith('d2r_site_')));assert.equal(missing.estimatorNotes.length,1);assert.equal(Server.calculate(Server.scope(s),catalog).summary.estimatorNotes.length,1);assert.equal(missing.total,c.total,'A deferred check does not remove equipment or labor');
   r.d2rConditions='incompatible';s.config.siteConditionsReviewed=true;
   assert.equal(M.range(M.planning(s),s.config),null,'General approval cannot override incompatible ceiling conditions');
   assert.ok(!W.fixtureOptions(r,adjustable).includes(behavior));
   W.preset(r,'open');assert.ok(W.fixtureOptions(r,adjustable).includes(behavior));
  }
  cases++;
 }
}
// Existing-housing reuse is explicit and must retain its lower-scope assembly and fit check.
{
 const s=job('remodel','drywall'),r=s.rooms[0],g=r.recessGroups[0];g.housing='reuse';
 let c=M.planning(s);assert.equal(total(c.materials,'fixture_retrofit_warm_fixed'),6);
 assert.equal(total(c.materials,'lighting_branch_cable'),0);assert.equal(total(c.labor,'recess_retrofit'),6);
 assert.equal(M.range(c,s.config),null);assert.ok(W.requirements(s,c).some(x=>x.step===3&&x.key.startsWith('retrofit_can')));
 r.retrofitCanFit='suitable';assert.ok(M.range(M.planning(s),s.config));
 const reopened=M.validate(JSON.parse(JSON.stringify(s)));assert.equal(reopened.rooms[0].recessGroups[0].housing,'reuse');
 assert.equal(Server.scope(s).rooms[0].retrofitCanFit,'suitable');
 r.retrofitCanFit='incompatible';s.config.siteConditionsReviewed=true;assert.equal(M.range(M.planning(s),s.config),null);
 g.behavior='ketra';assert.ok(M.planning(s).issues.some(x=>x.key.startsWith('retrofit_family')));
 assert.ok(!W.fixtureOptions(r,false,'reuse').includes('ketra'));
 g.housing='invalid';assert.ok(M.inputIssues(s).some(x=>x.key.endsWith('_housing')));assert.throws(()=>Server.scope(s),/housing/);
}
// Identical finished surfaces use identical assembly labor, regardless of the project label.
{
 for(const behavior of ['warm','rania','ketra']){
  const a=M.planning(job('new','plaster',behavior)),b=M.planning(job('retrofit','plaster',behavior));
  assert.equal(total(a.labor,'recess_remodel'),total(b.labor,'recess_remodel'));
  assert.equal(a.routes.filter(x=>x.taskId==='branch_run').reduce((n,x)=>n+x.totalFeet,0),b.routes.filter(x=>x.taskId==='branch_run').reduce((n,x)=>n+x.totalFeet,0));
 }
 const s=job('retrofit','drywall','ketra'),r=s.rooms[0];W.preset(r,'noCuts');
 assert.equal(M.range(M.planning(s),s.config),null,'Full replacement fixtures do not bypass no-cut routes');
}
// Copy skips complete rooms, keeps a future uncopied room, and stops for real room-specific constraints.
{
 const s=job('remodel','drywall'),source=s.rooms[0];
 for(const name of ['Dining','Living','Office']){const r=M.addRoomNamed(s,name);r.recessGroups[0].qty=4;}
 W.copyConditions(source,s.rooms[1]);W.copyConditions(source,s.rooms[2]);W.synchronize(s);
 const next=()=>W.nextConditionsRoom(s,0,W.requirements(s,M.planning(s)));
 assert.equal(next(),3);W.copyConditions(source,s.rooms[3]);assert.equal(next(),-1);
 s.rooms[1].recessGroups[0].behavior='rania';W.synchronize(s);assert.equal(next(),-1);assert.equal(M.planning(s).estimatorNotes.length,1);s.rooms[1].d2rConditions='incompatible';assert.equal(next(),1);
 s.rooms[1].d2rConditions='suitable';assert.equal(next(),-1);
 W.preset(source,'noCuts');source.ceilingFishing=source.wallFishing='verified';source.routeEvidence='Source room observed route';
 W.copyConditions(source,s.rooms[1]);assert.equal(s.rooms[1].routeEvidence,'');assert.equal(next(),1);
 assert.equal(Server.scope(s).rooms[1].conditionsCopiedFrom,'Kitchen');
}
console.log(`PASS: ${cases} surface-led fixed/adjustable fixture scenarios, priced recipes, installation/wiring labor, explicit housing reuse, no-cut and ceiling-fit safeguards, copy navigation and saved-state compatibility.`);

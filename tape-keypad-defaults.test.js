'use strict';
const assert=require('node:assert/strict');
const M=require('./dist/model'),P=require('./dist/pricing'),W=require('./dist/sales-workflow'),R=require('./dist/customer-report'),Server=require('./server/estimate');
const catalog=require('./pricing/catalog.json');
function job(system='none',install='remodel'){
 const s=P.apply(M.initial(),catalog);Object.assign(s.project,{install,system,systemRequested:system,travelBand:'0'});
 const r=M.addRoomNamed(s,'Kitchen');W.preset(r,'drywall');W.ordinary(r);r.occupancy='occupied';return s;
}
const qty=(c,id)=>c.materials.filter(x=>x.id===id).reduce((n,x)=>n+x.qty,0);
let cases=0;
for(const platform of ['none','RA3','HomeWorks'])for(const behavior of ['lumaris_warm','lumaris','rania','lumaris_rgb'])for(const ft of [8,16.4,17,33]){
 const s=job(platform),r=s.rooms[0];Object.assign(r,{linearFt:ft,linearBehavior:behavior});W.synchronize(s);
 const c=M.planning(s);assert.deepEqual(c.issues,[],behavior+' '+ft);assert.ok(M.range(c,s.config));assert.equal(c.missingCosts,0);
 assert.ok(c.labor.some(x=>x.id==='linear'));assert.ok(c.labor.some(x=>x.id==='driver'));assert.ok(c.labor.some(x=>x.id==='linear_lead_run'));
 const hardware=behavior==='lumaris_warm'?'lumaris':behavior,suffix=s.project.system==='HomeWorks'&&hardware!=='rania'?'_hw':'';
 assert.equal(qty(c,'driver_'+hardware+suffix),Math.ceil(ft/(behavior==='lumaris_rgb'?32.8:16.4)));
 assert.equal(c.programming.counts.program_intelligent,qty(c,'driver_'+hardware+suffix),'Program each tape controller once');
 assert.equal(qty(c,s.project.system+'_dimmer'),0,'Intelligent tape receives undimmed power');
 assert.equal(qty(c,'linear_warm'),0);assert.equal(qty(c,'driver_warm'),0);
 if(behavior==='rania')assert.equal(s.project.system,'HomeWorks');
 if(behavior==='lumaris_warm'){
  const twin=structuredClone(s);twin.rooms[0].linearBehavior='lumaris';assert.equal(c.total,M.planning(twin).total,'Warm dim and tunable white use identical hardware');
  assert.match(R.html(R.build(s,c)),/Lumaris · warm dim/);
 }
 assert.equal(Server.scope(s).rooms[0].linearBehavior,behavior);cases++;
}
for(const type of ['sunnata','palladiom','alisse','aviena','seetouch'])for(const walls of ['local','keypads_only']){
 const s=job(),r=s.rooms[0];r.existingDimmers=3;W.chooseControls(r,'keypads');W.chooseDesign(r,type);W.chooseWalls(r,walls);W.synchronize(s);
 const c=M.planning(s);assert.deepEqual(c.issues,[],type+' '+walls);assert.ok(M.range(c,s.config));assert.equal(c.missingCosts,0);
 assert.equal(c.panelCount>0,walls==='keypads_only');
 if(['palladiom','alisse','aviena'].includes(type))assert.equal(s.project.system,'HomeWorks');
 if(['alisse','aviena'].includes(type)){
  const line=c.materials.find(x=>x.id==='hw_'+type);assert.equal(line.priceBasis,'comparable-allowance');assert.equal(line.cost,null);assert.equal(line.price,type==='alisse'?1000:1200);assert.equal(qty(c,'keypad_qs_mount'),0,'Complete backbox allowance must not be charged twice');
  assert.ok(qty(c,'keypad_qs_cable')>0);assert.ok(c.labor.some(x=>x.id==='keypad_qs'));assert.match(R.html(R.build(s,c)),/estimated equipment allowance/);
  assert.doesNotMatch(R.html(R.build(s,c)),/conservative allowance for standard white decorative trims/);
 }
 cases++;
}
for(const behavior of ['rania','ketra'])for(const adjustable of [false,true])for(const install of ['new','remodel']){
 const s=job('none',install),r=s.rooms[0];if(install==='new')W.preset(r,'open');Object.assign(r.recessGroups[0],{qty:6,behavior,adjustable});r.d2rConditions='suitable';W.synchronize(s);
 const c=M.planning(s);assert.deepEqual(c.issues,[]);assert.ok(M.range(c,s.config));assert.equal(c.missingCosts,0);
 if(install==='new')assert.match(R.html(R.build(s,c)),/complete standard white, flanged assembly allowance/);
 if(install==='remodel'){r.d2rConditions='incompatible';assert.equal(M.range(M.planning(s),s.config),null);}
 cases++;
}
let s=job(),r=s.rooms[0];r.linearFt=10;r.linearBehavior='warm';P.supplement(s,catalog);assert.equal(r.linearBehavior,'lumaris_warm');
r.linearBehavior='warm';Object.assign(s.config.catalog.find(x=>x.id==='linear_warm'),{cost:9,verified:true});P.supplement(s,catalog);assert.equal(r.linearBehavior,'warm','Preserve an explicitly priced conventional tape installation');
for(const id of ['hw_alisse','hw_aviena','fixture_new_rania_fixed','fixture_new_ketra_adj']){
 const row=s.config.catalog.find(x=>x.id===id);Object.assign(row,{cost:null,msrp:null,verified:false});assert.ok(P.supplement(s,catalog).includes(id));
 row.msrp=1234;assert.ok(!P.supplement(s,catalog).includes(id));assert.equal(row.msrp,1234);
}
s=job();r=s.rooms[0];W.accessChoice(r,'attic','yes');r.ceilingFishing='verified';r.wallFishing='verified';r.routeEvidence='Kitchen only';r.fanSupport='verified';r.d2rConditions='suitable';
const second=M.addRoomNamed(s,'Dining room');assert.ok(W.inheritConditions(s,1));assert.equal(second.ceilingPath,'attic');assert.equal(second.surfaceMaterial,'drywall');assert.equal(second.ceilingHeight,'standard');assert.equal(second.occupancy,'occupied');
for(const key of ['ceilingFishing','wallFishing','fanSupport','d2rConditions'])assert.equal(second[key],'unknown');assert.equal(second.routeEvidence,'');
W.accessChoice(second,'surface','plaster');assert.equal(W.inheritConditions(s,1),false);assert.equal(second.surfaceMaterial,'plaster');
const third=M.addRoomNamed(s,'Office');third.specialConditions='masonry';W.inheritConditions(s,2);assert.equal(third.specialConditions,'masonry');
const fourth=M.addRoomNamed(s,'Bedroom');fourth.ceilingPath='closed';assert.equal(W.inheritConditions(s,3),false,'Preserve partially entered access');
r.openingPermission='none';s.rooms=[r,M.room('No cuts')];assert.ok(W.inheritConditions(s,1));assert.equal(s.rooms[1].ceilingPath,'closed','No-cut access to a different room is unproven');
s.rooms[1].recessGroups[0].qty=6;assert.equal(M.range(M.planning(s),s.config),null);
assert.equal(Server.scope(s).rooms[1].conditionsInheritedFrom,'Kitchen');assert.equal(M.validate(JSON.parse(JSON.stringify(s))).rooms[1].conditionsInheritedFrom,'Kitchen');
console.log(`PASS: ${cases} complete tape, keypad and fixture cases; warm-dim hardware parity, controller limits, customer allowance scope, draft pricing, access inheritance and no-cut safeguards.`);

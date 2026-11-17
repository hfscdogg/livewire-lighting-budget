'use strict';
const assert=require('node:assert/strict');
const W=require('./dist/sales-workflow'),M=require('./dist/model'),P=require('./dist/pricing'),Report=require('./dist/customer-report'),catalog=require('./pricing/catalog.json');
function job(){const s=P.apply(M.initial(),catalog);Object.assign(s.project,{system:'RA3',travelBand:'0',sharedPath:'open',scopeReviewed:true});for(const key of Object.keys(s.config).filter(k=>k.endsWith('Reviewed')))s.config[key]=true;const r=M.addRoomNamed(s,'Living room');r.recessGroups[0].qty=6;W.preset(r,'drywall');W.ordinary(r);r.occupancy='occupied';return s;}
const s=job(),r=s.rooms[0];
const c=M.calculate(s);assert.ok(M.range(c,s.config));assert.ok(c.labor.some(line=>line.id==='remove_drywall'&&line.qty>0));assert.ok(c.labor.some(line=>line.id==='occupied_protection'));
// Presets are exactly the same calculation as entering those observed facts individually.
for(const key of Object.keys(W.PRESETS)){const quick=job(),manual=structuredClone(quick);W.preset(quick.rooms[0],key);Object.assign(manual.rooms[0],W.PRESETS[key].facts,{ceilingFishing:'unknown',wallFishing:'unknown',routeEvidence:'',routeReviewed:false});assert.equal(M.calculate(quick).total,M.calculate(manual).total);assert.deepEqual(M.calculate(quick).issues,M.calculate(manual).issues);}
W.preset(r,'noCuts');assert.equal(M.range(M.calculate(s),s.config),null);assert.ok(M.calculate(s).issues.some(i=>i.message.includes('cutting is not permitted')));
Object.assign(r,{ceilingFishing:'verified',wallFishing:'verified',routeEvidence:'Electrician verified this room only',routeReviewed:true,notes:'PRIVATE NOTE',photos:[],routeLength:'long',keypadQSWiring:'existing',shadeQSBackboneExisting:true,fanSupport:'verified',planReference:'Original sheet'});
const copied=W.copyRoom(s,r.id,M.uid);assert.equal(copied.recessGroups[0].qty,6);assert.notEqual(copied.recessGroups[0].id,r.recessGroups[0].id);assert.equal(copied.notes,'');assert.equal(copied.planReference,'');assert.equal(copied.fanSupport,'unknown');assert.equal(copied.ceilingPath,'unknown');assert.equal(copied.routeLength,'long');assert.equal(copied.keypadQSWiring,'new');assert.equal(copied.shadeQSBackboneExisting,false);
W.copyConditions(r,copied);assert.equal(copied.ceilingPath,'closed');assert.equal(copied.openingPermission,'none');assert.equal(copied.ceilingFishing,'unknown');assert.equal(copied.routeEvidence,'');assert.equal(copied.fanSupport,'unknown');assert.equal(M.range(M.calculate(s),s.config),null);
assert.equal(W.reviewGroup({key:'fan_support_'+r.id},s.rooms).layer,'fans');
assert.equal(W.reviewGroup({key:'installation_allowances'},s.rooms).kind,'estimator');
const restored=M.validate(JSON.parse(JSON.stringify(s)));assert.equal(restored.rooms[1].openingPermission,'none');assert.equal(restored.rooms[1].ceilingFishing,'unknown');
const duplicate=structuredClone(s);duplicate.rooms[1].id=duplicate.rooms[0].id;assert.throws(()=>M.validate(duplicate),/Duplicate room identifier/);
const intelligent=job();intelligent.rooms[0].recessGroups[0].behavior='ketra';assert.equal(W.recommendation(intelligent),'HomeWorks');assert.equal(intelligent.project.system,'RA3','A recommendation never silently replaces an existing system');
for(const invalid of [-1,0.5,10001,Infinity,'invalid']){const x=job();x.rooms[0].recessGroups[0].qty=invalid;const result=M.calculate(x);assert.ok(result.issues.some(issue=>issue.key.startsWith('input_')));assert.equal(M.range(result,x.config),null);assert.doesNotMatch(Report.html(Report.build(x,result)),/\$[0-9]/);}
for(const mutate of [x=>x.config.labor.recess_remodel=-1,x=>x.config.currentRate=-112.5,x=>x.config.catalog.find(row=>row.id==='fixture_remodel_warm_fixed').msrp=-1]){const x=job();mutate(x);const result=M.calculate(x);assert.ok(result.issues.some(i=>i.key.startsWith('input_config_')));assert.equal(M.range(result,x.config),null);}
// Deterministic mixed scope stress: every published range must be finite and honor the rounded retainer.
let seed=931,ready=0;const rand=max=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*max);};
for(let i=0;i<180;i++){
 const x=job();x.project.system=['none','RA3','HomeWorks'][rand(3)];x.rooms=[];
 const rooms=1+rand(16);
 for(let j=0;j<rooms;j++){
  const room=M.addRoomNamed(x,'Room '+j);room.recessGroups[0].qty=rand(18);room.recessGroups[0].adjustable=!!rand(2);W.preset(room,['open','drywall','plaster','noCuts'][rand(4)]);W.ordinary(room);room.occupancy=rand(2)?'occupied':'vacant';room.decorExisting=rand(4);room.decorNew=rand(3);
  if(rand(2)){room.linearFt=rand(45)+1;room.linearBehavior='lumaris';}
  if(rand(2)){room.fanQty=1+rand(3);room.fanWork=rand(2)?'new':'replace';room.fanControl='existing';room.fanSupport='replace';}
 }
 const result=M.calculate(x),range=M.range(result,x.config);assert.ok(Number.isFinite(result.total)&&result.total>=0);assert.ok(result.labor.every(line=>line.hours===null||Number.isFinite(line.hours)&&line.hours>=0));
 if(result.issues.length||result.missingCosts)assert.equal(range,null);
 if(range){ready++;assert.ok(range.low>=0&&range.high>=range.low);assert.equal(range.designRetainer,Math.round(range.low*4)/100);}
 const report=Report.html(Report.build(x,result));assert.doesNotMatch(report,/supplier cost|hoursPer|PRIVATE NOTE/);
}
assert.ok(ready>0&&ready<180,'Stress scenarios must include both priced and held cases');
console.log(`PASS: explicit condition presets, no-cut holds, safe room/condition reuse, system recommendations, malformed quantities, duplicate IDs and 180 mixed-scope stress scenarios (${ready} publishable).`);

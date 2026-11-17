'use strict';
const assert=require('node:assert/strict');
const M=require('./dist/model'),W=require('./dist/sales-workflow'),P=require('./dist/pricing'),R=require('./dist/customer-report'),Server=require('./server/estimate');
const catalog=require('./pricing/catalog.json');
function job(){const s=P.apply(M.initial(),catalog);s.project.travelBand='0';s.project.install='remodel';const r=M.addRoomNamed(s,'Kitchen');r.recessGroups[0].qty=6;r.ceilingHeight='standard';return s;}
const totals={};
for(const surface of ['drywall','plaster'])for(const cuts of ['allowed','none'])for(const attic of ['yes','no']){
 const s=job(),r=s.rooms[0];W.accessChoice(r,'surface',surface);W.accessChoice(r,'cuts',cuts);W.accessChoice(r,'attic',attic);W.synchronize(s);
 assert.equal(r.surfaceMaterial,surface);assert.equal(r.wallPath,'closed');assert.equal(r.ceilingPath,attic==='yes'?'attic':'closed');
 assert.equal(r.specialConditions,'standard');assert.equal(r.constructionAssumed,true);assert.equal(r.routeReviewed,false);
 const c=M.planning(s);totals[[surface,cuts,attic]]=c.total;
 if(cuts==='allowed'){
  assert.ok(M.range(c,s.config),JSON.stringify(c.issues));
  assert.ok(c.labor.some(x=>x.id===(surface==='plaster'?'remove_plaster':'remove_drywall')),'Surface-specific access removal must remain in the estimate');
 }else{
  assert.equal(M.range(c,s.config),null,'An attic does not approve a concealed wall route');
  assert.deepEqual(W.noCutSegments(r,c.routes).filter(x=>x.status==='hold').map(x=>x.kind).sort(),attic==='yes'?['wall']:['ceiling','wall']);
  r.wallFishing='verified';r.ceilingFishing='verified';r.routeEvidence='Installer checked the required wall and ceiling routes';
  assert.ok(M.range(M.planning(s),s.config),'Confirmed viable route can be budgeted');
  r.wallFishing='blocked';assert.equal(M.range(M.planning(s),s.config),null,'Blocked route never inherits a positive allowance');
 }
 assert.match(R.html(R.build(s,c)),/assumes ordinary framing/);
 const saved=M.validate(JSON.parse(JSON.stringify(s)));assert.equal(saved.rooms[0].constructionAssumed,true);
 assert.equal(Server.scope(s).rooms[0].constructionAssumed,true);
}
for(const surface of ['drywall','plaster'])assert.ok(totals[[surface,'allowed','yes']]<totals[[surface,'allowed','no']],'An attic reduces ceiling access labor');
for(const attic of ['yes','no'])assert.ok(totals[['plaster','allowed',attic]]>totals[['drywall','allowed',attic]],'Plaster carries more removal labor');
let s=job(),r=s.rooms[0];W.accessChoice(r,'surface','open');assert.ok(M.range(M.planning(s),s.config));
assert.equal(r.openingPermission,'extensive');assert.equal(r.ceilingPath,'open');assert.equal(r.wallPath,'open');
W.accessChoice(r,'surface','plaster');assert.equal(r.openingPermission,'unknown','Open-framing permission is not permission to cut a finished plaster surface');
assert.equal(M.range(M.planning(s),s.config),null);
W.accessChoice(r,'cuts','none');W.accessChoice(r,'attic','yes');W.accessChoice(r,'surface','drywall');assert.equal(r.ceilingPath,'attic');assert.equal(r.openingPermission,'none');
r.wallFishing='verified';r.routeEvidence='Original room survey';W.accessChoice(r,'attic','no');assert.equal(r.wallFishing,'unknown');assert.equal(r.routeEvidence,'');
// A different surface must never clear an observed special condition or access restriction.
r.specialConditions='masonry';r.access='difficult';W.accessChoice(r,'surface','plaster');assert.equal(r.specialConditions,'masonry');assert.equal(r.access,'difficult');
assert.equal(M.range(M.planning(s),s.config),null);
const target=M.room('Another room');W.copyConditions(r,target);assert.equal(target.surfaceMaterial,'plaster');assert.equal(target.ceilingFishing,'unknown');assert.equal(target.routeEvidence,'');
const legacy={...r};delete legacy.installOverride;assert.equal(M.normalizeRoom(legacy).installOverride,true,'Legacy room work type remains explicit');
console.log('PASS: all eight finished-surface/access combinations, open framing, removal and pull labor, no-cut holds, changed-choice evidence invalidation, special conditions and save/server preservation.');

'use strict';
const assert=require('node:assert/strict');
const M=require('./dist/model'),P=require('./dist/pricing'),W=require('./dist/sales-workflow'),H=require('./dist/estimator-report'),C=require('./dist/customer-report'),Server=require('./server/estimate');
const catalog=require('./pricing/catalog.json');
function job(surface='drywall',behavior='ketra',adjustable=false){
 const s=P.apply(M.initial(),catalog);s.project.travelBand='0';s.project.name='Estimator handoff test';
 const r=M.addRoomNamed(s,'Living room');W.preset(r,surface);W.ordinary(r);Object.assign(r.recessGroups[0],{qty:6,behavior,adjustable});W.synchronize(s);return s;
}
let count=0;
for(const surface of ['open','drywall','plaster'])for(const behavior of ['rania','ketra'])for(const adjustable of [false,true])for(const unchecked of ['unknown',undefined,null,'',false]){
 const s=job(surface,behavior,adjustable);s.rooms[0].d2rConditions=unchecked;
 const local=M.validate(JSON.parse(JSON.stringify(s))),shared=Server.scope(s);
 assert.equal(local.rooms[0].d2rConditions,'unknown');assert.equal(shared.rooms[0].d2rConditions,'unknown');
 const c=M.planning(local),range=M.range(c,local.config);assert.ok(range,JSON.stringify(c.issues));
 assert.ok(!W.requirements(local,c).some(x=>x.key.startsWith('d2')));
 const handoff=H.build(local,c),hosted=Server.estimatorReport(shared,catalog);
 assert.deepEqual(handoff.range,range);assert.deepEqual(hosted.range,range);assert.equal(handoff.rooms[0].followUps.length,1);
 assert.match(handoff.rooms[0].followUps[0],surface==='open'?/D2 fixtures/:/D2R fixtures/);
 const strict=M.calculate(local);strict.issues.push({key:'d2r_site_'+local.rooms[0].id,message:'Legacy ceiling compatibility review'});
 assert.ok(M.range(M.planning(local,strict),local.config),'An older review-only issue cannot reinstate the ceiling hold');
 local.rooms[0].d2rConditions='suitable';assert.equal(M.planning(local).total,c.total,'An unchecked ceiling must not reduce the takeoff');
 count++;
}
{
 const s=job();s.rooms[0].d2rConditions='incompatible';const c=M.planning(s);
 assert.equal(M.range(c,s.config),null);assert.equal(H.build(s,c).range,null);assert.ok(W.requirements(s,c).some(x=>x.kind==='site'));
 s.rooms[0].d2rConditions='unknown';W.preset(s.rooms[0],'noCuts');assert.equal(M.range(M.planning(s),s.config),null,'A ceiling note does not authorize inaccessible new wiring');
}
{
 const s=job(),r=s.rooms[0];r.notes='PRIVATE <script>alert(1)</script>\nSecond line & client preference';
 r.photos=[{id:'test-photo',name:'PRIVATE <image>.jpg',data:'data:image/jpeg;base64,/9j/2Q=='}];
 r.linearFt=8;r.linearBehavior='lumaris_warm';r.decorExisting=2;r.fanQty=1;r.fanWork='replace';
 r.existingDimmers=2;r.existingSwitches=1;W.chooseControls(r,'keypads');W.chooseDesign(r,'sunnata');
 const shade=M.Shade.group(M.uid);Object.assign(shade,{qty:2,widthFt:4,heightFt:6,power:'battery'});r.shadeGroups.push(shade);
 const second=M.addRoomNamed(s,'Second room');W.preset(second,'open');W.ordinary(second);second.recessGroups[0].qty=3;
 const archived=M.room('Archived discussion','remodel');archived.notes='Archived private note';archived.photos=[{...r.photos[0],id:'archived-photo'}];s.archivedRooms=[archived];
 W.synchronize(s);const c=M.planning(s),d=H.build(s,c),html=H.html(d);
 assert.ok(d.range);assert.equal(d.range.designRetainer,Math.round(d.range.low*4)/100);
 assert.equal(d.rooms.length,2);assert.equal(d.archivedRooms.length,1);
 assert.equal(d.rooms[0].selections.length,7,'Every selected work category is retained');
 assert.ok(d.rooms[0].materials.some(x=>/Ketra/.test(x.name)));assert.ok(d.rooms[0].labor.length);
 assert.ok(d.sharedMaterials.some(x=>/processor/i.test(x.name)));
 assert.ok(Math.abs(d.rooms.flatMap(x=>x.labor).concat(d.sharedLabor).reduce((sum,x)=>sum+(x.hours||0),0)-c.knownHours)<0.00001,'Consolidating rows preserves all labor hours');
 assert.match(html,/INTERNAL COMPANY DOCUMENT/);assert.match(html,/Room notes/);assert.match(html,/Room photos/);
 assert.match(html,/No room notes recorded/);assert.match(html,/No photos attached/);
 assert.match(html,/PRIVATE &lt;script&gt;/);assert.doesNotMatch(html,/<script>|<image>/);
 assert.equal((html.match(/<img /g)||[]).length,2);assert.match(html,/ARCHIVED ROOM - EXCLUDED/);
 assert.match(html,/not added to the budget/);assert.doesNotMatch(C.html(C.build(s,c)),/PRIVATE|Second line|Archived private|base64|insulation separation/);
 const reopened=M.validate(JSON.parse(JSON.stringify(s)));assert.deepEqual(H.build(reopened,M.planning(reopened)).rooms[0].photos,d.rooms[0].photos);
 r.photos[0].data='https://external.invalid/tracker';assert.throws(()=>H.build(s,c),/photo is invalid/);
}
console.log(`PASS: ${count} unchecked D2/D2R cases, blank legacy checks, nonblocking ceiling notes, real access holds, complete estimator handoff and customer privacy.`);

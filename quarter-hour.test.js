'use strict';
const assert=require('node:assert/strict'),M=require('./dist/model'),P=require('./dist/pricing'),W=require('./dist/sales-workflow'),H=require('./dist/estimator-report');
const catalog=require('./pricing/catalog.json');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const [input,expected]of [[0,0],[.000001,.25],[.25,.25],[.250001,.5],[.9,1],[1,1],[1.01,1.25],[1.25+Number.EPSILON,1.25],[10/60,.25],[null,null]])assert.equal(M.quarterHours(input),expected);
function job(system='HomeWorks'){
 const s=P.apply(M.initial(),catalog);s.project.system=s.project.systemRequested=system;s.project.travelBand='1';s.project.networkPlan='existing';
 const r=M.addRoomNamed(s,'Living room');W.preset(r,'drywall');W.ordinary(r);r.occupancy='occupied';r.recessGroups[0].qty=2;r.recessGroups[0].behavior=system==='HomeWorks'?'ketra':'warm';W.synchronize(s);return s;
}
let scenarios=0;
for(const count of [1,2,7,99,101,251,501])for(const access of ['normal','limited','difficult']){
 const s=job(),r=s.rooms[0];r.recessGroups[0].qty=count;r.access=access;
 const result=M.planning(s),raw=structuredClone(s);raw.config.laborRevision=9;const previous=M.planning(raw);
 for(const row of result.labor){if(row.hours===null)continue;
  assert.equal(Number.isInteger(row.hours*4),true,row.id);assert.ok(row.hours>=row.rawHours-1e-9,row.id);
  assert.ok(row.hours-row.rawHours<.25+1e-9,row.id);close(row.cost,row.hours*result.rate);
 }
 const wire=result.labor.find(row=>row.id==='branch_run');assert.ok(wire.qty>=50);assert.ok(wire.hours<wire.qty*.25,'Do not round every foot separately');
 assert.equal(result.programming.totalHours,result.labor.filter(row=>row.id.startsWith('program_')).reduce((a,row)=>a+row.hours,0));
 assert.equal(result.knownHours,result.labor.reduce((a,row)=>a+row.hours,0));
 assert.ok(result.knownHours>=previous.knownHours);
 assert.equal(result.days,Math.max(result.plannedVisits,Math.ceil(result.knownSiteHours/16)));
 const handoff=H.build(s,result);assert.equal(handoff.hours,result.knownHours);assert.equal(handoff.programmingHours,result.programming.totalHours);scenarios++;
}
// Two lights share a single task quantity: 20 minutes rounds to 30, not 15 each plus another rounding charge.
{
 const s=job(),c=M.planning(s);assert.equal(c.programming.totalHours,2);
 assert.equal(c.labor.find(row=>row.id==='program_intelligent').hours,.5);
 const saved=M.validate(JSON.parse(JSON.stringify(s)));assert.deepEqual(M.range(M.planning(saved),saved.config),M.range(c,s.config));
 const old=structuredClone(s);old.config.laborRevision=9;old.config.labor.recess_remodel=1.17;
 const migrated=M.validate(old);assert.equal(migrated.config.laborRevision,10);assert.equal(migrated.config.labor.recess_remodel,1.17);assert.match(migrated.laborUpdateNotice,/quarter-hours/);
 const release=P.make({...s,config:{...s.config,laborRevision:9}},'historical-r9','2026-11-17');assert.equal(P.validate(release).settings.laborRevision,9);
 s.config.labor.program_intelligent=null;const missing=M.planning(s);assert.equal(missing.programming.totalHours,null);assert.equal(M.range(missing,s.config),null);
}
// Rounding feeds travel days; no charge is created by an explicitly zero task.
{
 const s=job('none');for(const id of Object.keys(s.config.labor))s.config.labor[id]=0;
 s.config.labor.site_setup=15.9;s.config.labor.extra_visit_setup=.15;
 let c=M.planning(s);assert.equal(c.knownSiteHours,16);assert.equal(c.days,1);
 s.config.labor.site_setup=16.01;c=M.planning(s);assert.equal(c.knownSiteHours,16.5);assert.equal(c.days,2);assert.equal(c.travel,240);
 s.config.siteVisitsOverride=10;s.config.labor.extra_visit_setup=.1;c=M.planning(s);
 assert.equal(c.labor.find(row=>row.id==='extra_visit_setup').hours,1);assert.equal(c.days,10);
}
// Historical shade packages cover their rounded base labor; charge only the rounded difference.
{
 const s=job('HomeWorks'),r=s.rooms[0];r.recessGroups[0].qty=0;r.keypadQty=0;
 r.shadeGroups=[{...M.Shade.group(M.uid),family:'sivoia',power:'wired',communication:'wired',qty:1,widthFt:4,heightFt:5}];
 s.config.shippingHandling=false;r.ceilingPath=r.wallPath='open';s.project.sharedPath='open';
 const c=M.calculate(s),covered=c.labor.filter(row=>row.coveredBaseCost!==undefined);
 assert.ok(covered.length);for(const row of covered){assert.equal(row.cost,0);assert.equal(row.hours,row.roundedBaseHours);assert.equal(Number.isInteger(row.hours*4),true);}
 r.wallPath='closed';r.openingPermission='none';r.wallFishing='verified';r.routeEvidence='Verified concealed route';
 for(const row of M.calculate(s).labor.filter(row=>row.coveredBaseCost!==undefined)){close(row.cost,Math.max(0,row.hours-row.roundedBaseHours)*row.rate);assert.equal(Number.isInteger((row.hours-row.roundedBaseHours)*4),true);}
}
// The hosted summary must preserve quarter-hour display, not format 18.25 as 18.3.
{
 const vm=require('node:vm'),fs=require('node:fs'),Server=require('./server/estimate');
 const context=vm.createContext({window:{},document:{getElementById:()=>({})},Intl,Map,Set,URLSearchParams});
 const source=fs.readFileSync('server/shared.js','utf8').replace('let bootstrap;','let bootstrap={user:{role:"sales"}};');
 vm.runInContext(source,context);
 const s=job(),result=Server.calculate(Server.scope(s),catalog);result.release=catalog.catalogVersion;
 result.summary.plan.personHours=18.25;
 const html=context.window.LivewireShared.budget(s,result,'');
 assert.match(html,/18\.25 preliminary person-hours/);assert.doesNotMatch(html,/18\.3 preliminary person-hours/);
 assert.match(html,/rounds up to the next quarter-hour/);
}
console.log(`PASS: quarter-hour boundaries, ${scenarios} size/access cases, calculated prices, programming totals, travel thresholds, historical shade credits, migration and report consistency.`);

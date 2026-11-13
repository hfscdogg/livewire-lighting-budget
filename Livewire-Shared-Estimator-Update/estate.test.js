const assert=require('node:assert/strict');
const M=require('./dist/model');
const P=require('./dist/pricing');
const Report=require('./dist/customer-report');
const S=require('./server/estimate');
const catalog=P.validate(require('./pricing/catalog.json'));
const reviewed=['designReviewed','electricalReviewed','loadCompatibilityReviewed','linearRunsReviewed','qsPowerReviewed','centralCapacityReviewed','networkReviewed','siteConditionsReviewed','shadeScopeReviewed','shadePowerReviewed','shadeMountReviewed'];
function room(s,name,qty,opts={}){const r=M.addRoomNamed(s,name);Object.assign(r,{surfaceMaterial:'drywall',surfaceAccess:'accessible'},opts);Object.assign(r,{ceilingPath:r.surfaceAccess==='open'?'open':r.surfaceAccess==='accessible'?'attic':'closed',wallPath:r.surfaceAccess==='open'?'open':r.surfaceAccess==='accessible'?'accessible':'closed',openingPermission:r.surfaceAccess==='removable'?'selective':'none',occupancy:'vacant',ceilingHeight:'standard',specialConditions:'standard'});r.recessGroups[0].qty=qty;return r;}
function qty(c,id){return c.materials.filter(x=>x.id===id).reduce((a,x)=>a+(x.qty||0),0);}
function hours(c,id){return c.labor.filter(x=>x.id===id).reduce((a,x)=>a+x.hours,0);}
function report(s,c){return Report.build(s,c);}
function setup(system,install='remodel'){
 const s=P.apply(M.initial(),catalog);
 Object.assign(s.project,{system,install,sharedPath:'open',systemPlan:'new',travelBand:'1',networkPlan:'new',scopeReviewed:true});
 for(const k of reviewed)s.config[k]=true;
 return s;
}
function priceShade(s,r,opts={}){
 const shade={...M.Shade.group(M.uid),widthFt:5,heightFt:6,...opts};r.shadeGroups.push(shade);
 (s.config.offlineShadePrices??={})[shade.id]={scope:M.Shade.quoteSignature(shade),low:1550,high:1550};
 return shade;
}
const ra3=setup('RA3');
for(let i=0;i<40;i++){
 const r=room(ra3,'Wing '+(i%4+1)+' Room '+(i+1),8,{surfaceAccess:i%2?'removable':'accessible',access:i%3?'normal':'limited',linearFt:12,linearBehavior:'lumaris',linearSections:'5, 7',controlLocations:2});
 priceShade(ra3,r,{qty:2});
}
ra3.config.ra3CoverageProcessors=3;ra3.config.ra3Repeaters=5;
let c=M.calculate(ra3);
assert.deepEqual(c.issues,[]);assert.equal(c.missingCosts,0);assert.equal(c.typeX,160);assert.equal(c.typeA,80);assert.equal(c.processors,3);
assert.equal(qty(c,'ra3_processor'),3);assert.equal(qty(c,'control_poe'),0);assert.equal(qty(c,'driver_lumaris'),40);assert.equal(qty(c,'RA3_dimmer_companion'),40);assert.equal(c.shades.count,80);
assert.ok(hours(c,'remove_drywall')>0);assert.ok(hours(c,'extra_visit_setup')>0);assert.ok(M.range(c,ra3.config));
console.log('40-room RadioRA 3 estate',JSON.stringify({x:c.typeX,a:c.typeA,processors:c.processors,shades:c.shades.count,personHours:Math.round(c.knownHours),crewDays:c.days}));
const ra3Stress=structuredClone(ra3);
for(let i=0;i<41;i++)room(ra3Stress,'Wireless addition '+i,1);
c=M.calculate(ra3Stress);assert.equal(c.typeX,201);assert.equal(c.needsHomeWorks,true);assert.equal(report(ra3Stress,c).range,null);
console.log('201 Type X devices held for platform review');
const home=setup('HomeWorks','new');
Object.assign(home.config,{hwArchitecture:'dual',hwCoverageDualProcessors:2,processorLocation:'panel'});
for(let i=0;i<32;i++){
 const r=room(home,'HomeWorks Room '+(i+1),10,{keypadType:'seetouch',keypadQty:1,loadTopology:'centralized',panelGroup:'Level '+(i%4+1),surfaceMaterial:'open',surfaceAccess:'open',linearFt:12,linearBehavior:'lumaris',shadePowerLocation:'Shade panel '+(i%4+1)});
 r.recessGroups.push({...M.recessGroup(),qty:4,adjustable:true,zone:'separate'});
 priceShade(home,r,{family:'sivoia',power:'wired',communication:'wired',qty:2});
 if(i%4===0)priceShade(home,r,{family:'triathlon',power:'wired',qty:2});
}
c=M.calculate(home);
assert.deepEqual(c.issues,[]);assert.equal(c.missingCosts,0);assert.equal(c.centralLoadCount,64);assert.equal(c.panelCount,4);assert.equal(c.moduleCount,16);
assert.equal(c.wiredProcessors,1);assert.equal(c.dualProcessors,2);assert.equal(qty(c,'shade_35v_supply'),8);assert.equal(qty(c,'shade_12v_supply'),2);assert.equal(qty(c,'shade_12v_cable'),1200);assert.equal(qty(c,'hw_control_enclosure'),0);assert.equal(c.shades.count,80);assert.ok(M.range(c,home.config));
const text=Report.html(report(home,c));assert.doesNotMatch(text,/M4NCRS|PD4-42T|QSPS-10PNL|person-hours|materialCost|supplier price/);assert.match(text,/Design retainer/);
console.log('32-room HomeWorks estate',JSON.stringify({panels:c.panelCount,modules:c.moduleCount,wiredProcessors:c.wiredProcessors,wirelessProcessors:c.dualProcessors,shades:c.shades.count,personHours:Math.round(c.knownHours),crewDays:c.days}));
const extended=structuredClone(home);extended.project.systemPlan='existing';assert.equal(M.range(M.calculate(extended),extended.config),null);
const unsupported=structuredClone(home);unsupported.rooms[0].recessGroups[0].behavior='ketra';assert.equal(M.range(M.calculate(unsupported),unsupported.config),null);
const long=setup('none');const drywall=room(long,'Drywall',4,{surfaceAccess:'removable',routeLength:'long',access:'difficult'});const plaster=room(long,'Plaster',4,{surfaceMaterial:'plaster',surfaceAccess:'removable',routeLength:'long'});const base=M.calculate(long);assert.ok(base.issues.some(x=>x.key.startsWith('route_long')));for(const r of long.rooms)r.routeReviewed=true;long.config.roomRoutes={[drywall.id]:2,[plaster.id]:2};
c=M.calculate(long);assert.equal(qty(c,'lighting_branch_cable'),320);assert.ok(hours(c,'remove_drywall')>0);assert.ok(hours(c,'remove_plaster')>0);assert.ok(hours(c,'plaster_cut')>0);assert.ok(!c.labor.some(row=>/patch|paint/.test(row.id)));assert.ok(M.range(c,long.config));
const bad=structuredClone(home);bad.rooms[0].shadeGroups[0].widthFt=null;assert.ok(M.calculate(bad).issues.some(x=>x.key.startsWith('shade_dimensions_')));bad.rooms[0].shadeGroups[0].id=bad.rooms[1].shadeGroups[0].id;assert.throws(()=>S.scope(bad),/Shade group identifiers/);
assert.throws(()=>S.reviewPrices(S.scope(long),{roomRoutes:{[drywall.id]:-2}},false),/route multiplier/);
console.log('Long-route review, drywall/plaster removal, invalid dimensions, duplicate IDs and unsupported-scope holds passed.');

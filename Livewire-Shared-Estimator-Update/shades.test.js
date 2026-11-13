const assert=require('node:assert/strict'),M=require('./dist/model'),S=M.Shade,P=require('./dist/pricing'),Sheet=require('./dist/spreadsheet'),R=require('./dist/customer-report');
const make=(sys='none')=>{const s=M.initial();s.project.system=sys;s.project.travelBand='1';s.rooms=[M.room('Living room','remodel')];Object.assign(s.rooms[0],{surfaceMaterial:'drywall',surfaceAccess:'accessible',wallPath:'open'});return s;};
const add=(s,x={})=>{const g={...S.group(M.uid),widthFt:4,heightFt:5,...x};s.rooms[0].shadeGroups.push(g);return g;};
const qty=(c,id)=>c.materials.filter(x=>x.id===id).reduce((a,x)=>a+x.qty,0),tasks=(c,id)=>c.labor.filter(x=>x.id===id),allow=(c,label)=>c.shades.rows.filter(x=>x.name.includes(label));
let s=make();add(s,{qty:3});let c=M.calculate(s);assert.equal(c.shades.count,3);assert.equal(c.shades.knownLow,2400);assert.equal(c.shades.knownHigh,5100);assert.equal(c.processors,0);assert.equal(qty(c,'shade_pico'),1);assert.equal(tasks(c,'shade_install')[0].hours,6);assert.equal(c.plannedVisits,2);assert.equal(c.travel,240);assert.equal(c.shades.qs,0);assert.equal(c.typeA,0);assert.equal(allow(c,'35 V').length,0);assert.equal(qty(c,'none_dimmer'),0);assert.equal(M.emptyRoom(s.rooms[0]),false);
assert.equal(S.lookup({family:'triathlon',style:'roller',widthFt:3,heightFt:5},s.config).low,700);assert.equal(S.lookup({family:'triathlon',style:'roller',widthFt:3.01,heightFt:5},s.config).low,800);assert.equal(S.lookup({family:'triathlon',style:'roller',widthFt:9.01,heightFt:5},s.config),null);assert.equal(S.lookup({family:'triathlon',style:'drapery',widthFt:3,heightFt:5},s.config),null);
s=make('RA3');add(s,{qty:95});c=M.calculate(s);assert.equal(c.typeA,95);assert.equal(c.typeX,0);assert.equal(c.processors,1);s.rooms[0].shadeGroups[0].qty=96;c=M.calculate(s);assert.equal(c.processors,2);s.rooms[0].shadeGroups[0].qty=191;c=M.calculate(s);assert.ok(c.issues.some(x=>x.key==='ra3_capacity'));
s=make('HomeWorks');s.config.hwArchitecture='dual';add(s,{family:'sivoia',power:'wired',qty:6});add(s,{family:'palladiom',power:'wired',qty:5});c=M.calculate(s);assert.equal(c.shades.qs,11);assert.equal(c.qsDevices,11);assert.equal(c.wiredProcessors,1);assert.equal(c.dualProcessors,1);assert.equal(c.moduleCount,0);assert.equal(allow(c,'35 V')[0].qty,2);assert.equal(allow(c,'Wired shade route').reduce((a,x)=>a+x.low,0),2200);assert.equal(tasks(c,'shade_wire').reduce((a,x)=>a+x.cost,0),0);assert.ok(Math.abs(tasks(c,'shade_wire').reduce((a,x)=>a+x.hours,0)-28.875)<1e-8);assert.equal(tasks(c,'shade_power_pack')[0].cost,0);assert.ok(c.issues.some(x=>x.key==='shade_tax_wireMaterialShare'));assert.ok(c.issues.some(x=>x.key==='shade_tax_powerMaterialShare'));assert.equal(qty(c,'keypad_qs_power'),0);assert.equal(qty(c,'RA3_dimmer'),0);assert.equal(qty(c,'HomeWorks_dimmer'),0);
s.rooms[0].surfaceAccess='obstructed';s.rooms[0].surfaceMaterial='plaster';Object.assign(s.rooms[0],{wallPath:'closed',openingPermission:'none',wallFishing:'verified',routeEvidence:'Test observed wall route'});c=M.calculate(s);assert.ok(tasks(c,'shade_wire').every(x=>x.factor===2.25));assert.ok(Math.abs(tasks(c,'shade_wire').reduce((a,x)=>a+x.cost,0)-28.875*1.25*112.5)<1e-8);
s=make('HomeWorks');s.config.hwArchitecture='qsx';add(s,{qty:3});c=M.calculate(s);assert.equal(c.typeA,3);assert.equal(qty(c,'hw_type_a_repeater'),1);assert.equal(c.wiredProcessors,1);assert.equal(c.gateways,0);assert.equal(c.qsDevices,0);
s=make('HomeWorks');s.config.hwArchitecture='dual';add(s,{qty:96});c=M.calculate(s);assert.equal(c.dualProcessors,2);assert.equal(c.wiredProcessors,0);assert.equal(qty(c,'hw_type_a_repeater'),0);
s=make('RA3');add(s,{family:'palladiom',power:'battery',qty:2});c=M.calculate(s);assert.equal(c.shades.count,2);assert.equal(c.typeA,2);assert.equal(allow(c,'35 V').length,0);assert.equal(tasks(c,'shade_wire').length,0);
s=make('RA3');add(s,{family:'triathlon',power:'wired',qty:11});c=M.calculate(s);assert.equal(qty(c,'shade_12v_supply'),2);assert.equal(qty(c,'shade_12v_cable'),825);assert.equal(allow(c,'35 V').length,0);assert.ok(tasks(c,'shade_wire')[0].cost>0);assert.equal(c.shades.packageSell,0);
s=make('RA3');add(s,{family:'sivoia',power:'wired',qty:2});c=M.calculate(s);assert.equal(c.typeA,2);assert.equal(qty(c,'shade_rf_receiver'),2);s.config.shadeReceiversIncluded=true;assert.equal(qty(M.calculate(s),'shade_rf_receiver'),0);
s=make();add(s,{family:'sivoia',power:'battery'});c=M.calculate(s);assert.ok(c.issues.some(x=>x.key.startsWith('shade_power_invalid_')));assert.equal(M.range(c,s.config),null);
s=make();add(s,{style:'roman',widthFt:10});c=M.calculate(s);assert.equal(c.shades.unmatched,1);assert.equal(c.shades.knownLow,0);assert.ok(c.issues.some(x=>x.key.startsWith('shade_specialty_')));
s=make('RA3');add(s,{family:'palladiom',power:'existing',qty:2});c=M.calculate(s);assert.equal(allow(c,'35 V').length,0);assert.equal(allow(c,'Wired shade route').length,0);assert.equal(tasks(c,'shade_power_check')[0].hours,.7);
s=make('RA3');add(s,{layers:2,qty:2});c=M.calculate(s);assert.equal(c.shades.count,4);assert.equal(c.shades.openings,2);assert.equal(c.typeA,4);assert.equal(tasks(c,'shade_measure')[0].qty,2);assert.equal(tasks(c,'shade_install')[0].qty,4);assert.equal(qty(c,'ra3_processor'),1);
s=make();add(s,{name:'SECRET_SHADE_NAME',qty:2});s.project.notes='SECRET_COST';s.config.shadeLow.triathlon_60_60=1234;let doc=R.html(R.build(s,M.calculate(s)));assert.ok(doc.includes('2 Triathlon roller shade'));assert.ok(!doc.includes('SECRET_SHADE_NAME'));assert.ok(!doc.includes('1234'));assert.ok(!doc.includes('SECRET_COST'));assert.ok(doc.includes('Budget pending'));
let back=M.validate(JSON.parse(JSON.stringify(s)));assert.deepEqual(back.rooms[0].shadeGroups,s.rooms[0].shadeGroups);let legacy=M.initial();delete legacy.rooms;legacy.rooms=[{...M.room('Old room')}];delete legacy.rooms[0].shadeGroups;delete legacy.config.shadeLow;delete legacy.config.shadeHigh;delete legacy.config.shadeAllowances;back=M.validate(legacy);assert.deepEqual(back.rooms[0].shadeGroups,[]);assert.equal(Object.keys(back.config.shadeLow).length,36);
let pack=P.make(s,'shade-test','2026-11-11');let csv=Sheet.csv(Sheet.rows(s));assert.deepEqual(Sheet.importCSV(csv,s).settings,pack.settings);assert.equal(pack.modelRevision,13);const applied=P.apply(s,pack);assert.equal(applied.config.shadeScopeReviewed,false);assert.equal(applied.config.shadePowerReviewed,false);
console.log('PASS: shade budget grids, known ranges/no second margin, RF/QS capacity, shared headends, voltage/power separation, package/labor dedup, conditions, dimensions/specialty gates, crew travel, persistence and PDF privacy.');

s = make('RA3');
add(s, { family: 'palladiom_wired', power: 'wired' });
c = M.calculate(s);
assert.ok(c.issues.some(x => x.key.startsWith('shade_qs_system_')));
s = make('HomeWorks');
add(s, { family: 'palladiom_wirefree', power: 'wired', qty: 2, widthFt: 1.5 });
c = M.calculate(s);
assert.equal(c.shades.rf, 2);
assert.equal(c.shades.qs, 0);
assert.equal(qty(c, 'shade_rf_receiver'), 2);
assert.ok(c.issues.some(x => x.key.startsWith('shade_size_min_')));

{
  const job = M.initial();
  job.project.travelBand = '0';
  const room = M.addRoomNamed(job,'Living room');
  const group = {...M.Shade.group(M.uid),widthFt:4,heightFt:5,qty:2};
  room.shadeGroups.push(group);
  job.config.offlineShadePrices = {[group.id]:{low:1000,high:1300,scope:M.Shade.quoteSignature(group)}};
  const priced = M.calculate(job);
  assert.equal(priced.shades.productLow,2000);
  assert.equal(priced.shades.productHigh,2600);
  group.widthFt = 5.5;
  assert.equal(M.calculate(job).shades.productLow, 2*M.Shade.lookup(group,job.config).low);
  assert.equal(Object.hasOwn(P.make(job,'test','2026-11-11').settings,'offlineShadePrices'),false);
}

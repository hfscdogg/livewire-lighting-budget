const assert=require('node:assert/strict'),M=require('./dist/model'),P=require('./dist/pricing');
const clone=x=>JSON.parse(JSON.stringify(x));const s=M.initial();s.project.name='Example private project';s.project.scopeReviewed=true;s.rooms=[M.room('Living room')];s.rooms[0].recessGroups[0].qty=8;s.config.designReviewed=true;const original=JSON.stringify(s),p=P.make(s,'2026.11.10','2026-11-10');assert.ok(!JSON.stringify(p).includes('Example private project'));assert.ok(!('designReviewed'in p.settings));assert.equal(JSON.stringify(s),original);p.settings.catalog.find(x=>x.id==='fixture_remodel_warm_fixed').cost=65;const v=P.preview(s,p);assert.equal(JSON.stringify(s),original);assert.ok(v.after.total>v.before.total);assert.equal(v.next.project.name,s.project.name);assert.equal(v.next.project.scopeReviewed,false);assert.equal(v.next.config.designReviewed,false);assert.equal(v.next.pricingMeta.version,'2026.11.10');assert.equal(v.next.config.hwArchitecture,s.config.hwArchitecture);assert.equal(v.next.rooms[0].recessGroups[0].qty,8);assert.deepEqual(M.validate(clone(v.next)).config,v.next.config);assert.deepEqual(P.validate(clone(p)),p);
for(const mutate of [x=>x.currency='EUR',x=>x.schemaVersion=99,x=>x.modelRevision=7,x=>x.settings.catalog.pop(),x=>x.settings.catalog[1].id=x.settings.catalog[0].id,x=>x.settings.catalog[0].cost=-1,x=>x.settings.catalog[0].cost='100',x=>x.settings.catalog[0].cost=Infinity,x=>x.settings.catalog[0].unit='yards',x=>x.settings.catalog[0].pricing='markup',x=>x.settings.smallMargin=100,x=>x.settings.labor.design='1',x=>x.settings.laborOnsite.design='false',x=>x.settings.timezone='UTC',x=>x.effectiveAt='2026-02-30',x=>x.catalogVersion='',x=>x.settings.catalog[0].verified='yes']){const a=clone(p);mutate(a);assert.throws(()=>P.validate(a));}
const hostile=JSON.parse(JSON.stringify(p).replace('"settings":{','"settings":{"__proto__":{},'));assert.throws(()=>P.validate(hostile));assert.equal({}.polluted,undefined);
const valid=P.make(M.initial(),'draft-1','2027-01-01');assert.equal(valid.settings.catalog[0].cost,null);const blank=P.apply(M.initial(),valid);assert.equal(blank.rooms.length,0);assert.equal(blank.config.catalog[0].cost,null);
console.log('PASS: versioned company price-list validation, project isolation, snapshot roundtrip, explicit preview/reprice, cleared review approvals, unchanged room scope, null prices and rejected malformed imports.');

{const old=M.initial();old.config.catalog.push({...old.config.catalog[0],id:"retired_example"});old.config.labor.retired_example=5;const packed=P.make(old,"legacy-clean","2026-11-10");assert.equal(packed.settings.catalog.length,M.initial().config.catalog.length);assert.ok(!("retired_example" in packed.settings.labor));assert.equal(old.config.catalog.length,M.initial().config.catalog.length+1);}

{
  const state = M.initial();
  const current = P.make(state, 'migration-test', '2026-11-11');
  const older = { ...current, modelRevision: 9, settings: { ...current.settings, catalog: current.settings.catalog.filter(row => !M.LUMARIS_ADDED_ROWS.includes(row.id)) } };
  Object.assign(older.settings.catalog.find(row => row.id === 'driver_lumaris'), { sku: 'HWL-TWC-WH', system: 'HomeWorks', cost: 123.45, verified: true });
  const migrated = P.validate(older);
  assert.equal(migrated.modelRevision, 13);
  assert.equal(migrated.settings.catalog.find(row => row.id === 'driver_lumaris_hw').cost, 123.45);
  assert.equal(migrated.settings.catalog.find(row => row.id === 'driver_lumaris').cost, null);
}

{
  const Sheet = require('./dist/spreadsheet');
  const Report = require('./dist/customer-report');
  const state = M.initial();
  Object.assign(state.project, { travelBand: '0', scopeReviewed: true, permitAllowance: 100 });
  const room = M.addRoomNamed(state, 'Kitchen');
  Object.assign(room, { surfaceMaterial: 'drywall', surfaceAccess: 'accessible', install: 'retrofit',occupancy:'vacant',ceilingHeight:'standard',specialConditions:'standard' });
  room.recessGroups[0].qty = 1;
  Object.assign(state.config, { shippingHandling: true, rangeLowPct: -10, rangeHighPct: 15, electricalReviewed: true, loadCompatibilityReviewed: true });
  for (const item of state.config.catalog) Object.assign(item, { sku: 'TEST', cost: 0, msrp: 0, verified: true, pricing: 'msrp' });
  state.config.catalog.find(row => row.id === 'fixture_retrofit_warm_fixed').msrp = 500;
  for (const key of Object.keys(state.config.labor)) state.config.labor[key] = 0;
  assert.deepEqual(Sheet.importCSV(Sheet.csv(Sheet.rows(state)), state).settings, P.make(state, 'example', '2026-11-13').settings);
  const calculation = M.calculate(state);
  assert.deepEqual(calculation.issues, []);
  assert.equal(calculation.tax, 30);
  assert.equal(calculation.shippingLow, 50);
  assert.equal(calculation.total, 680);
  assert.deepEqual(M.range(calculation, state.config), { low: 612, high: 782, designRetainer: 24.48 });
  assert.match(Report.html(Report.build(state, calculation)), /Design retainer \$24\.48/);
  assert.equal(M.range({ ...calculation, totalHigh: 1200 }, state.config), null);
  assert.deepEqual([24999.99, 25000, 37500, 50000, 50000.01, 62500.01, 75000.01].map(M.shippingRate), [10, 8.75, 7.5, 7.5, 6.25, 5, 4.75]);
  const olderRows = Sheet.rows(state).filter(row => !['shippingHandling','fixtureSpacingFt'].includes(row[1]));
  assert.equal(Sheet.importCSV(Sheet.csv(olderRows), state).settings.shippingHandling, false);
}

// Repository prices use the supplied workbook; hardware inclusions remain separate.
{
  const catalog=P.validate(require('./pricing/catalog.json'));
  for(const [id,sku,cost,msrp] of [
    ['hw_sunnata','HRST-W',265.5,531],
    ['hw_sunnata_hybrid','HRST-HN',326.5,653],
    ['hw_control_enclosure','HQ-LV21-120',352,704],
  ]) {
    const row=catalog.settings.catalog.find(row=>row.id===id);
    assert.equal(row.sku,sku);assert.equal(row.cost,cost);assert.equal(row.msrp,msrp);
    assert.equal(row.verified,true);assert.equal(row.includesPlate,false);assert.equal(row.includesPower,false);
  }
  const old=P.make(M.initial(),'saved-old-release','2026-11-12');
  const saved=P.apply(M.initial(),old);
  const repriced=P.apply(saved,catalog);
  assert.equal(saved.config.catalog.find(row=>row.id==='hw_sunnata').cost,null);
  assert.equal(repriced.config.catalog.find(row=>row.id==='hw_sunnata').cost,265.5);
}

// Supplier source preserves the entire provided list; partial assemblies cannot become complete prices.
{
 const source=require('./pricing/lutron-supplier-prices.json');
 const audit=require('./pricing/assembly-audit.json');
 assert.equal(source.rows.length,10086);
 const bySku=new Map(source.rows.map(row=>[row.sku,row]));
 for(const recipe of audit.recipes){
   let knownCost=0,knownList=0;
   for(const part of recipe.components){
     if(bySku.has(part.sku)){const supplied=bySku.get(part.sku);assert.equal(part.cost,supplied.cost);assert.equal(part.list,supplied.list);knownCost+=part.cost;knownList+=part.list;}
     else {assert.equal(part.cost,null);assert.equal(part.list,null);}
   }
   assert.equal(Math.round(knownCost*100)/100,recipe.knownComponentCost);
   assert.equal(Math.round(knownList*100)/100,recipe.knownComponentList);
   assert.equal(recipe.complete,false);
   assert.equal(require('./pricing/catalog.json').settings.catalog.find(row=>row.id===recipe.catalogId).cost,null);
 }
}

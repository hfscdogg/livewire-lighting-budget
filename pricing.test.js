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
  assert.equal(migrated.modelRevision, 10);
  assert.equal(migrated.settings.catalog.find(row => row.id === 'driver_lumaris_hw').cost, 123.45);
  assert.equal(migrated.settings.catalog.find(row => row.id === 'driver_lumaris').cost, null);
}

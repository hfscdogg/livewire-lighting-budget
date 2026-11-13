const assert=require('node:assert/strict'),M=require('./dist/model'),P=require('./dist/pricing'),S=require('./dist/spreadsheet'),R=require('./dist/customer-report');
const s=M.initial(),rows=S.rows(s),csv=S.csv(rows),p=S.importCSV(csv,s);assert.deepEqual(p.settings,P.make(s,'2026-11-initial','2026-11-10').settings);const change=rows.map(r=>[...r]),cost=S.HEADER.indexOf('Cost USD'),hours=S.HEADER.indexOf('Hours per unit'),value=S.HEADER.indexOf('Value');change.find(r=>r[0]==='product'&&r[1]==='RA3_dimmer')[cost]='110.50';change.find(r=>r[0]==='labor'&&r[1]==='control')[hours]='0.75';change.find(r=>r[1]==='catalogVersion')[value]='2026.11.2';const pack=S.importCSV(S.csv(change),s);assert.equal(pack.settings.catalog.find(x=>x.id==='RA3_dimmer').cost,110.5);assert.equal(pack.settings.labor.control,0.75);assert.equal(s.config.catalog.find(x=>x.id==='RA3_dimmer').cost,null);assert.equal(pack.catalogVersion,'2026.11.2');
for(const fn of [a=>a.pop(),a=>a.push(a[4]),a=>a[0][0]='Wrong',a=>a[4][cost]='-1',a=>a[4][cost]='$100',a=>a[4][cost]='=1+2',a=>a[4][S.HEADER.indexOf('Unit')]='yards',a=>a[4][S.HEADER.indexOf('Price method')]='markup']){const a=rows.map(r=>[...r]);fn(a);assert.throws(()=>S.importCSV(S.csv(a),s));}
assert.throws(()=>S.parse('"unclosed'));assert.deepEqual(S.parse('a,"b,c","d""e"\r\nf,g,h'),[['a','b,c','d"e'],['f','g','h']]);const ref=S.rows(s,[{id:'RA3_dimmer',price:219.5,priceType:'retail',sku:'RRST-PRO-N-WH',source:'https://example.com',checkedDate:'2026-11-10',notes:'Public only'}]);const referenced=S.importCSV(S.csv(ref),s);assert.equal(referenced.settings.catalog.find(x=>x.id==='RA3_dimmer').cost,null);assert.equal(referenced.settings.catalog.find(x=>x.id==='RA3_dimmer').msrp,null);
s.project.name='Customer <test>';s.project.notes='SECRET_PROJECT';s.rooms=[M.room('Living room')];s.rooms[0].notes='SECRET_ROOM';s.rooms[0].recessGroups=[{...M.recessGroup(),qty:6},{...M.recessGroup(),qty:2,adjustable:true}];s.config.catalog[0].cost=987654.32;s.config.catalog[0].source='SECRET_VENDOR';s.config.labor.control=1234;s.config.smallMargin=64.123;const report=R.build(s,M.calculate(s)),html=R.html(report);for(const secret of ['SECRET_PROJECT','SECRET_ROOM','SECRET_VENDOR','987654.32','64.123','1234','scopeReviewed','catalog','laborOnsite'])assert.ok(!html.includes(secret),secret);assert.ok(html.includes('Budget pending'));assert.ok(html.includes('Customer &lt;test&gt;'));assert.ok(html.includes('6 standard Warm dim'));assert.ok(html.includes('2 adjustable Warm dim'));assert.ok(!/\$[0-9]/.test(html));assert.equal(report.range,null);
const fake={...M.calculate(s),issues:[],missingCosts:0,hasScope:true,total:12345,totalHigh:12345};s.config.rangeLowPct=5;s.config.rangeHighPct=10;const ready=R.html(R.build(s,fake));assert.ok(ready.includes('$12,962'));assert.ok(ready.includes('$13,580'));assert.ok(!ready.includes('987654.32'));console.log('PASS: spreadsheet roundtrip, cost/labor import, strict invalid rows, retail references never used as costs, customer report allowlist, incomplete budget has no dollar amount and ready range.');

{
  const initial = M.initial();
  const matrix = S.rows(initial);
  const row = matrix.find(value => value[1] === 'driver_lumaris_hw');
  row[S.HEADER.indexOf('Cost USD')] = 110;
  row[S.HEADER.indexOf('SKU verified')] = 'TRUE';
  row[S.HEADER.indexOf('Package includes power')] = 'TRUE';
  const updated = S.importCSV(S.csv(matrix), initial).settings.catalog.find(item => item.id === 'driver_lumaris_hw');
  assert.equal(updated.cost, 110);
  assert.equal(updated.verified, true);
  assert.equal(updated.includesPower, true);
  assert.equal(updated.system, 'HomeWorks');
}

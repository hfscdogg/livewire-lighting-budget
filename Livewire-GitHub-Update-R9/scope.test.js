const assert=require('node:assert/strict'),M=require('./dist/model.js');
const qty=(c,id)=>c.materials.filter(x=>x.id===id).reduce((a,x)=>a+(x.qty||0),0);
const hours=(c,id)=>c.labor.filter(x=>x.id===id).reduce((a,x)=>a+(x.qty||0),0);
function base(system='HomeWorks'){const s=M.initial();s.project.system=system;s.project.travelBand='0';const r=M.room('Living room');r.surfaceMaterial='open';r.surfaceAccess='open';Object.assign(r,{ceilingPath:'open',wallPath:'open',occupancy:'vacant',ceilingHeight:'standard',specialConditions:'standard'});s.project.sharedPath='open';r.recessGroups[0].qty=8;s.rooms=[r];return[s,r];}
function calibrated(s){for(const k of ['designReviewed','electricalReviewed','loadCompatibilityReviewed','linearRunsReviewed','qsPowerReviewed','centralCapacityReviewed','networkReviewed','siteConditionsReviewed'])s.config[k]=true;s.project.scopeReviewed=true;s.config.rangeLowPct=5;s.config.rangeHighPct=15;s.config.hwArchitecture='qsx';for(const x of s.config.catalog){x.cost=10;x.verified=true;x.sku=x.sku||'TEST-ONLY';x.pdus=x.pdus??1;if(x.id.includes('lumaris'))x.system=s.project.system;}for(const k in s.config.labor)s.config.labor[k]=0;}
{const[s,r]=base();r.keypadType='palladiom';r.keypadQty=2;r.loadTopology='centralized';r.recessGroups.push({...M.recessGroup(),qty:2,zone:'separate',adjustable:true});r.decorNew=1;const room2=M.room('Kitchen');room2.surfaceMaterial='open';room2.surfaceAccess='open';room2.keypadQty=1;room2.keypadType='alisse';room2.loadTopology='centralized';room2.recessGroups[0].qty=4;s.rooms.push(room2);let c=M.calculate(s);assert.equal(c.centralLoadCount,4);assert.equal(c.moduleCount,1);assert.equal(c.panelCount,1);assert.equal(c.wiredProcessors,1);assert.equal(qty(c,'HomeWorks_dimmer'),0);assert.equal(qty(c,'lighting_homerun_cable'),300);assert.equal(qty(c,'lighting_branch_cable'),0);assert.equal(qty(c,'panel_feed_parts'),1);assert.equal(qty(c,'panel_line_harness'),1);assert.equal(qty(c,'keypad_qs_cable'),300);assert.equal(qty(c,'hw_processor'),1);assert.equal(qty(c,'hw_control_enclosure'),1);s.config.processorLocation='panel';c=M.calculate(s);assert.equal(qty(c,'keypad_qs_cable'),225);assert.equal(qty(c,'hw_control_enclosure'),0);room2.panelGroup='Remote';c=M.calculate(s);assert.equal(c.panelCount,2);assert.equal(c.moduleCount,2);assert.equal(qty(c,'keypad_qs_cable'),300);r.loadTopology='distributed';room2.loadTopology='distributed';c=M.calculate(s);assert.equal(c.moduleCount,0);assert.equal(c.panelCount,0);assert.equal(qty(c,'HomeWorks_dimmer'),4);}
{const[s,r]=base();s.config.hwArchitecture='dual';r.keypadQty=1;r.keypadType='alisse';let c=M.calculate(s);assert.equal(c.wiredProcessors,1);assert.equal(c.dualProcessors,1);assert.equal(qty(c,'hw_processor'),1);assert.equal(qty(c,'hw_dual_processor'),1);assert.equal(qty(c,'hw_gateway'),0);r.keypadQty=100;r.loadTopology='distributed';c=M.calculate(s);assert.equal(c.qsLinks,2);assert.equal(c.wiredProcessors,1);r.keypadQty=199;c=M.calculate(s);assert.equal(c.qsLinks,3);assert.equal(c.wiredProcessors,2);}
{const[s,r]=base('none');calibrated(s);let c=M.calculate(s);assert.equal(qty(c,'none_dimmer'),1);assert.equal(c.processors,0);assert.equal(qty(c,'lighting_branch_cable'),50);assert.ok(M.range(c,s.config));s.config.electricalReviewed=false;assert.equal(M.range(M.calculate(s),s.config),null);s.config.electricalReviewed=true;r.powerPlan='new';s.config.newCircuitsPerRoom=null;assert.equal(M.range(M.calculate(s),s.config),null);s.config.newCircuitsPerRoom=1;c=M.calculate(s);assert.equal(qty(c,'new_circuit_parts'),1);assert.equal(qty(c,'circuit_feeder_cable'),75);assert.ok(M.range(c,s.config));r.controlLocations=1.5;assert.equal(M.range(M.calculate(s),s.config),null);}
{const[s,r]=base('RA3');r.keypadQty=1;r.keypadType='sunnata_hybrid';r.controlLocations=3;s.config.ra3Repeaters=2;let c=M.calculate(s);assert.equal(qty(c,'RA3_dimmer'),0);assert.equal(qty(c,'RA3_dimmer_companion'),2);assert.equal(hours(c,'companion_install'),2);assert.equal(qty(c,'lighting_branch_cable'),50);assert.equal(hours(c,'repeater_install'),2);s.config.catalog.find(x=>x.id==='ra3_processor').includesPower=true;c=M.calculate(s);assert.equal(qty(c,'control_poe'),0);assert.equal(hours(c,'poe_power_install'),c.processors);}
{const[s,r]=base();r.surfaceMaterial='drywall';r.recessGroups[0].behavior='ketra';let c=M.calculate(s);assert.equal(qty(c,'HomeWorks_dimmer'),0);assert.equal(qty(c,'constant_power_parts'),1);assert.equal(qty(c,'lighting_branch_cable'),50);assert.ok(c.estimatorNotes.some(x=>x.key.startsWith('d2r_site')));assert.ok(!c.issues.some(x=>x.key.startsWith('d2r_site')));r.recessGroups[0].behavior='lumaris';r.recessGroups[0].adjustable=true;calibrated(s);assert.ok(M.calculate(s).issues.some(x=>x.key.startsWith('lumaris_adjustable')));assert.equal(M.range(M.calculate(s),s.config),null);}
{const[s,r]=base();r.recessGroups[0].qty=0;r.linearFt=18;r.linearZones=2;r.linearBehavior='lumaris';s.config.driverMax.lumaris=16;calibrated(s);s.config.linearRunsReviewed=false;assert.equal(M.range(M.calculate(s),s.config),null);s.config.linearRunsReviewed=true;r.driverCountOverride=3;let c=M.calculate(s);assert.equal(c.roomResults[0].driverQty,3);assert.equal(qty(c,'linear_lead_lumaris'),30);assert.equal(hours(c,'linear_lead_run'),30);}
{const[s,r]=base();r.keypadType='alisse';r.keypadQty=1;r.recessGroups[0].qty=0;r.keypadLocation='existing';r.surfaceMaterial='drywall';r.surfaceAccess='removable';let c=M.calculate(s);assert.equal(c.roomResults[0].openings,0);assert.equal(qty(c,'keypad_qs_mount'),1);r.keypadLocation='new';assert.equal(M.calculate(s).roomResults[0].openings,1);s.config.qsDevicesPerLink=0;c=M.calculate(s);assert.ok(Number.isFinite(c.qsLinks));assert.ok(c.issues.some(x=>x.key==='qs_capacity_config'));}
{const[s,r]=base('none');calibrated(s);r.routeLength='long';assert.equal(M.range(M.calculate(s),s.config),null);r.routeReviewed=true;s.config.roomRoutes={[r.id]:2};assert.ok(M.range(M.calculate(s),s.config));s.config.feedsPerModule=1.5;assert.equal(M.range(M.calculate(s),s.config),null);}
{const[s,r]=base();r.keypadType='alisse';r.keypadQty=1;r.recessGroups[0].qty=0;r.decorNew=10001;r.decorControlGroup='separate';calibrated(s);const c=M.calculate(s);assert.ok(c.issues.some(x=>x.key==='hw_switchlegs'));assert.equal(M.range(c,s.config),null);}
{const[s,r]=base('none');calibrated(s);s.project.travelBand='1';s.config.labor.design=100;s.config.labor.program=100;s.config.labor.circuit_check=17;const c=M.calculate(s);assert.equal(c.knownSiteHours,17);assert.equal(c.days,2);assert.equal(c.travel,240);assert.equal(c.knownHours,117);}
console.log('PASS: centralized/distributed/mixed topology, shared modules/panels/feeds, QS/backbone/enclosures, electrical dependencies, medium runs, hybrid companions, bundled-power labor, intelligent constant power, linear overrides, finite/whole capacity limits, 10k output gate, onsite travel.');

{const[s,r]=base();r.loadTopology="centralized";r.keypadQty=1;r.keypadType="sunnata_hybrid";s.config.catalog.find(x=>x.id==="hw_sunnata_hybrid").includesPlate=true;s.config.catalog.find(x=>x.id==="hw_sunnata").includesPlate=false;const c=M.calculate(s);assert.equal(qty(c,"hw_sunnata"),1);assert.equal(qty(c,"control_wallplate"),1);}

// System-specific part numbers, manufacturer caps and actual unequal groups.
{
  const [s, r] = base('RA3');
  r.install = 'new';
  r.powerPlan = 'new';
  r.recessGroups[0].qty = 41;
  r.recessGroups[0].behavior = 'lumaris';
  Object.assign(r, { linearFt: 20, linearZones: 2, linearZoneLengths: '18, 2', linearBehavior: 'lumaris' });
  let c = M.calculate(s);
  assert.equal(qty(c, 'new_circuit_parts'), 2);
  assert.equal(qty(c, 'driver_lumaris'), 3);
  assert.equal(qty(c, 'linear_lead_lumaris'), 30);
  assert.equal(c.typeX, 45);
  assert.match(c.materials.find(line => line.id === 'fixture_new_lumaris_fixed').sku, /^RRL-/);
  s.project.system = 'HomeWorks';
  c = M.calculate(s);
  assert.match(c.materials.find(line => line.id === 'fixture_new_lumaris_fixed_hw').sku, /^HWL-/);
  assert.match(c.materials.find(line => line.id === 'driver_lumaris_hw').sku, /^HWL-/);
  assert.equal(qty(c, 'driver_lumaris'), 0);
  assert.equal(c.hwX, 45);
  r.linearZoneLengths = '4, 8';
  assert.ok(M.calculate(s).issues.some(issue => issue.key.startsWith('linear_zone_lengths_')));
}
{
  const [s, r] = base('RA3');
  r.fanQty = 1;
  r.fanControl = 'fan';
  for (const motor of ['unknown', 'remote']) {
    r.fanMotor = motor;
    assert.ok(M.calculate(s).issues.some(issue => issue.key.startsWith('fan_speed_')));
  }
  r.fanMotor = 'ac';
  assert.equal(M.calculate(s).issues.some(issue => issue.key.startsWith('fan_speed_')), false);
}

{
  const [state, room] = base('RA3');
  state.config.fixtureSpacingFt = 10;
  state.project.networkPlan = 'existing';
  Object.assign(state.config.catalog.find(row => row.id === 'ra3_processor'), { sku: 'RR-PROC3-KIT', includesPower: true });
  Object.assign(room, { linearFt: 12, linearBehavior: 'lumaris', linearSections: '5,7' });
  state.config.catalog.find(row => row.id === 'linear_lumaris').sku = 'LU-T05-TW-IN';
  state.config.catalog.find(row => row.id === 'linear_parts').sku = 'LU-SR2-K';
  state.config.catalog.find(row => row.id === 'driver_lumaris').sku += ' + LU-CK1-TW (2 connectors)';
  const estimate = M.calculate(state);
  assert.equal(qty(estimate, 'lighting_branch_cable'), 170);
  assert.equal(qty(estimate, 'control_ethernet'), 0);
  assert.equal(qty(estimate, 'network_accessories'), 0);
  assert.equal(qty(estimate, 'linear_lumaris'), 5 * M.FT_PER_M);
  assert.equal(qty(estimate, 'linear_parts'), 16);
  assert.equal(qty(estimate, 'driver_lumaris'), 1);
  room.linearSections = '4,4,4';
  assert.ok(M.calculate(state).issues.some(({ key }) => key.startsWith('linear_zone_lengths_connectors_')));
}

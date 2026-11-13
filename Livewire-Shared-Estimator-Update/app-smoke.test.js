'use strict';
// Application event smoke tests. This is not a visual browser or print test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
async function main(){
  const elements=new Map(),events=new Map(),storage=new Map();
  const element=id=>{
    if(!elements.has(id))elements.set(id,{id,innerHTML:'',hidden:true,classList:{add(){},remove(){}},addEventListener(name,fn){this[name]=fn;},click(){},remove(){},showModal(){this.open=true;},querySelector(selector){return element(this.id+selector);}});
    return elements.get(id);
  };
  const context=vm.createContext({console,Intl,Date,Math,Map,Set,URL,URLSearchParams,TextEncoder,TextDecoder,structuredClone,Blob,Uint8Array,ArrayBuffer,FormData:class {constructor(entries){this.entries=new Map(entries);}get(key){return this.entries.has(key)?this.entries.get(key):null;}has(key){return this.entries.has(key);}},
    location:{search:''},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    document:{getElementById:element,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>events.set(type,fn),body:{classList:{add(){},remove(){}},append(){}},createElement:tag=>element(tag)},
    scrollTo(){},setTimeout(){return 1;},clearTimeout(){},addEventListener(){},confirm(){return true;},alert(message){throw Error(message);},crypto:require('node:crypto').webcrypto,
  });context.window=context;
  for(const name of ['sales-workflow','job-photos','shades','installation','model','pricing','spreadsheet','customer-report','price-references'])vm.runInContext(fs.readFileSync(`dist/${name}.js`,'utf8'),context,{filename:name+'.js'});
  context.LivewireRepositoryCatalog=JSON.parse(fs.readFileSync('pricing/catalog.json'));
  await vm.runInContext(fs.readFileSync('dist/app.js','utf8').replace('save();render();})();','save();render();window.testScope=code=>eval(code);})();'),context,{filename:'app.js'});
  const click=dataset=>events.get('click')({target:{closest:()=>({dataset})}});
  const change=(path,value,type='select-one')=>events.get('change')({target:{dataset:{path},value,type,tagName:type==='select-one'?'SELECT':'INPUT'}});
  click({action:'pick-room',name:'Kitchen'});click({action:'go',step:'2'});
  assert.match(element('app').innerHTML,/Room overview/);
  assert.match(element('app').innerHTML,/Number of recessed lights/);
  assert.equal(context.testScope('state.rooms[0].linearBehavior'),'lumaris');
  change('rooms.0.recessGroups.0.qty','-4','number');
  assert.equal(context.testScope('state.rooms[0].recessGroups[0].qty'),-4,'Invalid quantities must not silently become zero');
  assert.equal(context.testScope('M.range(M.calculate(state),state.config)'),null);
  change('rooms.0.recessGroups.0.qty','4','number');
  change('rooms.0.recessGroups.0.behavior','rania');
  assert.match(element('app').innerHTML,/Use the matching system/);
  click({action:'fit-system'});
  assert.equal(context.testScope('state.project.system'),'HomeWorks');
  change('rooms.0.recessGroups.0.behavior','warm');
  click({action:'choose',path:'project.system',value:'none'});
  click({action:'go',step:'3'});
  click({action:'condition-preset',id:'drywall'});
  click({action:'ordinary-room'});
  assert.equal(context.testScope('state.rooms[0].openingPermission'),'selective');
  assert.equal(context.testScope('state.rooms[0].ceilingHeight'),'standard');
  // An accidental no-cut choice is reversible without completing the detail form.
  change('rooms.0.occupancy','occupied');
  click({action:'condition-preset',id:'noCuts'});
  assert.match(element('app').innerHTML,/Undo last choice/);
  assert.equal(context.testScope('state.rooms[0].openingPermission'),'none');
  click({action:'conditions-detail'});
  assert.match(element('app').innerHTML,/Change this choice/);
  click({action:'condition-undo'});
  assert.equal(context.testScope('detailedConditions'),false);
  assert.equal(context.testScope('state.rooms[0].openingPermission'),'selective');
  assert.equal(context.testScope('state.rooms[0].occupancy'),'occupied');
  assert.equal(context.testScope('state.rooms[0].recessGroups[0].qty'),4);
  click({action:'condition-preset',id:'noCuts'});
  click({action:'go',step:'4'});
  click({action:'resolve-check',target:'conditions',index:'0'});
  assert.equal(context.testScope('detailedConditions'),false,'Budget checks must open quick choices first');
  assert.match(element('app').innerHTML,/What can you see in this room/);
  click({action:'condition-preset',id:'drywall'});
  click({action:'conditions-detail'});
  click({action:'condition-change'});
  assert.equal(context.testScope('detailedConditions'),false);
  click({action:'conditions-detail'});
  click({action:'go',step:'2'});click({action:'go',step:'3'});
  assert.equal(context.testScope('detailedConditions'),false,'Detailed mode must not stick across navigation');

  assert.match(element('app').innerHTML,/What can you see in this room/);
  click({action:'conditions-detail'});
  assert.match(element('app').innerHTML,/Can we reach the ceiling wiring/);
  assert.match(element('app').innerHTML,/Can we reach the wall wiring/);
  for(const [key,value]of Object.entries({surfaceMaterial:'drywall',ceilingPath:'closed',wallPath:'closed',openingPermission:'none',occupancy:'vacant',ceilingHeight:'standard',specialConditions:'standard'}))change('rooms.0.'+key,value);
  assert.match(element('app').innerHTML,/No attic access by itself/);
  click({action:'go',step:'4'});
  assert.match(element('app').innerHTML,/cutting is not permitted/);
  assert.match(element('app').innerHTML,/See wiring and task allowances/);
  click({action:'print'});
  assert.match(element('customer-report').innerHTML,/Openings or a confirmed alternative route/);
  assert.doesNotMatch(element('customer-report').innerHTML,/supplier|hoursPer|M4NCRS/);
  assert.match(element('customer-report').innerHTML,/Budget pending/);
  click({action:'close-report'});click({action:'go',step:'3'});
  change('rooms.0.openingPermission','selective');click({action:'go',step:'4'});click({action:'print'});
  assert.match(element('customer-report').innerHTML,/Selective drywall or plaster openings are included/);
  assert.equal(JSON.parse(storage.get('lighting-budget-lab.v2')).rooms[0].openingPermission,'selective');
  // Every new input is saved independently, so selecting one does not erase another.
  assert.equal(JSON.parse(storage.get('lighting-budget-lab.v2')).rooms[0].ceilingPath,'closed');
  assert.match(element('app').innerHTML,/Finish these checks/);
  click({action:'edit-room',index:'0'});
  assert.match(element('app').innerHTML,/Back to budget/);
  click({action:'layer',id:'fans'});
  assert.match(element('app').innerHTML,/Replace an existing fan/);
  change('rooms.0.fanQty','1','number');
  change('rooms.0.fanWork','replace');
  assert.match(element('app').innerHTML,/Existing ceiling support/);
  change('rooms.0.fanSupport','verified');
  click({action:'next'});
  assert.equal(context.testScope('step'),4);
  const savedJob=storage.get('lighting-budget-lab.v2');
  // A download is not confirmation that the user kept the file.
  click({action:'new'});
  element('dialog[data-download-job]').click();
  assert.equal(context.testScope('state.rooms.length'),1);
  element('dialog').returnValue='cancel';element('dialog').close();
  assert.equal(context.testScope('state.rooms.length'),1);
  click({action:'export'});click({action:'new'});
  assert.equal(context.testScope('state.rooms.length'),1);
  element('dialog').returnValue='discard';element('dialog').close();
  assert.equal(context.testScope('state.rooms.length'),0);
  assert.equal(context.testScope('state.config.currentRate'),112.5);
  assert.doesNotMatch(element('app').innerHTML,/Open priced example/);
  await element('import-file').change({target:{files:[{size:savedJob.length,text:async()=>savedJob}],value:'job.json'}});
  assert.equal(context.testScope('state.rooms[0].name'),'Kitchen');
  assert.equal(context.testScope('state.rooms[0].fanWork'),'replace');
  assert.equal(context.testScope('state.rooms[0].fanSupport'),'verified');
  assert.equal(context.testScope('state.rooms[0].openingPermission'),'selective');
  // Legacy reset retains company standards but never project-specific overrides.
  context.testScope(`availablePricing=null;state.config.offlineShadePrices={privateWindow:{low:900,high:1100}};state.config.roomRoutes={privateRoom:4};state.config.hwArchitecture='central';resetOfflineProject();`);
  assert.equal(context.testScope('Object.keys(state.config.offlineShadePrices||{}).length'),0);
  assert.equal(context.testScope('Object.keys(state.config.roomRoutes||{}).length'),0);
  assert.equal(context.testScope('state.config.hwArchitecture===M.initial().config.hwArchitecture'),true);
  context.testScope(`M.addRoomNamed(state,'Markup room');`);
  const views=[];
  for(const page of [0,1,2,3,4]){click({action:'go',step:String(page)});const html=element('app').innerHTML;const ids=[...html.matchAll(/\sid="([^\"]+)"/g)].map(match=>match[1]);assert.equal(new Set(ids).size,ids.length,'Unique element IDs on step '+page);views.push({page,html});}
  // Copy is available in the standalone application too, and never copies notes or route proof.
  context.testScope(`state.rooms[0].notes='PRIVATE NOTE';state.rooms[0].recessGroups[0].qty=6;`);
  click({action:'copy-room',id:context.testScope('state.rooms[0].id')});
  assert.equal(context.testScope('state.rooms.length'),2);
  assert.equal(context.testScope('state.rooms[1].recessGroups[0].qty'),6);
  assert.equal(context.testScope('state.rooms[1].notes'),'');
  context.testScope('resetOfflineProject()');
  const rowId=context.testScope('state.config.catalog[0].id');
  for(const bad of ['-1','Infinity','NaN','one hundred']) {
    context.priceForm=[[rowId+':sku','TEST'],[rowId+':cost',bad],[rowId+':sell','100'],[rowId+':basis','msrp']];
    const before=context.testScope('JSON.stringify(state)');
    assert.throws(()=>context.testScope('applyOfflinePricing(priceForm)'),/nonnegative/);
    assert.equal(context.testScope('JSON.stringify(state)'),before);
  }
  // Duplicate quantities, not a site verification for a different physical room.
  vm.runInContext(fs.readFileSync('server/shared.js','utf8'),context);
  context.testScope(`const originalRoom=M.addRoomNamed(state,'Office');Object.assign(originalRoom,{ceilingPath:'closed',wallPath:'closed',ceilingFishing:'verified',wallFishing:'verified',routeEvidence:'Checked original room',routeReviewed:true,notes:'Original room only'});originalRoom.recessGroups[0].qty=6;LivewireShared.copyRoom(state,originalRoom.id);`);
  const copied=JSON.parse(context.testScope('JSON.stringify(state.rooms[1])'));
  assert.equal(copied.recessGroups[0].qty,6);
  assert.equal(copied.ceilingFishing,'unknown');assert.equal(copied.wallFishing,'unknown');
  assert.equal(copied.routeEvidence,'');assert.equal(copied.routeReviewed,false);
  assert.equal(copied.notes,'');assert.equal(copied.ceilingPath,'unknown');
  console.log('PASS: application startup, room entry, conditions navigation, access warnings, task breakdown, customer scope, save/reopen, safe new-job reset, pricing rejection and copied-room verification (DOM event simulation).');
}
main().catch(error=>{console.error(error);process.exitCode=1;});

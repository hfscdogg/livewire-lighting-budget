'use strict';
// Application event smoke tests. This is not a visual browser or print test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
async function main(){
  const elements=new Map(),events=new Map(),storage=new Map();
  const element=id=>{
    if(!elements.has(id))elements.set(id,{id,innerHTML:'',hidden:true,classList:{add(){},remove(){}},addEventListener(name,fn){this[name]=fn;},click(){},remove(){},showModal(){this.open=true;},querySelectorAll(){return this.checkedInputs||[];},querySelector(selector){return element(this.id+selector);}});
    return elements.get(id);
  };
  const context=vm.createContext({console,Intl,Date,Math,Map,Set,URL,URLSearchParams,TextEncoder,TextDecoder,structuredClone,Blob,Uint8Array,ArrayBuffer,FormData:class {constructor(entries){this.entries=new Map(entries);}get(key){return this.entries.has(key)?this.entries.get(key):null;}has(key){return this.entries.has(key);}},
    location:{search:''},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    document:{getElementById:element,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>events.set(type,fn),body:{classList:{add(){},remove(){}},append(){}},createElement:tag=>element(tag)},
    scrollTo(){},setTimeout(){return 1;},clearTimeout(){},addEventListener(type,fn){events.set("window:"+type,fn);},confirm(){return true;},alert(message){throw Error(message);},crypto:require('node:crypto').webcrypto,
  });context.window=context;
  const printedTitles=[];
  context.print=()=>{events.get('window:beforeprint')?.();printedTitles.push(context.document.title);events.get('window:afterprint')?.();};
  const expose=source=>source.replace('save();render();})();','save();render();window.testScope=code=>eval(code);})();');
  if(process.argv[2]){
    const html=fs.readFileSync(process.argv[2],'utf8');
    assert.match(html,/<title>Livewire Estimator · 2026-11-17 R9<\/title>/);
    assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+href=/);
    const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,12);
    for(const [index,script]of scripts.entries())await vm.runInContext(expose(script[1]),context,{filename:'standalone-script-'+index});
    assert.deepEqual(JSON.parse(JSON.stringify(context.LivewireRepositoryCatalog)),JSON.parse(fs.readFileSync('pricing/catalog.json','utf8')),'Standalone must embed the exact current company catalog');
  }else{
    for(const name of ['sales-workflow','job-photos','shades','installation','model','pricing','spreadsheet','customer-report','estimator-report','price-references'])vm.runInContext(fs.readFileSync(`dist/${name}.js`,'utf8'),context,{filename:name+'.js'});
    context.LivewireRepositoryCatalog=JSON.parse(fs.readFileSync('pricing/catalog.json'));
    await vm.runInContext(expose(fs.readFileSync('dist/app.js','utf8')),context,{filename:'app.js'});
  }
  const click=dataset=>events.get('click')({target:{closest:()=>({dataset})}});
  const change=(path,value,type='select-one')=>events.get('change')({target:{dataset:{path},value,type,tagName:type==='select-one'?'SELECT':'INPUT'}});
  change('project.travelBand','0');
  click({action:'pick-room',name:'Kitchen'});click({action:'go',step:'2'});
  assert.match(element('app').innerHTML,/What does this room need/);
  assert.doesNotMatch(context.testScope('roomOverview(state.rooms[0])'),/<input|<select/);
  click({action:'layer',id:'recessed'});
  assert.match(element('app').innerHTML,/data-path="rooms.0.recessGroups.0.qty"/);
  assert.equal(context.testScope('state.rooms[0].linearBehavior'),'lumaris');
  change('rooms.0.recessGroups.0.qty','-4','number');
  assert.equal(context.testScope('state.rooms[0].recessGroups[0].qty'),-4,'Invalid quantities must not silently become zero');
  assert.equal(context.testScope('M.range(M.calculate(state),state.config)'),null);
  change('rooms.0.recessGroups.0.qty','4','number');
  change('rooms.0.recessGroups.0.behavior','rania');
  assert.doesNotMatch(element('app').innerHTML,/Use the matching system/);
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
  assert.match(element('app').innerHTML,/Undo last access choice/);
  assert.equal(context.testScope('state.rooms[0].openingPermission'),'none');
  click({action:'conditions-detail'});
  assert.match(element('app').innerHTML,/Undo last access choice/);
  click({action:'condition-undo'});
  assert.equal(context.testScope('detailedConditions'),false);
  assert.equal(context.testScope('state.rooms[0].openingPermission'),'selective');
  assert.equal(context.testScope('state.rooms[0].occupancy'),'occupied');
  assert.equal(context.testScope('state.rooms[0].recessGroups[0].qty'),4);
  click({action:'condition-preset',id:'noCuts'});
  click({action:'go',step:'4'});
  assert.equal(context.testScope('step'),3,'Unresolved no-cut routes prevent advancing to budget');
  assert.equal(context.testScope('detailedConditions'),false,'Budget checks must open quick choices first');
  assert.match(element('app').innerHTML,/How can we reach the wiring/);
  click({action:'condition-preset',id:'drywall'});
  click({action:'conditions-detail'});
  click({action:'condition-change'});
  assert.equal(context.testScope('detailedConditions'),false);
  click({action:'conditions-detail'});
  click({action:'go',step:'2'});click({action:'go',step:'3'});
  assert.equal(context.testScope('detailedConditions'),false,'Detailed mode must not stick across navigation');

  assert.match(element('app').innerHTML,/How can we reach the wiring/);
  click({action:'conditions-detail'});
  assert.match(element('app').innerHTML,/Can we reach the ceiling wiring/);
  assert.match(element('app').innerHTML,/Can we reach the wall wiring/);
  for(const [key,value]of Object.entries({surfaceMaterial:'drywall',ceilingPath:'closed',wallPath:'closed',openingPermission:'none',occupancy:'vacant',ceilingHeight:'standard',specialConditions:'standard'}))change('rooms.0.'+key,value);
  assert.match(element('app').innerHTML,/No attic access by itself/);
  click({action:'go',step:'4'});
  assert.equal(context.testScope('step'),3);
  assert.match(element('app').innerHTML,/Confirm access without extra cuts/);
  assert.match(element('app').innerHTML,/Ceiling fishing route/);
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
  assert.match(element('app').innerHTML,/Scope of work/);
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
  // Exercise compatibility filtering and copy navigation through the shipped event handlers.
  context.testScope(`resetOfflineProject();state.project.travelBand='0';state.project.install='retrofit';
    for(const name of ['Kitchen','Dining','Living']){const r=M.addRoomNamed(state,name);r.recessGroups[0].qty=6;}
    step=2;roomIndex=0;layer='recessed';reviewReturn=false;render();`);
  change('rooms.0.recessGroups.0.behavior','lumaris');
  change('rooms.0.recessGroups.0.adjustable','true');
  assert.equal(context.testScope('state.rooms[0].recessGroups[0].behavior'),'rania');
  assert.equal(context.testScope('state.project.system'),'HomeWorks');
  assert.equal(context.testScope("experienceOptions(state.rooms[0],false,true).some(x=>x[0]==='lumaris')"),false);
  assert.doesNotMatch(element('app').innerHTML,/ceiling conversion needed/i);
  change('rooms.0.recessGroups.0.behavior','warm');
  click({action:'go',step:'3'});click({action:'condition-preset',id:'drywall'});click({action:'ordinary-room'});
  assert.equal(context.testScope("M.fixtureBuild(state.rooms[0],state.rooms[0].recessGroups[0])"),'remodel');
  click({action:'copy-conditions'});
  element('dialog').checkedInputs=context.testScope('state.rooms.slice(1).map(r=>({value:r.id}))');
  element('dialog').returnValue='apply';element('dialog').close();
  assert.match(element('app').innerHTML,/See budget/);
  click({action:'next'});
  assert.equal(context.testScope('step'),4,'Completed copied rooms go directly to budget');
  assert.ok(context.testScope('M.range(M.planning(state),state.config)'));
  // An unchecked copied D2R room is budgeted with an automatic ordering note.
  context.testScope(`state.rooms[1].recessGroups[0].behavior='ketra';state.rooms[1].d2rConditions='unknown';step=3;roomIndex=0;reviewReturn=false;render();`);
  click({action:'next'});
  assert.equal(context.testScope('step'),4,'Unchecked D2R suitability must not interrupt the budget');
  assert.match(element('app').innerHTML,/Estimator handoff/);assert.match(element('app').innerHTML,/Before ordering Rania\/Ketra D2R fixtures/);
  assert.equal(context.testScope('state.rooms[1].d2rConditions'),'unknown','No approval is fabricated');
  context.testScope(`state.rooms[1].d2rConditions='incompatible';step=3;roomIndex=0;reviewReturn=false;render();`);click({action:'next'});
  assert.equal(context.testScope('step'),3);assert.equal(context.testScope('roomIndex'),1);
  assert.match(element('app').innerHTML,/D2R ceiling check/);
  change('rooms.1.d2rConditions','suitable');click({action:'next'});
  assert.equal(context.testScope('step'),4,'The remaining copied complete room is skipped');
  const r4Saved=context.testScope('JSON.stringify(state)');
  await element('import-file').change({target:{files:[{size:r4Saved.length,text:async()=>r4Saved}],value:'r4.json'}});
  assert.equal(context.testScope('state.rooms[1].conditionsCopiedFrom'),'Kitchen');
  assert.equal(context.testScope('state.rooms[1].d2rConditions'),'suitable');
  // A changed fan selection remains reversible after an incompatible speed control is removed.
  context.testScope(`step=2;roomIndex=0;layer='fans';render();`);
  change('rooms.0.fanQty','1','number');change('rooms.0.fanControl','fan');change('rooms.0.fanMotor','remote');
  assert.equal(context.testScope('state.rooms[0].fanControl'),'existing');
  assert.match(element('app').innerHTML,/What kind of fan is it/);
  assert.doesNotMatch(element('app').innerHTML,/data-path="rooms.0.fanControl" data-value="fan"/);
  change('rooms.0.fanMotor','ac');
  assert.match(element('app').innerHTML,/Install a wall speed control/);
  context.testScope('resetOfflineProject()');
  // Duplicate quantities, not a site verification for a different physical room.
  vm.runInContext(fs.readFileSync('server/shared.js','utf8'),context);
  context.testScope(`const originalRoom=M.addRoomNamed(state,'Office');Object.assign(originalRoom,{ceilingPath:'closed',wallPath:'closed',ceilingFishing:'verified',wallFishing:'verified',routeEvidence:'Checked original room',routeReviewed:true,notes:'Original room only'});originalRoom.recessGroups[0].qty=6;LivewireShared.copyRoom(state,originalRoom.id);`);
  const copied=JSON.parse(context.testScope('JSON.stringify(state.rooms[1])'));
  assert.equal(copied.recessGroups[0].qty,6);
  assert.equal(copied.ceilingFishing,'unknown');assert.equal(copied.wallFishing,'unknown');
  assert.equal(copied.routeEvidence,'');assert.equal(copied.routeReviewed,false);
  assert.equal(copied.notes,'');assert.equal(copied.ceilingPath,'unknown');
  // Complete the salesperson path without an estimator approval checkbox.
  context.testScope('resetOfflineProject()');
  assert.doesNotMatch(context.testScope('projectView()'),/project.networkPlan|Schedule and network/);
  assert.match(context.testScope('projectView()').split('<details')[0],/Expected installation/,'The date stays in the primary project details');
  change('project.install','remodel');change('project.travelBand','0');
  click({action:'pick-room',name:'Kitchen'});click({action:'go',step:'2'});
  click({action:'layer',id:'recessed'});change('rooms.0.recessGroups.0.qty','6','number');
  click({action:'add-group'});change('rooms.0.recessGroups.1.qty','2','number');change('rooms.0.recessGroups.1.zone','separate');
  click({action:'layer',id:'overview'});
  const overview=context.testScope('roomOverview(state.rooms[0])');
  assert.doesNotMatch(overview,/<input|<select/);assert.match(overview,/6 fixed lights/);assert.match(overview,/2 adjustable lights/);assert.match(overview,/Separate control group/);
  click({action:'go',step:'3'});click({action:'condition-preset',id:'noCuts'});click({action:'ordinary-room'});change('rooms.0.occupancy','vacant');
  change('project.sharedPath','open');click({action:'next'});assert.equal(context.testScope('step'),3);
  change('rooms.0.ceilingFishing','verified');change('rooms.0.wallFishing','verified');click({action:'next'});assert.equal(context.testScope('step'),3,'Verification needs a supporting reference');
  change('rooms.0.routeEvidence','Electrician checked ceiling route and wall drop','text');click({action:'next'});assert.equal(context.testScope('step'),4);
  assert.equal(context.testScope('state.project.scopeReviewed'),false);
  assert.match(element('app').innerHTML,/Design retainer/);assert.doesNotMatch(element('app').innerHTML,/Not ready yet|Let’s finish your budget/);
  click({action:'edit-room',index:'0'});click({action:'layer',id:'linear'});
  change('rooms.0.linearFt','12','number');change('rooms.0.linearBehavior','rania');
  assert.equal(context.testScope('state.project.system'),'HomeWorks');click({action:'next'});
  assert.equal(context.testScope('step'),4);assert.match(element('app').innerHTML,/Design retainer/);
  click({action:'print'});assert.match(element('customer-report').innerHTML,/to support the selected Ketra or Rania lighting/);
  assert.doesNotMatch(element('customer-report').innerHTML,/LU-T05|supplier cost|person-hours/);
  // Reproduce the reported Ketra / hidden connecting-wiring problem.
  context.testScope('resetOfflineProject()');change('project.travelBand','0');change('project.install','remodel');
  click({action:'pick-room',name:'Living room'});click({action:'go',step:'2'});click({action:'layer',id:'recessed'});
  change('rooms.0.recessGroups.0.qty','6','number');change('rooms.0.recessGroups.0.adjustable','true');change('rooms.0.recessGroups.0.behavior','ketra');
  assert.doesNotMatch(element('app').innerHTML,/module, mount and power supply are priced/);
  click({action:'next'});assert.equal(context.testScope('step'),3,'Room access belongs on Conditions');
  assert.match(element('app').innerHTML,/D2R ceiling suitability/);assert.match(element('app').innerHTML,/Not checked yet/);
  click({action:'go',step:'4'});assert.equal(context.testScope('step'),3,'Budget navigation cannot skip missing room access');
  click({action:'back'});assert.equal(context.testScope('step'),2,'Backward navigation remains available');
  click({action:'go',step:'2'});change('rooms.0.recessGroups.0.behavior','warm');click({action:'next'});
  assert.equal(context.testScope('step'),3);
  assert.doesNotMatch(element('app').innerHTML,/data-path="project.shared|Shared wiring outside/);
  click({action:'condition-preset',id:'drywall'});click({action:'ordinary-room'});click({action:'next'});
  assert.equal(context.testScope('step'),4,'Unknown occupancy carries protection and does not interrupt the flow');
  click({action:'go',step:'3'});
  change('rooms.0.occupancy','vacant');click({action:'next'});
  assert.equal(context.testScope('step'),4);assert.equal(context.testScope('state.project.sharedPath'),'unknown','No extra route question or fabricated saved verification');
  assert.match(element('app').innerHTML,/Design retainer/);assert.doesNotMatch(element('app').innerHTML,/things to finish|Let’s finish your budget/);
  assert.equal(context.testScope('state.project.system'),'none','Removing the only intelligent lighting restores conventional controls');
  click({action:'edit-room',index:'0'});click({action:'layer',id:'recessed'});
  change('rooms.0.recessGroups.0.behavior','ketra');click({action:'next'});
  assert.equal(context.testScope('step'),4,'Unknown D2R ceiling fit no longer blocks the budget');
  assert.match(element('app').innerHTML,/Before ordering Rania\/Ketra D2R fixtures/);
  const withNote=context.testScope('M.planning(state).total');
  context.testScope(`state.rooms[0].notes='Private estimator instruction\\nSecond line';state.rooms[0].photos=[{id:'room-photo',name:'Private room photo.jpg',data:'data:image/jpeg;base64,/9j/2Q=='}];render();`);
  assert.match(element('app').innerHTML,/Estimator handoff PDF/);
  click({action:'estimator-pdf'});
  assert.match(element('customer-report').innerHTML,/INTERNAL COMPANY DOCUMENT/);
  assert.match(element('customer-report').innerHTML,/Private estimator instruction/);
  assert.match(element('customer-report').innerHTML,/Private room photo/);
  assert.match(element('customer-report').innerHTML,/Before ordering Rania\/Ketra D2R fixtures/);
  assert.doesNotMatch(element('customer-report').innerHTML,/>Budget pending</);
  await context.testScope('printActiveReport()');
  assert.match(printedTitles.at(-1),/estimator handoff - internal/);
  click({action:'close-report'});click({action:'print'});
  assert.doesNotMatch(element('customer-report').innerHTML,/Private estimator instruction|Private room photo|base64/);
  await context.testScope('printActiveReport()');assert.match(printedTitles.at(-1),/customer budget/);
  click({action:'close-report'});

  click({action:'print'});assert.match(element('customer-report').innerHTML,/confirm mounting and clearance requirements before ordering/);
  assert.doesNotMatch(element('customer-report').innerHTML,/Before ordering Rania\/Ketra D2R fixtures|insulation separation/);click({action:'close-report'});
  const pendingJob=context.testScope('JSON.stringify(state)');
  await element('import-file').change({target:{files:[{size:pendingJob.length,text:async()=>pendingJob}],value:'pending-d2.json'}});
  click({action:'go',step:'4'});assert.match(element('app').innerHTML,/Before ordering Rania\/Ketra D2R fixtures/);
  click({action:'go',step:'3'});change('rooms.0.d2rConditions','suitable');click({action:'next'});
  assert.equal(context.testScope('M.planning(state).total'),withNote);assert.doesNotMatch(element('app').innerHTML,/Before ordering Rania\/Ketra D2R fixtures/);
  assert.equal(context.testScope('step'),4,'Priced Ketra with suitable ceiling reaches the payoff through the visible form');
  assert.match(element('app').innerHTML,/conservative allowance for standard white decorative trims/);
  assert.doesNotMatch(element('app').innerHTML,/Let’s finish your budget/);
  // Main categories are immediately available. Related keypad decisions unfold in place.
  context.testScope('resetOfflineProject()');change('project.travelBand','0');click({action:'pick-room',name:'Office'});click({action:'go',step:'2'});
  assert.match(element('app').innerHTML,/What does this room need/);
  assert.match(element('app').innerHTML,/Room summary/);
  assert.doesNotMatch(element('app').innerHTML,/room-decisions|room-focus|data-id="overview"|pricing-panel|step-instructions|class="intro"/);
  click({action:'layer',id:'existing'});change('rooms.0.existingDimmers','3','number');change('rooms.0.existingSwitches','1','number');
  click({action:'layer',id:'keypads'});
  for(const name of ['Sunnata','Palladiom glass','Alisse','Aviena','seeTouch'])assert.ok(element('app').innerHTML.includes(name));
  assert.doesNotMatch(element('app').innerHTML,/How should the wall look/);
  click({action:'control-design',id:'palladiom'});assert.match(element('app').innerHTML,/How should the wall look/);
  assert.equal(context.testScope('state.project.system'),'HomeWorks');assert.equal(context.testScope('M.planning(state).panelCount'),0);
  click({action:'control-design',id:'sunnata'});
  assert.equal(context.testScope('state.rooms[0].keypadType'),'sunnata_hybrid');assert.equal(context.testScope('state.project.system'),'RA3');
  click({action:'control-walls',id:'keypads_only'});assert.ok(context.testScope('M.planning(state).panelCount')>0);
  click({action:'control-walls',id:'local'});assert.equal(context.testScope('M.planning(state).panelCount'),0);
  click({action:'control-intent',id:'wall'});assert.equal(context.testScope('state.rooms[0].keypadQty'),0);
  assert.equal(context.testScope('state.rooms[0].existingDimmers'),3,'Changing keypad preferences retains the room work');
  click({action:'next'});assert.equal(context.testScope('step'),3);
  assert.doesNotMatch(element('app').innerHTML,/Ordinary room|Work in this room|data-action="condition-preset"/);
  click({action:'access-choice',kind:'surface',id:'plaster'});
  assert.match(element('app').innerHTML,/Can we make wiring access cuts/);
  assert.doesNotMatch(element('app').innerHTML,/Is there accessible attic space above/);
  click({action:'access-choice',kind:'cuts',id:'allowed'});
  assert.match(element('app').innerHTML,/Is there accessible attic space above/);
  click({action:'access-choice',kind:'attic',id:'yes'});
  assert.equal(context.testScope('state.rooms[0].surfaceMaterial'),'plaster');assert.equal(context.testScope('state.rooms[0].ceilingPath'),'attic');
  change('rooms.0.ceilingHeight','standard');
  assert.match(element('app').innerHTML,/data-occupancy="0" checked/);
  events.get('change')({target:{dataset:{occupancy:'0'},checked:false}});
  assert.equal(context.testScope('state.rooms[0].occupancy'),'vacant');
  click({action:'next'});assert.equal(context.testScope('step'),4);assert.match(element('app').innerHTML,/retain the existing light fixtures/);
  // Editing project type updates ordinary rooms but respects a deliberate room exception.
  click({action:'choose',path:'project.install',value:'new'});assert.equal(context.testScope('state.rooms[0].install'),'new');
  change('rooms.0.install','retrofit');click({action:'choose',path:'project.install',value:'remodel'});
  assert.equal(context.testScope('state.rooms[0].install'),'retrofit');
  // Card values retain number / boolean types and trigger normal dependent defaults.
  click({action:'select-option',path:'rooms.0.controlLocations',value:'2',kind:'number'});assert.equal(context.testScope('state.rooms[0].controlLocations'),2);
  click({action:'select-option',path:'rooms.0.recessGroups.0.adjustable',value:'true',kind:'string'});assert.equal(context.testScope('state.rooms[0].recessGroups[0].adjustable'),true);
  click({action:'add-shade'});click({action:'select-option',path:'rooms.0.shadeGroups.0.family',value:'palladiom_wired',kind:'string'});
  assert.equal(context.testScope('state.rooms[0].shadeGroups[0].power'),'wired');
  // Reported R3 regressions: real tape/fan choices, complete keypads, automatic second-room defaults.
  context.testScope('resetOfflineProject()');change('project.travelBand','0');
  click({action:'pick-room',name:'Kitchen'});click({action:'pick-room',name:'Dining room'});click({action:'go',step:'2'});
  click({action:'layer',id:'linear'});
  assert.deepEqual(JSON.parse(context.testScope('JSON.stringify(experienceOptions(state.rooms[0],true))')).map(x=>x[1]),['Warm dim','Tunable white','Natural white','RGBTW']);
  click({action:'select-option',path:'rooms.0.linearBehavior',value:'lumaris_warm',kind:'string'});change('rooms.0.linearFt','12','number');
  assert.match(element('app').innerHTML,/Lumaris tunable-white tape programmed to warm/);
  assert.doesNotMatch(element('app').innerHTML,/custom estimate required/);
  assert.equal(context.testScope('state.project.system'),'RA3');
  click({action:'layer',id:'fans'});
  assert.doesNotMatch(element('app').innerHTML,/>Choose the fan work<|data-path="rooms.0.fanWork" data-value="unknown"/);
  click({action:'layer',id:'keypads'});
  for(const id of ['alisse','aviena','seetouch']){
    click({action:'control-design',id});
    assert.doesNotMatch(element('app').innerHTML,/Custom estimate required|Model and system review required|Load-control arrangement|Lighting load plan/);
    assert.equal(context.testScope('M.planning(state).missingCosts'),0);
  }
  click({action:'go',step:'3'});
  click({action:'access-choice',kind:'surface',id:'drywall'});click({action:'access-choice',kind:'cuts',id:'allowed'});click({action:'access-choice',kind:'attic',id:'yes'});change('rooms.0.ceilingHeight','standard');
  click({action:'next'});assert.equal(context.testScope('roomIndex'),1);
  assert.match(element('app').innerHTML,/Starts with Kitchen/);
  assert.equal(context.testScope('state.rooms[1].surfaceMaterial'),'drywall');assert.equal(context.testScope('state.rooms[1].ceilingPath'),'attic');
  assert.equal(context.testScope('state.rooms[1].routeEvidence'),'');
  click({action:'access-choice',kind:'surface',id:'plaster'});click({action:'back'});click({action:'next'});
  assert.equal(context.testScope('state.rooms[1].surfaceMaterial'),'plaster');
  assert.equal(JSON.parse(storage.get('lighting-budget-lab.v2')).rooms[1].conditionsInheritedFrom,'Kitchen');
  assert.match(element('app').innerHTML,/Build 2026-11-17 R9/);
  console.log('PASS: application startup, progressive choices, controls-only planning, access navigation, save/reopen, customer scope privacy, typed card inputs and room exceptions (DOM event simulation).');
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});

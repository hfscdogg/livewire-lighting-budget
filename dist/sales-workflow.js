(function(root){
  'use strict';
  // Shortcuts record explicit user choices. They never approve prices or certify a route.
  const PRESETS = {
    open: {label:'Open framing', description:'Ceilings and walls in this room will be open for wiring.', facts:{surfaceMaterial:'open',surfaceAccess:'open',ceilingPath:'open',wallPath:'open',openingPermission:'extensive'}},
    drywall: {label:'Drywall; access cuts allowed', description:'Finished drywall. Include small wiring access openings; repair and painting by others.', facts:{surfaceMaterial:'drywall',surfaceAccess:'removable',ceilingPath:'closed',wallPath:'closed',openingPermission:'selective'}},
    attic: {label:'Accessible attic; wall cuts allowed', description:'Ceiling wiring is reachable in the attic. Include small wall access openings where needed; repair by others.', facts:{surfaceMaterial:'drywall',surfaceAccess:'accessible',ceilingPath:'attic',wallPath:'closed',openingPermission:'selective'}},
    plaster: {label:'Plaster; access cuts allowed', description:'Finished plaster / lath. Include careful access removal; repair and painting by others.', facts:{surfaceMaterial:'plaster',surfaceAccess:'removable',ceilingPath:'closed',wallPath:'closed',openingPermission:'selective'}},
    noCuts: {label:'Drywall; no extra cuts', description:'Keep finishes intact. New concealed wiring needs a checked route or a revised scope.', facts:{surfaceMaterial:'drywall',surfaceAccess:'obstructed',ceilingPath:'closed',wallPath:'closed',openingPermission:'none'}},
  };
  const CONDITION_KEYS=['surfaceMaterial','surfaceAccess','ceilingPath','wallPath','openingPermission','occupancy','ceilingHeight','specialConditions','access','constructionAssumed'];
  function preset(room,key){
    if(!PRESETS[key])throw Error('Choose a supported room condition.');
    Object.assign(room,PRESETS[key].facts,{ceilingFishing:'unknown',wallFishing:'unknown',routeEvidence:'',routeReviewed:false});
  }
  function accessChoice(room,kind,value){
    if(!({surface:['open','drywall','plaster'],cuts:['allowed','none'],attic:['yes','no']}[kind]||[]).includes(value))return;
    const before=JSON.stringify([room.surfaceMaterial,room.ceilingPath,room.wallPath,room.openingPermission]);
    if(kind==='surface'){
      const wasOpen=room.surfaceMaterial==='open';
      room.surfaceMaterial=value;
      if(value==='open')Object.assign(room,{surfaceAccess:'open',ceilingPath:'open',wallPath:'open',openingPermission:'extensive'});
      else {
        if(wasOpen||room.ceilingPath==='unknown')room.ceilingPath='closed';
        if(wasOpen||room.wallPath==='unknown')room.wallPath='closed';
        if(wasOpen)room.openingPermission='unknown';
      }
    }
    if(kind==='cuts')room.openingPermission=value==='allowed'?'selective':'none';
    if(kind==='attic')room.ceilingPath=value==='yes'?'attic':'closed';
    if(room.surfaceMaterial!=='open')room.surfaceAccess=room.openingPermission==='none'?'obstructed':room.ceilingPath==='attic'?'accessible':['selective','extensive'].includes(room.openingPermission)?'removable':'unknown';
    if(room.specialConditions==='unknown'){room.specialConditions='standard';room.constructionAssumed=true;}
    if(before!==JSON.stringify([room.surfaceMaterial,room.ceilingPath,room.wallPath,room.openingPermission]))Object.assign(room,{ceilingFishing:'unknown',wallFishing:'unknown',routeEvidence:'',routeReviewed:false});
  }
  function match(room){return Object.keys(PRESETS).find(key=>Object.entries(PRESETS[key].facts).every(([k,v])=>room[k]===v))||'';}
  function ordinary(room){Object.assign(room,{ceilingHeight:'standard',specialConditions:'standard',access:'normal'});}
  function copyConditions(source,target){
    // Copy only observed facts the user has explicitly confirmed also apply here.
    // Never carry a fishing verification, a support check, evidence, or a review.
    for(const key of CONDITION_KEYS)target[key]=source[key];
    Object.assign(target,{ceilingFishing:'unknown',wallFishing:'unknown',routeEvidence:'',routeReviewed:false,conditionsInheritedFrom:'',conditionsCopiedFrom:source.name});
  }
  function inheritConditions(state,index){
    const target=state.rooms[index];
    if(!target||index<1||target.conditionsInheritedFrom)return false;
    // Populate only untouched room access. Never replace a partial site answer or evidence.
    if(['surfaceMaterial','ceilingPath','wallPath','openingPermission'].some(k=>target[k]!=='unknown')||target.routeEvidence||target.routeReviewed||['verified','blocked'].includes(target.ceilingFishing)||['verified','blocked'].includes(target.wallFishing))return false;
    const source=state.rooms.slice(0,index).reverse().find(r=>r.install===target.install&&['open','drywall','plaster'].includes(r.surfaceMaterial)&&r.openingPermission!=='unknown'&&r.ceilingPath!=='unknown'&&r.wallPath!=='unknown');
    if(!source)return false;
    for(const key of CONDITION_KEYS){
      if(['surfaceMaterial','surfaceAccess','ceilingPath','wallPath','openingPermission'].includes(key)||target[key]==='unknown')target[key]=source[key];
    }
    if(target.access==='normal')target.access=source.access;
    if(target.ceilingHeight==='unknown')target.ceilingHeight='standard';
    if(target.occupancy==='unknown')target.occupancy='occupied';
    // In a no-cut room, an accessible route in another room proves nothing here.
    if(target.openingPermission==='none')Object.assign(target,{ceilingPath:'closed',wallPath:'closed',surfaceAccess:'obstructed'});
    target.constructionAssumed=target.specialConditions==='standard';
    target.conditionsInheritedFrom=source.name;
    return true;
  }
  function copyRoom(state,id,uid){
    const original=state.rooms.find(room=>room.id===id);
    if(!original||state.rooms.length>=500)return null;
    const room=structuredClone(original),base=original.name.trim().slice(0,65)||'Room';
    const names=new Set(state.rooms.map(item=>item.name.trim().toLowerCase()));
    let number=1,name=base+' copy';
    while(names.has(name.toLowerCase()))name=base+' copy '+(++number);
    Object.assign(room,{id:uid(),name,conditionsInheritedFrom:'',conditionsCopiedFrom:'',photos:[],notes:'',planReference:'',planRevision:'',driverCountOverride:null,keypadQSWiring:'new',shadeQSBackboneExisting:false,accessOpeningsOverride:null,fanSupport:'unknown',d2rConditions:'unknown',retrofitCanFit:'unknown',ceilingFishing:'unknown',wallFishing:'unknown',routeEvidence:'',routeReviewed:false});
    for(const key of CONDITION_KEYS)room[key]=key==='constructionAssumed'?false:key==='access'?'normal':'unknown';
    if(room.shadeControl==='existing')room.shadeControl='auto';
    for(const group of room.shadeGroups)if(group.power==='existing')group.power='wired';
    for(const group of [...room.recessGroups,...room.shadeGroups])group.id=uid();
    state.rooms.splice(state.rooms.indexOf(original)+1,0,room);
    return room;
  }
  function recommendation(state){
    let system=state.project.systemRequested||state.project.system;
    const Model=root.BudgetModel||(typeof require==='function'?require('./model.js'):null);
    for(const room of state.rooms){
      if((Number(room.keypadQty)>0||Number(room.existingDimmers)>0||Number(room.existingSwitches)>0)&&!['RA3','HomeWorks'].includes(system))system='RA3';
      const active=room.recessGroups.filter(group=>Number(group.qty)>0);
      if(Number(room.linearFt)>0&&room.linearBehavior==='rania')return 'HomeWorks';
      if(room.shadeGroups.some(group=>Number(group.qty)>0&&group.family==='palladiom_wired'))return 'HomeWorks';
      if(active.some(group=>['rania','ketra'].includes(group.behavior))||Number(room.keypadQty)>0&&['palladiom','alisse','aviena'].includes(room.keypadType)||room.loadTopology==='centralized')return 'HomeWorks';
      if(active.some(group=>group.behavior==='lumaris')||Number(room.linearFt)>0&&['lumaris_warm','lumaris','lumaris_rgb'].includes(room.linearBehavior))if(!['RA3','HomeWorks'].includes(system))system='RA3';
    }
    if(system==='RA3'&&state.project.systemPlan==='new'&&Model?.calculate({...state,project:{...state.project,system:'RA3'}}).needsHomeWorks)return 'HomeWorks';
    return system;
  }
  function controls(room){
    const groups=(room.recessGroups||[]).filter(g=>Number(g.qty)>0),linear=Number(room.linearFt)>0;
    const intelligent=groups.some(g=>['ketra','rania','lumaris'].includes(g.behavior))||linear&&['rania','lumaris_warm','lumaris','lumaris_rgb'].includes(room.linearBehavior);
    const conventional=groups.some(g=>!['ketra','rania','lumaris'].includes(g.behavior))||linear&&room.linearBehavior==='warm'||Number(room.decorExisting)+Number(room.decorNew)>0||Number(room.existingDimmers)>0||Number(room.existingSwitches)>0;
    const mode=intelligent||room.controlIntent==='keypads'||room.controlIntent!=='wall'&&(Number(room.keypadQty)>0||room.loadTopology==='centralized')?'keypads':'wall';
    const design=['sunnata','sunnata_hybrid'].includes(room.keypadType)?'sunnata':room.keypadType;
    return {mode,design,intelligent,conventional,walls:room.wallPreference==='keypads_only'||room.wallPreference!=='local'&&room.loadTopology==='centralized'?'keypads_only':'local'};
  }
  function clearOverrides(room,keys){room.budgetOverrides=(room.budgetOverrides||'').split(',').filter(key=>key&&!keys.includes(key)).join(',');}
  function chooseControls(room,value){
    if(!['wall','keypads'].includes(value))return;
    room.controlIntent=value;clearOverrides(room,['keypadQty']);
    if(value==='wall'){room.keypadQty=0;room.wallPreference='auto';room.loadTopology='auto';clearOverrides(room,['loadTopology']);}
    else room.keypadQty=Math.max(1,Number(room.keypadQty)||0);
  }
  function chooseDesign(room,value){
    if(!['sunnata','palladiom','alisse','aviena','seetouch'].includes(value))return;
    room.keypadType=value;clearOverrides(room,['keypadType']);
    if(value==='sunnata')room.keypadType=defaults(room).keypadType;
    else override(room,'keypadType');
  }
  function chooseWalls(room,value){if(!['local','keypads_only'].includes(value))return;room.wallPreference=value;clearOverrides(room,['loadTopology']);}
  const AUTO_FIELDS=['powerPlan','keypadLocation','controlLocation','keypadQSWiring','routeLength','keypadType','keypadQty','loadTopology'];
  function defaults(room){const controlsOnly=(Number(room.existingDimmers)>0||Number(room.existingSwitches)>0||room.roomFocus==='controls')&&!room.recessGroups.some(g=>Number(g.qty)>0)&&!Number(room.linearFt)&&!Number(room.decorNew)&&!Number(room.decorExisting)&&!Number(room.fanQty);const newWork=room.install==='new'&&!controlsOnly;const dimmed=Number(room.existingDimmers)>0||room.recessGroups.some(g=>Number(g.qty)>0&&!['ketra','rania','lumaris'].includes(g.behavior)&&g.control==='dimmer')||Number(room.linearFt)>0&&room.linearBehavior==='warm'&&room.linearControl==='dimmer'||(Number(room.decorExisting)+Number(room.decorNew)>0&&room.decorControl==='dimmer');return {keypadType:dimmed&&room.loadTopology!=='centralized'?'sunnata_hybrid':'sunnata',powerPlan:newWork?'new':'existing',keypadLocation:newWork?'new':'existing',controlLocation:newWork?'new':'existing',keypadQSWiring:'new',routeLength:'medium'};}
  function override(room,key){if(!AUTO_FIELDS.includes(key))return;room.budgetOverrides=[...new Set((room.budgetOverrides||'').split(',').filter(Boolean).concat(key))].join(',');}
  function resetDefaults(room){room.autoBudgetDefaults=true;room.budgetOverrides='';Object.assign(room,defaults(room));}
  function fixtureOptions(room,adjustable=false,housing='auto'){
    return ['warm','rania','lumaris','ketra'].filter(id=>!(adjustable&&id==='lumaris')&&!(housing==='reuse'&&['rania','ketra'].includes(id))&&!(room.surfaceMaterial!=='open'&&(room.surfaceMaterial!=='unknown'||room.install!=='new')&&room.d2rConditions==='incompatible'&&['rania','ketra'].includes(id)));
  }
  function nextConditionsRoom(state,index,requirements){
    for(let i=index+1;i<state.rooms.length;i++)if(!state.rooms[i].conditionsCopiedFrom||(requirements||[]).some(x=>x.step===3&&(x.index<0||x.index===i)))return i;
    return -1;
  }
  function synchronize(state){
    for(const room of state.rooms)for(const g of room.recessGroups){
      // Preserve tunable white when the direction changes; Lumaris has no adjustable model.
      if(g.behavior==='lumaris'&&g.adjustable&&g.housing!=='reuse')g.behavior='rania';
    }
    for(const room of state.rooms){
      const manual=(room.budgetOverrides||'').split(',');
      if(room.controlIntent==='keypads'&&!manual.includes('keypadQty'))room.keypadQty=Math.max(1,Number(room.keypadQty)||0);
      if(['local','keypads_only'].includes(room.wallPreference)&&!manual.includes('loadTopology'))room.loadTopology=room.wallPreference==='keypads_only'&&controls(room).conventional?'centralized':'auto';
    }
    for(const room of state.rooms)if(room.autoBudgetDefaults){const overrides=(room.budgetOverrides||'').split(',');for(const [key,value]of Object.entries(defaults(room)))if(!overrides.includes(key)&&!(key==='keypadType'&&!['sunnata','sunnata_hybrid'].includes(room[key])))room[key]=value;}

    const next=recommendation(state),before=state.project.system;
    if(next!==before){if(!state.project.systemRequested)state.project.systemRequested=before;state.project.system=next;return true;}
    return false;
  }
  function noCutSegments(room,routes){
    if(room.openingPermission!=='none')return [];
    const segments=(routes||[]).filter(route=>route.roomId===room.id).flatMap(route=>route.segments).filter(segment=>segment.kind!=='shared');
    return [...new Map(segments.map(segment=>[segment.kind,segment])).values()];
  }
  // A pricing/system review is one estimating handoff, not a sales question per line item.
  function reviewGroup(issue,rooms){
    if(issue.key.startsWith('input_config_'))return {kind:'estimator',index:-1,target:'pricing'};
    const index=rooms.findIndex(room=>issue.key.includes(room.id));
    if(issue.key==='installation_allowances')return {kind:'estimator',index:-1,target:'pricing'};
    if(/^fan_(work|support|special|speed|control)_/.test(issue.key))return {kind:'room',index,target:'room',layer:'fans'};
    if(/^input_/.test(issue.key)&&/existingDimmers|existingSwitches/.test(issue.key))return {kind:'room',index,target:'room',layer:'existing'};
    if(/^(integer_|linear_quantity_|input_)/.test(issue.key))return {kind:'room',index,target:'room',layer:'overview'};
    if(/^(installation_|surface_|route_long)/.test(issue.key))return {kind:'room',index,target:'conditions'};
    if(/^(fan_speed_|fan_motor_|fan_type_|linear_zone_lengths_|linear_sections_|shade_size_|shade_style_|shade_family_)/.test(issue.key))return {kind:'room',index,target:'room',layer:issue.key.startsWith('shade_')?'shades':'linear'};
    if(/^(travel|system_plan|system_unsure)/.test(issue.key))return {kind:'project',index:-1,target:'project'};
    return {kind:'estimator',index,target:'pricing'};
  }
  function requirements(state, calculation){
    const out=[];
    for(const issue of calculation.issues||[]){
      // Older calculations may still contain this legacy review-only issue.
      if((root.InstallationModel||(typeof require==='function'?require('./installation'):null))?.deferredCeilingIssue(issue,state.rooms))continue;
      if(issue.key.startsWith('sku_')&&(calculation.issues||[]).some(x=>x.key==='price_'+issue.key.slice(4)))continue;
      let index=state.rooms.findIndex(r=>issue.key.includes(r.id));
      const productId=issue.key.replace(/^(price_|sku_|compat_|device_|missing_)/,'');
      const product=(calculation.materials||[]).find(line=>line.id===productId);
      if(index<0&&product)index=state.rooms.findIndex(r=>r.id===product.groupId);
      const r=state.rooms[index];
      let page=2,layer='overview',field='',kind='selection',message=issue.message;
      if(/^(date|travel|travel_distance|network_plan)$/.test(issue.key)){page=0;field=issue.key==='date'?'project.date':'project.travelBand';}
      else if(issue.key==='control_plan'){page=state.project.system==='unsure'?2:0;field='project.systemPlan';}
      else if(issue.key==='rooms'){page=1;}
      else if(issue.key==='scope_empty'){page=state.rooms.length?2:1;index=state.rooms.length?0:-1;layer='recessed';}
      else if(/^(installation_|surface_|route_long_|power_plan_|shade_surface_)/.test(issue.key)){
        page=3;layer='';
        if(issue.key.startsWith('installation_route_shared')){
          index=state.rooms.findIndex(room=>!room.ceilingPath||room.ceilingPath==='unknown'||room.ceilingPath==='closed'&&!['selective','extensive'].includes(room.openingPermission)&&!(room.ceilingFishing==='verified'&&room.routeEvidence?.trim()));
          message='Confirm the room access below so wiring to the control equipment can be included automatically.';
        }
        if(index<0)index=0;
      }
      else if(issue.key.startsWith('d2r_site_')){page=3;layer='';kind='site';field=index>=0?'rooms.'+index+'.d2rConditions':'';message=(r?.name||'This room')+': the recorded ceiling conditions are incompatible with the selected D2R fixtures. Revise the fixture selection or resolve the recorded condition.';}
      else if(/^retrofit_can_/.test(issue.key)){page=3;layer='';kind='site';}
      else if(/^retrofit_family_/.test(issue.key)){layer='recessed';kind='review';}
      else if(/^(price_|sku_|missing_|compat_|device_)/.test(issue.key)){
        kind='pricing';
        if(/^fixture_/.test(productId))layer='recessed';
        else if(/^(linear_|driver_|rania_)/.test(productId))layer='linear';
        else if(/^fan_/.test(productId))layer='fans';
        else if(/^decor_/.test(productId))layer='decorative';
        else if(/^shade_/.test(productId))layer='shades';
        else if(/keypad/.test(productId))layer='keypads';
        if(issue.key.startsWith('price_')){
          const source=state.config?.catalog?.find(x=>x.id===productId)?.source||'';
          const missing=source.match(/Missing trim ([A-Z0-9-]+)/i);
          message=(product?.name||'Selected equipment')+(missing?': module, mount and power supply are priced; trim '+missing[1]+' is not priced in the supplied workbook.':': a complete company price is not available.')+' Choose a priced option or save this selection for estimating; it cannot produce a complete customer budget yet.';
        }
      }
      else if(/^(fan_|input_.*fan)/.test(issue.key))layer='fans';
      else if(/^(linear_|rania_|driver_|lumaris_circuits|ketra_linear)/.test(issue.key))layer='linear';
      else if(/^shade_/.test(issue.key)||r?.shadeGroups.some(g=>issue.key.includes(g.id)))layer='shades';
      else if(/^(decor_|shared_.*decor|input_.*decor)/.test(issue.key))layer='decorative';
      else if(/^(lumaris_adjustable|retrofit_|d2r_|input_|integer_)/.test(issue.key))layer='recessed';
      else kind='review';
      const affected=kind==='pricing'?[...new Set((calculation.materials||[]).filter(line=>line.id===productId).map(line=>state.rooms.findIndex(room=>room.id===line.groupId)).filter(i=>i>=0))]:[];
      for(const target of affected.length?affected:[index])out.push({...issue,message,step:page,index:target,layer,field,kind});
    }
    return out;
  }
  const api={fixtureOptions,nextConditionsRoom,inheritConditions,accessChoice,controls,chooseControls,chooseDesign,chooseWalls,AUTO_FIELDS,defaults,override,resetDefaults,PRESETS,CONDITION_KEYS,preset,match,ordinary,copyConditions,copyRoom,recommendation,synchronize,noCutSegments,reviewGroup,requirements};
  root.SalesWorkflow=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

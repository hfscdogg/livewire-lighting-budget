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
  const CONDITION_KEYS=['surfaceMaterial','surfaceAccess','ceilingPath','wallPath','openingPermission','occupancy','ceilingHeight','specialConditions','access'];
  function preset(room,key){
    if(!PRESETS[key])throw Error('Choose a supported room condition.');
    Object.assign(room,PRESETS[key].facts,{ceilingFishing:'unknown',wallFishing:'unknown',routeEvidence:'',routeReviewed:false});
  }
  function match(room){return Object.keys(PRESETS).find(key=>Object.entries(PRESETS[key].facts).every(([k,v])=>room[k]===v))||'';}
  function ordinary(room){Object.assign(room,{ceilingHeight:'standard',specialConditions:'standard',access:'normal'});}
  function copyConditions(source,target){
    // Copy only observed facts the user has explicitly confirmed also apply here.
    // Never carry a fishing verification, a support check, evidence, or a review.
    for(const key of CONDITION_KEYS)target[key]=source[key];
    Object.assign(target,{ceilingFishing:'unknown',wallFishing:'unknown',routeEvidence:'',routeReviewed:false});
  }
  function copyRoom(state,id,uid){
    const original=state.rooms.find(room=>room.id===id);
    if(!original||state.rooms.length>=500)return null;
    const room=structuredClone(original),base=original.name.trim().slice(0,65)||'Room';
    const names=new Set(state.rooms.map(item=>item.name.trim().toLowerCase()));
    let number=1,name=base+' copy';
    while(names.has(name.toLowerCase()))name=base+' copy '+(++number);
    Object.assign(room,{id:uid(),name,photos:[],notes:'',planReference:'',planRevision:'',driverCountOverride:null,keypadQSWiring:'new',shadeQSBackboneExisting:false,accessOpeningsOverride:null,fanSupport:'unknown',d2rConditions:'unknown',ceilingFishing:'unknown',wallFishing:'unknown',routeEvidence:'',routeReviewed:false});
    for(const key of CONDITION_KEYS)room[key]=key==='access'?'normal':'unknown';
    if(room.shadeControl==='existing')room.shadeControl='auto';
    for(const group of room.shadeGroups)if(group.power==='existing')group.power='wired';
    for(const group of [...room.recessGroups,...room.shadeGroups])group.id=uid();
    state.rooms.splice(state.rooms.indexOf(original)+1,0,room);
    return room;
  }
  function recommendation(state){
    let system=state.project.system;
    const Model=root.BudgetModel||(typeof require==='function'?require('./model.js'):null);
    if(system==='RA3'&&state.project.systemPlan==='new'&&Model?.calculate(state).needsHomeWorks)return 'HomeWorks';
    for(const room of state.rooms){
      const active=room.recessGroups.filter(group=>Number(group.qty)>0);
      if(Number(room.linearFt)>0&&room.linearBehavior==='rania')return 'HomeWorks';
      if(room.shadeGroups.some(group=>Number(group.qty)>0&&group.family==='palladiom_wired'))return 'HomeWorks';
      if(active.some(group=>['rania','ketra'].includes(group.behavior))||Number(room.keypadQty)>0&&['palladiom','alisse','aviena'].includes(room.keypadType)||room.loadTopology==='centralized')return 'HomeWorks';
      if(active.some(group=>group.behavior==='lumaris')||Number(room.linearFt)>0&&['lumaris','lumaris_rgb'].includes(room.linearBehavior))if(!['RA3','HomeWorks'].includes(system))system='RA3';
    }
    return system;
  }
  const AUTO_FIELDS=['powerPlan','keypadLocation','controlLocation','keypadQSWiring','routeLength'];
  function defaults(room){return {powerPlan:room.install==='new'?'new':'existing',keypadLocation:room.install==='new'?'new':'existing',controlLocation:room.install==='new'?'new':'existing',keypadQSWiring:'new',routeLength:'medium'};}
  function override(room,key){if(!AUTO_FIELDS.includes(key))return;room.budgetOverrides=[...new Set((room.budgetOverrides||'').split(',').filter(Boolean).concat(key))].join(',');}
  function resetDefaults(room){room.autoBudgetDefaults=true;room.budgetOverrides='';Object.assign(room,defaults(room));}
  function synchronize(state){
    for(const room of state.rooms)if(room.autoBudgetDefaults){const overrides=(room.budgetOverrides||'').split(',');for(const [key,value]of Object.entries(defaults(room)))if(!overrides.includes(key))room[key]=value;}

    const next=recommendation(state),before=state.project.system;
    if(next!==before){state.project.system=next;return true;}
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
    if(/^(integer_|linear_quantity_|input_)/.test(issue.key))return {kind:'room',index,target:'room',layer:'overview'};
    if(/^(installation_|surface_|route_long)/.test(issue.key))return {kind:'room',index,target:'conditions'};
    if(/^(fan_speed_|fan_motor_|fan_type_|linear_zone_lengths_|linear_sections_|shade_size_|shade_style_|shade_family_)/.test(issue.key))return {kind:'room',index,target:'room',layer:issue.key.startsWith('shade_')?'shades':'linear'};
    if(/^(travel|system_plan|system_unsure)/.test(issue.key))return {kind:'project',index:-1,target:'project'};
    return {kind:'estimator',index,target:'pricing'};
  }
  function requirements(state, calculation){
    const out=[];
    for(const issue of calculation.issues||[]){
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
      else if(issue.key.startsWith('d2r_site_')){page=3;layer='';kind='site';field=index>=0?'rooms.'+index+'.d2rConditions':'';message=(r?.name||'This room')+': confirm that the ceiling can accept the selected D2R remodel lights. Answer the ceiling suitability question below; a product price does not establish physical clearance.';}
      else if(/^retrofit_can_/.test(issue.key)){page=3;layer='';kind='site';}
      else if(/^retrofit_family_/.test(issue.key)){layer='recessed';kind='review';}
      else if(/^(price_|sku_|missing_|compat_|device_)/.test(issue.key)){
        kind='pricing';
        if(/^fixture_/.test(productId))layer='recessed';
        else if(/^(linear_|driver_|rania_)/.test(productId))layer='linear';
        else if(/^fan_/.test(productId))layer='fans';
        else if(/^decor_/.test(productId))layer='decorative';
        else if(/^shade_/.test(productId))layer='shades';
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
  const api={AUTO_FIELDS,defaults,override,resetDefaults,PRESETS,CONDITION_KEYS,preset,match,ordinary,copyConditions,copyRoom,recommendation,synchronize,noCutSegments,reviewGroup,requirements};
  root.SalesWorkflow=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

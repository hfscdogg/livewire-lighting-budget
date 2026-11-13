(function(root){
  'use strict';
  // Shortcuts record explicit user choices. They never approve prices or certify a route.
  const PRESETS = {
    open: {label:'Open framing', description:'Ceilings and walls in this room will be open for wiring.', facts:{surfaceMaterial:'open',surfaceAccess:'open',ceilingPath:'open',wallPath:'open',openingPermission:'extensive'}},
    drywall: {label:'Drywall; access cuts allowed', description:'Finished drywall. Include small wiring access openings; repair and painting by others.', facts:{surfaceMaterial:'drywall',surfaceAccess:'removable',ceilingPath:'closed',wallPath:'closed',openingPermission:'selective'}},
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
    Object.assign(room,{id:uid(),name,photos:[],notes:'',planReference:'',planRevision:'',driverCountOverride:null,keypadQSWiring:'new',shadeQSBackboneExisting:false,accessOpeningsOverride:null,fanSupport:'unknown',ceilingFishing:'unknown',wallFishing:'unknown',routeEvidence:'',routeReviewed:false});
    for(const key of CONDITION_KEYS)room[key]=key==='access'?'normal':'unknown';
    if(room.shadeControl==='existing')room.shadeControl='auto';
    for(const group of room.shadeGroups)if(group.power==='existing')group.power='wired';
    for(const group of [...room.recessGroups,...room.shadeGroups])group.id=uid();
    state.rooms.splice(state.rooms.indexOf(original)+1,0,room);
    return room;
  }
  function recommendation(state){
    let system=state.project.system;
    for(const room of state.rooms){
      const active=room.recessGroups.filter(group=>Number(group.qty)>0);
      if(room.shadeGroups.some(group=>Number(group.qty)>0&&group.family==='palladiom_wired'))return 'HomeWorks';
      if(active.some(group=>['rania','ketra'].includes(group.behavior))||Number(room.keypadQty)>0&&['palladiom','alisse','aviena'].includes(room.keypadType)||room.loadTopology==='centralized')return 'HomeWorks';
      if(active.some(group=>group.behavior==='lumaris')||Number(room.linearFt)>0&&['lumaris','lumaris_rgb'].includes(room.linearBehavior))if(!['RA3','HomeWorks'].includes(system))system='RA3';
    }
    return system;
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
  const api={PRESETS,CONDITION_KEYS,preset,match,ordinary,copyConditions,copyRoom,recommendation,reviewGroup};
  root.SalesWorkflow=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

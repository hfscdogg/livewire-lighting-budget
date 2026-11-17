(function (root) {
  'use strict';

  // Installation facts are independent of price and equipment selection. Unknown
  // access remains unknown when a project is imported or its price list changes.
  const ROOM_DEFAULTS = {
    ceilingPath: 'unknown', wallPath: 'unknown', openingPermission: 'unknown',
    ceilingFishing: 'unknown', wallFishing: 'unknown', routeEvidence: '',
    occupancy: 'unknown', ceilingHeight: 'unknown', specialConditions: 'unknown',
    d2rConditions: 'unknown', retrofitCanFit: 'unknown', decorativeComplexity: 'standard', planReference: '', planRevision: '',
  };
  const PROJECT_DEFAULTS = {
    sharedPath: 'unknown', sharedFishing: 'unknown', sharedOpenings: 'unknown',
    sharedSurface: 'unknown', sharedEvidence: '',
  };
  const ENUMS = {
    ceilingPath: ['unknown', 'open', 'attic', 'below', 'closed'],
    wallPath: ['unknown', 'open', 'accessible', 'closed'],
    openingPermission: ['unknown', 'selective', 'extensive', 'none'],
    ceilingFishing: ['unknown', 'verified', 'blocked'], wallFishing: ['unknown', 'verified', 'blocked'],
    occupancy: ['unknown', 'vacant', 'occupied'],
    roomFocus: ['auto','lighting','controls'], controlIntent: ['auto','wall','keypads'], wallPreference: ['auto','local','keypads_only'],
    ceilingHeight: ['unknown', 'standard', 'tall', 'special'],
    specialConditions: ['unknown', 'standard', 'masonry', 'rated', 'hazard', 'structural'],
    d2rConditions: ['unknown', 'suitable', 'incompatible'],
    retrofitCanFit: ['unknown', 'suitable', 'incompatible'],
    decorativeComplexity: ['standard', 'special'],
    sharedPath: ['unknown', 'open', 'accessible', 'closed'],
    sharedFishing: ['unknown', 'verified', 'blocked'],
    sharedOpenings: ['unknown', 'selective', 'extensive', 'none'],
    sharedSurface: ['unknown', 'drywall', 'plaster'],
  };
  const TASKS = [
    ['fan_install', 'Assemble, hang, connect and balance owner-supplied fan', 'fan', 2.0],
    ['fan_remove', 'Disconnect and remove existing fan', 'fan', 0.5],
    ['fan_support_check', 'Verify existing fan-rated support', 'fan', 0.25],
    ['fan_support_install', 'Install fan-rated box and support brace', 'fan', 1.0],
    ['route_prepare', 'Lay out and prepare a cable pull', 'pull', 0.20],
    ['route_fish_setup', 'Set up a concealed cable pull', 'pull', 0.35],
    ['attic_setup', 'Access and protect attic / crawl work area', 'room', 0.50],
    ['open_drywall_area', 'Open drywall along an approved wiring route', 'sq ft', 0.08],
    ['open_plaster_area', 'Open plaster / lath along an approved wiring route', 'sq ft', 0.16],
    ['occupied_protection', 'Protect contents and isolate work in occupied room', 'room', 0.75],
  ];
  const ALLOWANCES = {
    accessiblePullFactor: 1.25, extensivePullFactor: 1.15,
    selectiveOpeningSpacingFt: 25, accessStripWidthFt: 1, tallInstallFactor: 1.25,
  };
  const pathNames = { ceiling: 'ceiling route', wall: 'wall route', shared: 'route to shared equipment' };
  const METHODS = {
    open: 'open framing', accessible: 'accessible cavity', attic: 'accessible attic', below: 'access from below',
    fish: 'verified fishing route', selective: 'selective access openings', extensive: 'continuous access strips',
    unresolved: 'route to confirm', blocked: 'openings or a different route required',
  };
  function segment(facts, kind, surface, allowances, factors) {
    const path = facts[kind + 'Path'] || 'unknown';
    const fishing = facts[kind + 'Fishing'] || 'unknown';
    const permission = kind === 'shared' ? facts.sharedOpenings : facts.openingPermission;
    const evidence = String(kind === 'shared' ? facts.sharedEvidence || '' : facts.routeEvidence || '').trim();
    const out = { kind, path, surface, method: 'unresolved', factor: 1, status: 'hold', message: '' };
    if (path === 'closed' && !['drywall','plaster'].includes(surface)) { out.message='Confirm the finished surface along this concealed route.';out.description=pathNames[kind]+' using '+METHODS[out.method];return out; }
    if (path === 'open') Object.assign(out, { method: 'open', status: 'ready' });
    else if (['attic', 'below', 'accessible'].includes(path)) Object.assign(out, { method: path, factor: allowances.accessiblePullFactor, status: 'ready' });
    else if (path === 'closed') {
      if (['selective', 'extensive'].includes(permission)) {
        if (!['drywall', 'plaster'].includes(surface)) out.message = 'Confirm the surface before budgeting access removal.';
        else Object.assign(out, { method: permission, status: 'ready', factor: permission === 'extensive' ? allowances.extensivePullFactor : factors[surface === 'plaster' ? 'removablePlaster' : 'removableDrywall'] });
      } else if (fishing === 'verified' && evidence) {
        Object.assign(out, { method: 'fish', status: 'ready', factor: factors[surface === 'plaster' ? 'closedPlaster' : 'closedDrywall'] });
      } else if (fishing === 'blocked') {
        out.method = 'blocked';
        out.message = 'The concealed route is blocked. Access openings or a different installation route must be agreed before pricing can be approved.';
      } else {
        out.message = permission === 'none'
          ? 'New wiring has no accessible route and cutting is not permitted. Confirm and document a fishable route, obtain permission for openings, or revise the scope.'
          : 'Confirm a fishable route or agree which access openings are permitted before approving the budget.';
      }
    } else out.message = 'Confirm how this cable route can be reached. The construction label alone does not establish access.';
    if (fishing === 'verified' && path === 'closed' && !evidence && !['selective', 'extensive'].includes(permission)) out.message = 'Record the observed route or survey reference supporting the no-opening installation.';
    if (!Number.isFinite(out.factor) || out.factor < 1) { out.status = 'hold'; out.factor = 1; out.message = 'The installation method allowance needs pricing review.'; }
    out.inferred=kind==='shared'&&facts.sharedInferred===true;
    out.description = pathNames[kind] + ' using ' + (out.inferred&&out.method==='fish'?'inferred fishing allowance':METHODS[out.method]);
    return out;
  }
  function fixtureBuild(room,group){
    if(group.housing==='reuse')return 'retrofit';
    if(room.surfaceMaterial==='open')return 'new';
    if(['drywall','plaster'].includes(room.surfaceMaterial))return 'remodel';
    return room.install==='new'?'new':'remodel';
  }
  function ceilingCheck(value){return value===undefined||value===null||value===''||value===false?'unknown':value;}
  function deferredCeilingIssue(issue,rooms){
    return rooms.some(room=>issue.key==='d2r_site_'+room.id&&ceilingCheck(room.d2rConditions)!=='incompatible');
  }
  function estimatorNotes(rooms){
    return rooms.flatMap(room=>{
      if(['suitable','incompatible'].includes(ceilingCheck(room.d2rConditions)))return [];
      const groups=(room.recessGroups||[]).filter(g=>Number(g.qty)>0&&['rania','ketra'].includes(g.behavior)&&fixtureBuild(room,g)!=='retrofit');
      if(!groups.length)return [];
      const remodel=groups.some(g=>fixtureBuild(room,g)==='remodel');
      return [{key:(remodel?'d2r_site_':'d2_site_')+room.id,roomId:room.id,roomName:room.name,
        message:'Before ordering Rania/Ketra '+(remodel?'D2R':'D2')+' fixtures, confirm ceiling suitability, '+(remodel?'insulation separation, fire rating, cutout size, ceiling thickness/depth':'the specified housing insulation/fire-rating suitability, ceiling thickness/depth and opening')+' and the complete mounting, power and trim assembly. Resolve any required changes within the approved scope and budget before releasing the order.'}];
    });
  }
  function needsRecessedWiring(room){return room.recessGroups?.some(g=>g.qty>0&&fixtureBuild(room,g)!=='retrofit');}
  function plan(room, project, taskId, reason, cfg) {
    const allowances = { ...ALLOWANCES, ...cfg.installationAllowances };
    const factors = cfg.laborFactors || {};
    let kinds;
    if (!room) kinds = ['shared'];
    else if (taskId === 'linear_lead_run' || taskId === 'control_drop') kinds = ['wall'];
    else if (taskId === 'branch_run') kinds = /between recessed fixtures/.test(reason) ? ['ceiling'] : needsRecessedWiring(room) || room.decorNew>0 || room.fanWork==='new'&&room.fanQty>0 ? ['ceiling', 'wall'] : ['wall'];
    else if (taskId === 'load_homerun') kinds = needsRecessedWiring(room) || room.decorNew>0 || room.fanWork==='new'&&room.fanQty>0 ? ['ceiling', 'wall', 'shared'] : ['wall', 'shared'];
    else kinds = ['wall', 'shared'];
    const segments = kinds.map(kind => segment(kind === 'shared' ? project : room, kind, kind === 'shared' ? project.sharedSurface : room.surfaceMaterial, allowances, factors));
    return { status: segments.some(x => x.status === 'hold') ? 'hold' : 'ready', factor: Math.max(1, ...segments.map(x => x.factor)), segments };
  }
  function roomIssues(room, active) {
    if (!active) return [];
    const out = [];
    if (!['open','drywall','plaster'].includes(room.surfaceMaterial)) out.push('Confirm the mounting / finished surface before approving installation work.');
    if (!['unknown','vacant','occupied'].includes(room.occupancy)) out.push('Choose a supported occupancy allowance.');
    const overhead=room.recessGroups?.some(g=>Number(g.qty)>0)||Number(room.decorNew)>0||Number(room.decorExisting)>0||Number(room.fanQty)>0&&['replace','new'].includes(room.fanWork)||room.shadeGroups?.some(g=>Number(g.qty)>0);
    if (overhead&&!['standard', 'tall'].includes(room.ceilingHeight)) out.push(room.ceilingHeight === 'special' ? 'High, sloped or stairwell work requires an access plan and priced lift / scaffold and setup allowance.' : 'Confirm working height before approving installation labor.');
    if (room.specialConditions !== 'standard') out.push('Masonry, rated assemblies, structural changes, suspected hazardous material or unknown construction require a separate reviewed method and priced scope.');
    if ((room.decorExisting || room.decorNew) && room.decorativeComplexity !== 'standard') out.push('Heavy, fragile or assembly-intensive decorative fixtures require a fixture-specific handling and support allowance.');
    return out;
  }
  function sharedFacts(project, rooms) {
    // An explicit estimator override wins. Otherwise carry a planning allowance
    // from the observed room access, without recording a new field verification.
    if (project.sharedPath && project.sharedPath !== 'unknown') return project;
    const active=rooms.filter(r=>r.recessGroups?.some(g=>Number(g.qty)>0)||Number(r.linearFt)>0||Number(r.decorNew)>0||Number(r.decorExisting)>0||Number(r.fanQty)>0||Number(r.keypadQty)>0||Number(r.existingDimmers)>0||Number(r.existingSwitches)>0||r.shadeGroups?.some(g=>Number(g.qty)>0));
    if (!active.length) return project;
    const inferred={...project,sharedInferred:true,sharedPath:'unknown',sharedSurface:active.some(r=>r.surfaceMaterial==='plaster')?'plaster':'drywall',sharedOpenings:'unknown',sharedFishing:'unknown',sharedEvidence:''};
    const methods=active.map(r=>{
      if(r.ceilingPath==='open')return 'open';
      if(['attic','below'].includes(r.ceilingPath)||r.wallPath==='accessible')return 'accessible';
      if(r.ceilingPath==='unknown'||!r.ceilingPath)return 'unknown';
      if(r.ceilingPath==='closed'){
        if(['selective','extensive'].includes(r.openingPermission))return r.openingPermission;
        if(r.ceilingFishing==='verified'&&String(r.routeEvidence||'').trim())return 'fish';
        return 'unknown';
      }
      return 'unknown';
    });
    if(methods.includes('unknown'))return inferred;
    if(methods.every(x=>x==='open'))inferred.sharedPath='open';
    else if(methods.every(x=>['open','accessible'].includes(x)))inferred.sharedPath='accessible';
    else {
      inferred.sharedPath='closed';
      if(methods.includes('fish')){
        // No opening permission is invented for a no-cut room. Carry fishing
        // across the connection allowance and identify it explicitly as inferred.
        inferred.sharedOpenings='none';inferred.sharedFishing='verified';
        inferred.sharedEvidence='Planning allowance inferred from documented room fishing access; connecting routes have not been separately surveyed.';
      } else inferred.sharedOpenings=methods.includes('selective')?'selective':'extensive';
    }
    return inferred;
  }
  function roomScope(room, routes, result) {
    const lines = [];
    const methods = [...new Set(routes.flatMap(x => x.segments.filter(y => y.kind !== 'shared').map(y => y.description)))];
    if (routes.length) lines.push('Install the required branch and/or low-voltage wiring with ' + (methods.length ? methods.join('; ') : 'the shared routing described below') + '.');
    else if (room.recessGroups?.some(g=>g.qty>0)&&room.recessGroups.filter(g=>g.qty>0).every(g=>fixtureBuild(room,g)==='retrofit')) lines.push('Replace fixtures at existing locations and reuse suitable existing wiring and housings after verification.');
    if (room.fanQty>0) lines.push(room.fanWork==='new'?'Install owner-supplied ceiling fans at new locations with fan-rated support and new wiring.':room.fanWork==='replace'?'Remove existing fans and install owner-supplied replacement fans; verify or replace the selected support and reuse suitable wiring.':'Retain the existing ceiling fans; only the selected controls are included.');
    if (result?.controlQty) lines.push('Install and connect the specified switches, dimmers or fan controls and check operation.');
    if (result?.keypadQty) lines.push('Install the lighting keypads and configure the agreed room controls.');
    if (routes.some(x => x.segments.some(y => y.kind !== 'shared' && y.method === 'open'))) lines.push('Open framing must be available for rough-in. Finish removal by others is not included unless specifically described.');
    if (routes.some(x => x.segments.some(y => y.method === 'selective'))) lines.push('Selective drywall or plaster openings are included for cable access. Opening locations will be coordinated before work.');
    if (routes.some(x => x.segments.some(y => y.method === 'extensive'))) lines.push('Open drywall or plaster in strips along the required routes. Removal is included; reinstatement, patching and painting are excluded.');
    if (routes.some(x => x.segments.some(y=>y.method==='blocked'))) lines.push('A blocked wiring route requires access openings or an alternative installation method. This work cannot proceed with the present no-opening restriction.');
    if (routes.some(x => x.status === 'hold')) lines.push('Wiring access remains unresolved. Openings or a confirmed alternative route must be agreed before this scope receives a customer budget.');
    if (room.constructionAssumed) lines.push('Installation allowance assumes ordinary framing and a clear, level working floor; unusual construction or access requires a revised scope.');
    if (room.occupancy !== 'vacant') lines.push(room.occupancy === 'occupied' ? 'Protect furnishings and isolate the work area during installation.' : 'Allow for protecting furnishings and isolating the work area during installation; occupancy has not yet been confirmed.');
    if (result?.shadeQty) lines.push('Measure, install and test the selected shade assemblies and their specified power and controls.');
    return lines;
  }
  function sharedScope(routes) {
    const segments = routes.flatMap(route=>route.segments.filter(segment=>segment.kind==='shared'));
    const lines=[];
    if(segments.some(segment=>segment.inferred))lines.push('Wiring between rooms and the control equipment is budgeted using the construction and access conditions entered for the rooms, with typical medium runs. This is an installation allowance; final routing will be coordinated during design.');
    if(segments.some(segment=>segment.method==='open'))lines.push('Run shared equipment cabling through open framing provided for rough-in.');
    if(segments.some(segment=>segment.method==='accessible'))lines.push('Run shared equipment cabling through the accessible ceiling, floor or chase routes.');
    if(segments.some(segment=>segment.method==='fish'))lines.push(segments.some(segment=>segment.inferred)?'Allow for fishing cable between rooms and control equipment using the entered no-opening access conditions. No additional access openings are assumed.':'Fish shared equipment cabling through the verified concealed routes.');
    if(segments.some(segment=>segment.method==='selective'))lines.push('Provide selective drywall or plaster openings for shared equipment cabling. Repair and painting are excluded.');
    if(segments.some(segment=>segment.method==='extensive'))lines.push('Remove drywall or plaster in access strips for shared equipment cabling. Reinstatement, patching and painting are excluded.');
    if(segments.some(segment=>segment.status==='hold'))lines.push('Shared equipment wiring requires a confirmed route and any necessary opening permission before a customer budget can be released.');
    return lines;
  }
  const api = { ceilingCheck, deferredCeilingIssue, estimatorNotes, fixtureBuild, needsRecessedWiring, sharedFacts, ROOM_DEFAULTS, PROJECT_DEFAULTS, ENUMS, TASKS, ALLOWANCES, METHODS, plan, roomIssues, roomScope, sharedScope };
  root.InstallationModel = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

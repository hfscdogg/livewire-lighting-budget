(function(root){
  'use strict';
  const M=root.BudgetModel||(typeof require==='function'?require('./model'):null);
  const Customer=root.CustomerReport||(typeof require==='function'?require('./customer-report'):null);
  const Photos=root.JobPhotos||(typeof require==='function'?require('./job-photos'):null);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const quantity=value=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(value)||0);
  const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
  const amount=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
  const labels={open:'Open framing',drywall:'Drywall',plaster:'Plaster',unknown:'Not checked',suitable:'Installer confirmed suitable',incompatible:'Recorded incompatibility',standard:'Standard',tall:'Tall ceiling',special:'Specialty conditions',vacant:'Vacant',occupied:'Occupied / furnished',selective:'Selective access cuts allowed',extensive:'Extensive access removal allowed',none:'No extra access cuts',attic:'Accessible attic',below:'Access from below',closed:'Finished / concealed',accessible:'Accessible cavity or chase',verified:'Route confirmed',blocked:'Route blocked',battery:'Battery',wired:'New wired power',existing:'Existing power',wireless:'Wireless',auto:'Automatic',distributed:'Local controls',centralized:'Central lighting panels',sunnata:'Sunnata',palladiom:'Palladiom glass',seetouch:'seeTouch',alisse:'Alisse',aviena:'Aviena',shared:'Shared lighting group',separate:'Separate lighting group',dimmer:'Dimmed',switch:'On / off',ac:'Compatible AC fan',remote:'Fan with its own remote',controls:'Existing fan; controls only',replace:'Replace existing fan',new:'New location',surface:'Surface mount',recessed:'Recessed mount'};
  const label=value=>labels[value]||String(value??'Not recorded').replace(/_/g,' ');
  function combine(rows,labor=false){
    const grouped=new Map();
    for(const row of rows){
      const key=[row.id||row.name,row.sku||'',row.unit||'',row.priceBasis||''].join('|');
      const item=grouped.get(key);
      if(item){item.qty+=row.qty;if(labor)item.hours=item.hours===null||row.hours===null?null:item.hours+row.hours;}
      else grouped.set(key,labor?{name:row.name,qty:row.qty,hours:row.hours}:{name:row.name,sku:row.sku,qty:row.qty,unit:row.unit||'each',basis:row.priceBasis});
    }
    return [...grouped.values()];
  }

  function selections(room,summary){
    const lines=[];
    for(const [i,g] of room.recessGroups.entries())if(M.q(g.qty))lines.push(`Recessed group ${i+1}: ${g.qty} ${g.adjustable?'adjustable':'fixed'} ${M.BEHAVIORS[g.behavior]||g.behavior} lights; ${M.BUILDS[M.fixtureBuild(room,g)]}; ${label(g.zone)}${M.intelligent(g.behavior)?'; undimmed power with system scene control':'; '+label(g.control)}.`);
    if(M.q(room.linearFt))lines.push(`Undercabinet / linear: ${quantity(room.linearFt)} ft of ${M.LINEAR_BEHAVIORS[room.linearBehavior]||room.linearBehavior}; ${quantity(room.linearZones)} control zones${room.linearZoneLengths?.trim()?'; zone lengths '+room.linearZoneLengths:''}${room.linearSections?.trim()?'; section lengths '+room.linearSections:''}; channel and power equipment in the takeoff.`);
    if(M.q(room.decorNew)||M.q(room.decorExisting))lines.push(`Owner-supplied decorative fixtures: ${quantity(room.decorNew)} new locations and ${quantity(room.decorExisting)} replacements; ${label(room.decorControl)} control.`);
    if(M.q(room.fanQty))lines.push(`Owner-supplied fans: ${quantity(room.fanQty)}; ${label(room.fanWork)}; ${label(room.fanControl)} control; support ${label(room.fanSupport)}; ${label(room.fanComplexity)} installation.`);
    if(M.q(room.existingDimmers)||M.q(room.existingSwitches))lines.push(`Existing lighting retained: ${quantity(room.existingDimmers)} dimmed groups and ${quantity(room.existingSwitches)} on/off groups receive controls.`);
    if(summary?.keypadQty)lines.push(`Keypads and scenes: ${summary.keypadQty} ${label(room.keypadType)} keypads; ${summary.central?'keypad-only walls with central load equipment':'local load controls permitted; compatible hybrid keypad substitutes for one dimmer where applicable'}. Final device assemblies appear in the takeoff.`);
    for(const [i,g] of room.shadeGroups.entries())if(M.q(g.qty))lines.push(`Shade group ${i+1}: ${g.qty} openings, ${g.layers||1} layer(s), ${M.q(g.qty)*M.q(g.layers||1)} ${M.Shade.FAMILIES[g.family]||g.family} ${g.style} shades; approximately ${quantity(g.widthFt)} ft wide by ${quantity(g.heightFt)} ft high; ${label(g.power)}; ${g.family==='palladiom_wired'||g.communication==='wired'?'wired QS commands':'wireless commands'}.`);
    return lines;
  }

  function build(state,calculation,{reviewed=false,release=''}={}){
    Photos.validate(structuredClone({rooms:state.rooms,archivedRooms:state.archivedRooms||[]}));
    const c=calculation,customer=Customer.build(state,c);
    const describe=(room,archived=false)=>{
      const summary=c.roomResults.find(r=>r.id===room.id);
      return {
        id:room.id,name:room.name,archived,
        selections:selections(room,archived?null:summary),
        scope:archived?[]:customer.rooms[state.rooms.indexOf(room)]?.narrative||[],
        conditions:[['Work type',M.BUILDS[room.install]],['Surface',label(room.surfaceMaterial)],['Access cuts',label(room.openingPermission)],['Ceiling route',label(room.ceilingPath)],['Wall route',label(room.wallPath)],['Height',label(room.ceilingHeight)],['Occupancy',room.occupancy==='unknown'?'Occupied-room protection allowance':label(room.occupancy)],['Special conditions',label(room.specialConditions)],...(room.recessGroups.some(g=>M.q(g.qty)&&['rania','ketra'].includes(g.behavior))?[['D2 ceiling check',label(room.d2rConditions||'unknown')]]:[]),['Drawing / revision',[room.planReference,room.planRevision].filter(Boolean).join(' / ')||'None recorded']],
        followUps:archived?[]:(c.estimatorNotes||[]).filter(n=>n.roomId===room.id).map(n=>n.message),
        routeEvidence:String(room.routeEvidence||''),notes:String(room.notes||''),
        photos:(room.photos||[]).map(({id,name,data})=>({id,name,data})),
        materials:archived?[]:combine(c.materials.filter(x=>x.groupId===room.id)),
        labor:archived?[]:combine(c.labor.filter(x=>x.groupId===room.id),true),
      };
    };
    return {
      type:'estimator-handoff',name:customer.name,preparedDate:customer.preparedDate,installationDate:customer.installationDate,system:customer.system,
      release:release||state.pricingMeta?.version||'Project pricing',reviewed,range:customer.range,projectNotes:String(state.project.notes||''),
      hours:c.knownHours,onsiteHours:c.knownSiteHours,offsiteHours:c.knownHours-c.knownSiteHours,programmingHours:c.programming?.totalHours??null,crewDays:c.days,rooms:state.rooms.map(r=>describe(r)),archivedRooms:(state.archivedRooms||[]).map(r=>describe(r,true)),
      sharedScope:customer.sharedScope,assumptions:customer.assumptions,
      followUps:[...new Set([...(c.planningChecks||[]).map(x=>x.message),...(c.issues||[]).map(x=>x.message)])],
      sharedMaterials:combine(c.materials.filter(x=>!x.groupId)),
      sharedLabor:combine(c.labor.filter(x=>!x.groupId),true),
    };
  }

  function materialTable(rows,area='Shared equipment'){
    return rows.length?`<table class="estimator-takeoff"><thead><tr><th>Budgeted equipment / material<small>${escape(area)}</small></th><th>Quantity</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${escape(x.name)}${x.sku?`<small>${escape(x.sku)}</small>`:''}${x.basis==='comparable-allowance'?'<small>Budget assembly allowance; confirm exact selection before ordering.</small>':''}</td><td>${escape(quantity(x.qty))} ${escape(x.unit)}</td></tr>`).join('')}</tbody></table>`:'<p class="report-muted">No separate material supply recorded.</p>';
  }
  function laborTable(rows,area='Shared installation'){
    return rows.length?`<table class="estimator-takeoff"><thead><tr><th>Installation / setup task<small>${escape(area)}</small></th><th>Quantity</th><th>Person-hours</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${escape(x.name)}</td><td>${escape(quantity(x.qty))}</td><td>${x.hours===null?'Pending':escape(quantity(x.hours))}</td></tr>`).join('')}</tbody></table>`:'<p class="report-muted">No separate labor task recorded.</p>';
  }
  function roomHtml(room,index){
    return `<section class="estimator-room"><div class="estimator-room-heading"><p>${room.archived?'ARCHIVED ROOM - EXCLUDED FROM CURRENT BUDGET':'ROOM '+(index+1)}</p><h2>${escape(room.name)}</h2></div>
      <h3>Selections discussed</h3>${room.selections.map(x=>`<p>${escape(x)}</p>`).join('')||'<p>No equipment selected.</p>'}
      ${room.scope.length?`<h3>Planned work</h3>${room.scope.map(x=>`<p>${escape(x)}</p>`).join('')}`:''}
      <h3>Installation conditions and assumptions</h3><dl class="estimator-facts">${room.conditions.map(([k,v])=>`<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl>
      ${room.routeEvidence?`<p class="estimator-notes"><strong>Recorded wiring route:</strong> ${escape(room.routeEvidence)}</p>`:''}
      ${room.followUps.length?`<section class="estimator-followup"><h3>Estimator follow-up before ordering</h3>${room.followUps.map(x=>`<p>${escape(x)}</p>`).join('')}</section>`:''}
      <h3>Room notes - ${escape(room.name)}</h3><div class="estimator-notes">${room.notes.trim()?escape(room.notes):'<span class="report-muted">No room notes recorded.</span>'}</div>
      <h3>Room photos - ${escape(room.name)}</h3>${room.photos.length?`<div class="estimator-photos">${room.photos.map((p,i)=>`<figure><img src="${escape(p.data)}" alt="${escape(room.name)} - ${escape(p.name)}"><figcaption>Photo ${i+1} - ${escape(p.name)}</figcaption></figure>`).join('')}</div>`:'<p class="report-muted">No photos attached.</p>'}
      ${room.archived?'':`<h3>Budgeted equipment and materials</h3>${materialTable(room.materials,room.name)}<h3>Estimated installation labor</h3>${laborTable(room.labor,room.name)}`}
    </section>`;
  }
  function html(d,logo=''){
    if(d.type!=='estimator-handoff')throw Error('An estimator handoff is required.');
    return `<article class="customer-sheet estimator-sheet"><header class="customer-brand">${logo.startsWith('data:image/')?`<img src="${escape(logo)}" alt="Livewire">`:'<strong>LIVEWIRE</strong>'}<span>ESTIMATOR HANDOFF</span></header>
      <div class="customer-heading"><p class="internal-document">INTERNAL COMPANY DOCUMENT</p><h1>${escape(d.name)}</h1><p>Prepared ${escape(d.preparedDate)} | ${escape(d.system)} | Planned installation ${escape(d.installationDate)}</p><p>Company price release: ${escape(d.release)}</p></div>
      <section class="customer-range"><span>${d.range?'PRELIMINARY BUDGET RANGE - USD':'INCOMPLETE PLANNING SCOPE'}</span><h2>${d.range?money(d.range.low)+' - '+money(d.range.high):'Budget pending'}</h2>${d.range?`<p>Design retainer: <strong>${amount(d.range.designRetainer)}</strong>. This is 4% of the low end, credited toward the job and not added to the budget.</p>`:'<p>No complete range is available for the unresolved scope. Review the follow-up items below.</p>'}<p>${d.reviewed?'Saved project has received internal review.':'Planning allowances; estimator review remains outstanding.'}</p></section>
      <p>${d.rooms.length} active room(s) | ${quantity(d.hours)} estimated person-hours | ${quantity(d.crewDays)} crew travel day(s)</p><p>${quantity(d.onsiteHours)} on-site person-hours; ${quantity(d.offsiteHours)} off-site planning hours. Person-hours are combined labor, not the time for each technician. Programming/activation is performed by one technician; a two-person crew is used to budget travel.${d.programmingHours===null?'':' Programming and activation: '+quantity(d.programmingHours)+' person-hours, included in the total.'}</p>
      <p>This internal handoff includes the room discussion, assumptions, notes and photos. It is not an order-ready bill of materials or a fixed-price proposal. Use the separate Customer budget PDF for the client.</p>
      ${d.projectNotes?`<h2>Project notes</h2><div class="estimator-notes">${escape(d.projectNotes)}</div>`:''}
      ${d.sharedScope.length?`<h2>Project-wide work</h2>${d.sharedScope.map(x=>`<p>${escape(x)}</p>`).join('')}`:''}
      ${d.rooms.map(roomHtml).join('')}
      <section class="estimator-room"><div class="estimator-room-heading"><p>PROJECT COORDINATION</p><h2>Shared equipment and estimating follow-up</h2></div>
      ${materialTable(d.sharedMaterials)}<h3>Shared installation and project labor</h3>${laborTable(d.sharedLabor)}
      <h3>Design and estimating follow-up</h3>${d.followUps.map(x=>`<p>${escape(x)}</p>`).join('')||'<p>No additional follow-up recorded.</p>'}
      <h3>Budget assumptions and exclusions</h3>${d.assumptions.map(x=>`<p>${escape(x)}</p>`).join('')}</section>
      ${d.archivedRooms.map(roomHtml).join('')}<footer>Livewire | Internal estimator handoff | ${escape(d.name)} | ${escape(d.release)}</footer></article>`;
  }
  const api={build,html};root.EstimatorReport=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

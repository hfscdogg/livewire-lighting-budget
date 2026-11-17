'use strict';

window.LivewireShared = (() => {
  let bootstrap;
  let project = null;
  let savedScope = null;
  let cached = null;
  let pending = null;
  let renderError = null;
  let panel = null;
  let busy = false;
  const app = document.getElementById('app');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  const uuid = () => crypto.randomUUID();
  const payload = state => ({ schema: state.schema, project: state.project, rooms: state.rooms, archivedRooms: state.archivedRooms });
  const key = state => JSON.stringify(payload(state));
  const estimatePayload = state => JobPhotos.withoutPhotos(payload(state));
  const estimateKey = state => JSON.stringify(estimatePayload(state));
  const dirty = state => key(state) !== savedScope;
  const pricing = () => ['owner', 'pricing'].includes(bootstrap.user.role);

  async function request(path, data) {
    if (data !== undefined && /^\/api\/(?:import|estimate|estimator-report|projects(?:\/[\da-f-]{36})?)$/.test(path)) {
      const encoded = JSON.stringify(data), bytes = new Blob([encoded]).size;
      if (bytes > JobPhotos.PROJECT_FILE_LIMIT + 10000) throw Error('This project is too large to save. Remove unneeded photos or split it into project sections.');
      if (bytes > 3000000) {
        const sections = [];
        for (let offset = 0; offset < encoded.length;) {
          let end = Math.min(offset + 500000, encoded.length);
          // Keep emoji and other surrogate pairs together for PostgreSQL UTF-8 storage.
          const last = encoded.charCodeAt(end - 1);
          if (end < encoded.length && last >= 0xD800 && last <= 0xDBFF) end--;
          sections.push(encoded.slice(offset, end));
          offset = end;
        }
        const upload = await request('/api/uploads', { target: path, parts: sections.length, bytes });
        for (let part = 0; part < sections.length; part++) await request(`/api/uploads/${upload.id}/${part}`, { text: sections[part] });
        data = { transferId: upload.id };
      }
    }
    const options = data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    const response = await fetch(path, options);
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      if (response.status === 401 && bootstrap) location.reload();
      throw Object.assign(new Error(result.error || 'The request could not be completed.'), { status: response.status, issues: result.issues });
    }
    return response.json();
  }

  function login(denied = false) {
    app.innerHTML = `<main class="wizard-main"><section class="panel"><h1>Livewire Lighting &amp; Shading</h1>${denied ? '<p class="inline-warning">Sign-in was unsuccessful. Use an approved Livewire Google account.</p>' : '<p>Sign in with your Livewire work account to open the estimator.</p>'}<a class="btn primary" href="/auth/google">Sign in with Google</a></section></main>`;
  }

  async function start() {
    try { bootstrap = await request('/api/bootstrap'); }
    catch (error) {
      if (error.status === 401) login(new URLSearchParams(location.search).has('signin'));
      else app.innerHTML = '<main class="wizard-main"><h1>Estimator unavailable</h1><p>Refresh to try again.</p></main>';
      return false;
    }
    return true;
  }

  function model() {
    const q = value => Math.max(0, Number(value) || 0);
    const count = room => room.shadeGroups.reduce((total, group) => total + q(group.qty) * q(group.layers || 1), 0);
    const initial = () => structuredClone(bootstrap.project);
    const roomDefaults = install => bootstrap.rooms[install] || bootstrap.rooms.remodel;
    return {
      fixtureBuild: window.InstallationModel.fixtureBuild, Installation: window.InstallationModel, BUILDS: bootstrap.builds, BEHAVIORS: bootstrap.behaviors, LINEAR_BEHAVIORS: bootstrap.linearBehaviors,
      Shade: { FAMILIES: bootstrap.shadeFamilies, group: () => ({ ...bootstrap.shade, id: uuid() }), count },
      uid: uuid, q, n: value => value === '' || value == null ? null : Number(value),
      intelligent: value => ['rania', 'lumaris_warm', 'lumaris', 'lumaris_rgb', 'ketra'].includes(value),
      initial, roomDefaults, recessGroup: () => ({ ...bootstrap.recess, id: uuid() }),
      emptyRoom: room => !room.recessGroups.some(group => q(group.qty)) && !q(room.linearFt) && !q(room.decorExisting) && !q(room.decorNew) && !q(room.fanQty) && !q(room.keypadQty) && !count(room) && !room.notes.trim() && !room.photos?.length,
      addRoomNamed(state, input) {
        const name = input.trim().slice(0, 80);
        if (!name || state.rooms.some(room => room.name.trim().toLowerCase() === name.toLowerCase())) return;
        state.rooms.push({ ...structuredClone(roomDefaults(state.project.install)), id: uuid(), name, recessGroups: [{ ...bootstrap.recess, id: uuid() }] });
      },
    };
  }

  function copyRoom(state,id){return window.SalesWorkflow.copyRoom(state,id,uuid);}

  function status(state) {
    return dirty(state) ? 'Unsaved changes' : project ? `Saved to shared projects · ${project.release}` : 'New project';
  }

  function toolbar() {
    return `<div class="toolbar"><button class="btn quiet" data-action="new">New project</button><button class="btn" data-action="import">Shared projects</button><button class="btn primary" data-action="export">Save project</button><button class="btn" data-action="company-pricing">Company pricing</button><button class="btn quiet" data-action="logout">Sign out</button></div>`;
  }

  function schedule(state, render) {
    const snapshot = estimateKey(state), id = project?.id;
    if (cached?.snapshot === snapshot && cached?.id === id) return cached.result;
    if (pending?.snapshot === snapshot && pending?.id === id || renderError?.snapshot === snapshot && renderError?.id === id) return null;
    const next = { snapshot, id };
    pending = next;
    request('/api/estimate', { scope: estimatePayload(state), id }).then(result => {
      if (pending !== next) return;
      pending = null;
      if (estimateKey(state) !== snapshot) return;
      cached = { ...next, result };
      // Avoid discarding a value while the user is typing into a room form.
      if (!app.contains(document.activeElement) || !document.activeElement.matches('input, select, textarea')) render();
    }).catch(error => {
      if (pending !== next) return;
      pending = null;
      renderError = { ...next, message: error.message };
      if (!app.contains(document.activeElement) || !document.activeElement.matches('input, select, textarea')) render();
    });
    return null;
  }

  function budget(state, result, handoff) {
    if (!result) return `<section class="panel"><h1>Working budget</h1>${renderError?.snapshot === estimateKey(state) ? `<p class="inline-warning">${escape(renderError.message)}</p><button class="btn" data-action="retry-budget">Retry</button>` : '<p role="status">Calculating scope…</p>'}</section>`;
    const { summary, release } = result;
    const { range, warnings, missingPrices, missingTasks, hasRoomScope, plan } = summary;
    const summaryById = new Map(summary.rooms.map(room => [room.id, room]));
    const label = (quantity, noun) => `${quantity} ${noun}${quantity === 1 ? '' : 's'}`;
    const equipment = [[plan.processors, 'control processor'], [plan.repeaters, 'Type A repeater'], [plan.gateways, 'gateway'], [plan.panels, 'lighting panel']].filter(([quantity]) => quantity > 0).map(([quantity, noun]) => label(quantity, noun)).join(' · ');
    const roomRows = state.rooms.map((room, index) => {
      const scoped = summaryById.get(room.id);
      const counts = [
        scoped?.recessQty && `${scoped.recessQty} recessed`,
        room.linearFt && `${room.linearFt} ft undercabinet`,
        (room.decorExisting + room.decorNew) && `${room.decorExisting + room.decorNew} decorative`,
        room.fanQty && `${room.fanQty} fan controls`,
        scoped?.keypadQty && label(scoped.keypadQty, 'keypad'),
        scoped?.shadeQty && label(scoped.shadeQty, 'shade'),
      ].filter(Boolean).join(' · ');
      return `<li><div><strong>${escape(room.name)}</strong><p>${escape(counts || 'No scope entered')}</p>${(scoped?.scope||[]).map(line=>`<p>${escape(line)}</p>`).join('')}</div><div class="room-row-actions"><button class="btn small" data-action="edit-room" data-index="${index}" aria-label="Edit ${escape(room.name)} scope">Edit scope</button><button class="btn small" data-action="edit-conditions" data-index="${index}" aria-label="Edit ${escape(room.name)} access">Edit access</button></div></li>`;
    }).join('');
    const approvalNote = range ? 'Reviewed planning range. Site conditions and final selections can affect the proposal.'
      : hasRoomScope ? 'An estimator must complete pricing and review the project before a dollar range can be shared.' : 'Add lighting, controls or shades in at least one room.';
    return `<div class="step-title"><h1>Project budget</h1><p>Company price list ${escape(release)}</p></div>
      <section class="range-card"><div class="range-amount">${range ? `${money(range.low)} – ${money(range.high)}` : 'Budget pending'}</div><p>${approvalNote}</p>${range ? `<p><strong>Design retainer ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(range.designRetainer)}</strong> · credited toward the project if the customer proceeds.</p>` : ''}<div class="range-meta"><span>${label(state.rooms.length, 'room')}</span><span>${summary.rooms.reduce((sum, room) => sum + room.recessQty, 0)} recessed lights</span><span>${label(summary.shadeCount, 'shade')}</span></div></section>
      ${missingPrices || missingTasks || warnings.length ? `<section class="panel"><h2>Items to resolve</h2>${missingPrices ? `<p>${missingPrices} material lines still need pricing.</p>` : ''}${missingTasks ? `<p>${missingTasks} tasks still need a labor allowance.</p>` : ''}${warnings.length ? `<ul class="sales-warnings">${warnings.map(message => `<li>${escape(message)}</li>`).join('')}</ul>` : ''}</section>` : ''}
      ${hasRoomScope ? `<section class="panel"><h2>Planned work</h2><p>${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(plan.personHours)} ${range ? 'estimated' : 'preliminary'} person-hours · ${plan.crewDays} planned two-person crew days</p>${equipment ? `<p>${equipment}</p>` : ''}</section>` : ''}
      <section class="panel"><h2>Room summary</h2><ul class="shared-room-summary">${roomRows}</ul></section>
      ${hasRoomScope ? `<section class="panel"><details><summary>Why these installation hours?</summary><p>Task hours are preliminary company allowances. Each line uses quantity × hours per unit × its applicable condition factor, then rounds up to the next quarter-hour. Unit rates retain calculation precision.</p><div class="table-wrap"><table><thead><tr><th>Work area / task</th><th>Quantity</th><th>Hours / unit</th><th>Factor</th><th>Person-hours</th></tr></thead><tbody>${(result.labor||[]).map(line=>`<tr><td>${escape(line.group)} · ${escape(line.name)}</td><td>${escape(line.qty)}</td><td>${line.hoursPer===null?'Pending':escape(line.hoursPer)}</td><td>${escape(line.factor||1)}</td><td>${line.hours===null?'Pending':Number(line.hours).toFixed(2)}</td></tr>`).join('')}</tbody></table></div></details></section>` : ''}
      ${handoff}
      <div class="result-actions"><button class="btn primary" data-action="export">Save project</button><button class="btn" data-action="new">Start next job</button>${hasRoomScope ? '<button class="btn" data-action="print">Customer budget PDF</button>' : ''}<button class="btn" data-action="estimator-pdf">Estimator handoff PDF</button>${pricing() && project && hasRoomScope ? '<button class="btn" data-action="review-project">Review saved project</button>' : ''}</div><p class="quiet-note">One two-person crew. Typical medium wiring runs. Drywall and plaster repair are excluded.</p>`;
  }

  function reset(scope, row = null, imported = false) {
    project = row;
    savedScope = imported ? null : key(scope);
    cached = pending = renderError = null;
    return scope;
  }

  function dialog(title, content) {
    panel?.close();
    panel = document.createElement('dialog');
    panel.className = 'panel shared-dialog';
    panel.innerHTML = `<div class="section-top"><h2>${title}</h2><form method="dialog"><button class="btn quiet">Close</button></form></div><div class="spaced">${content}</div><p class="inline-warning" data-dialog-error hidden role="alert"></p>`;
    const shown = panel;
    shown.addEventListener('close', () => { shown.remove(); if (panel === shown) panel = null; });
    document.body.append(shown);
    shown.showModal();
    return shown;
  }

  async function projectList(context, offset = 0, query = '') {
    const { projects, next } = await request(`/api/projects?${new URLSearchParams({ offset, q: query })}`);
    const entries = projects.map(row => `<li><button class="btn" data-id="${escape(row.id)}">${escape(row.name)}</button><small>${row.approved ? 'Reviewed budget' : 'Budget pending'} · ${escape(new Date(row.updatedAt).toLocaleDateString())}</small></li>`).join('');
    const shown = dialog('Shared projects', `<form data-project-search class="add-room-row"><label class="sr-only" for="project-search">Project name</label><input id="project-search" name="q" type="search" maxlength="160" placeholder="Search by project name" value="${escape(query)}"><button class="btn" type="submit">Search</button></form>${entries ? `<ul class="shared-projects spaced">${entries}</ul>` : '<p class="spaced">No matching projects.</p>'}<div class="result-actions">${offset ? '<button class="btn" data-page="previous">Previous</button>' : ''}${next !== null ? '<button class="btn" data-page="next">Next</button>' : ''}<button class="btn" data-file>Import an offline project</button></div>`);
    shown.querySelector('[data-project-search]').addEventListener('submit', async event => {
      event.preventDefault();
      try { await projectList(context, 0, new FormData(event.target).get('q')); }
      catch (error) { showError(shown, error); }
    });
    shown.addEventListener('click', async event => {
      const button = event.target.closest('button');
      if (!button) return;
      try {
        if (button.dataset.page) return await projectList(context, button.dataset.page === 'next' ? next : Math.max(0, offset - 50), query);
        if (button.hasAttribute('data-file')) { shown.close(); document.getElementById('import-file').click(); return; }
        if (!button.dataset.id || !canLeave(context.state)) return;
        const row = await request(`/api/projects/${button.dataset.id}`);
        context.open(reset(row.scope, row));
        shown.close();
      } catch (error) { showError(shown, error); }
    });
  }

  function showError(shown, error) {
    const element = shown.querySelector('[data-dialog-error]');
    element.hidden = false;
    element.textContent = [error.message, ...(error.issues || [])].join('\n');
  }

  function canLeave(state) { return !dirty(state) || confirm('Discard unsaved changes to this project?'); }

  async function priceDialog() {
    const { release } = await request('/api/pricing');
    const shown = dialog('Company pricing', `<p>Current version: <strong>${escape(release.catalogVersion)}</strong></p><p>New projects use the latest release. Saved projects retain their assigned version until a pricing administrator applies the current release.</p><div class="result-actions"><button class="btn" data-download>Download price list JSON</button><a class="btn" href="/api/pricing?format=csv" download>Download editable CSV</a></div>${pricing() ? `<form data-prices class="spaced"><label class="field">Approved price-list JSON or edited Livewire CSV<input type="file" accept=".json,.csv" name="file" required></label><p class="field-help">Set a new version and effective date in the file. In the current CSV, verify each SKU and its package inclusions after checking the product and price.</p><label class="checkline spaced"><input type="checkbox" name="validated" required> I verified supplier costs, equipment settings and applicable labor standards for this release.</label><button class="btn primary spaced">Publish price list</button></form>` : ''}`);
    shown.querySelector('[data-download]').addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(release, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `livewire-price-list-${release.catalogVersion.replace(/[^a-z0-9._-]/gi, '-')}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    shown.querySelector('[data-prices]')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = new FormData(event.target), submit = event.submitter;
      submit.disabled = true;
      try {
        const file = form.get('file');
        if (file.size > 3_000_000) throw new Error('Use a file under 3 MB.');
        const csv = file.name.toLowerCase().endsWith('.csv');
        const text = await file.text();
        const published = await request('/api/pricing', { format: csv ? 'csv' : 'json', file: csv ? text : JSON.parse(text), validated: form.has('validated') });
        bootstrap.currentRelease = published.version;
        cached = pending = renderError = null;
        shown.close();
        await priceDialog();
      } catch (error) { showError(shown, error); }
      finally { submit.disabled = false; }
    });
  }

  async function reviewDialog(context) {
    if (dirty(context.state)) throw new Error('Save this project before reviewing it.');
    bootstrap.currentRelease = (await request('/api/bootstrap')).currentRelease;
    const system = context.state.project.system;
    const result = await request('/api/estimate', { scope: estimatePayload(context.state), id: project.id });
    const { plan, shadeCount } = result.summary;
    const settings = system === 'RA3' ? `<fieldset><legend>RadioRA 3 layout</legend><div class="field-grid"><label class="field">Processors<input type="number" name="ra3Processors" min="1" max="4" value="${Math.min(4, Math.max(1, plan.processors))}" required></label><label class="field">Type A repeaters<input type="number" name="ra3Repeaters" min="0" max="8" value="${plan.repeaters ?? 0}" required></label></div><p class="field-help">Use the counts from the checked Lutron layout, including any extra RF coverage.</p></fieldset>`
      : system === 'HomeWorks' ? `<fieldset><legend>HomeWorks layout</legend><div class="field-grid"><label class="field">Processor architecture<select name="hwArchitecture" required><option value="">Choose after layout review</option><option value="dual">Wireless processor, plus wired QSX where needed</option><option value="qsx">Wired QSX with separate gateways as needed</option></select></label><label class="field">Wireless processors or separate Type X gateways<input type="number" name="hwCoverage" min="0" max="16" required></label><label class="field">Wired processor location<select name="processorLocation"><option value="separate">Separate enclosure</option><option value="panel">Compatible lighting panel compartment</option></select></label></div><p class="field-help">Use the wireless device count and coverage from the checked design. Wired QS loads and keypads still need wired QSX links.</p></fieldset>` : '';
    const shadeFields = context.state.rooms.flatMap(room => room.shadeGroups.filter(group => group.qty > 0 && group.style === 'roller').map(group => `<label class="field">${escape(room.name)} · ${escape(group.name)}<input type="number" name="shade-price:${escape(group.id)}" min="0.01" step="0.01" placeholder="Selling price per shade"></label>`)).join('');
    const routeFields = context.state.rooms.filter(room => room.routeLength === 'long').map(room => `<label class="field">${escape(room.name)} · route multiplier<input type="number" name="route:${escape(room.id)}" min="1.01" max="20" step="0.01" placeholder="Example: 2 for twice the medium allowance"></label>`).join('');
    const pricedScope = `<label class="field">Permit allowance, if included<input type="number" name="permitAllowance" min="0" step="0.01" value="0"></label>${shadeFields ? `<fieldset><legend>Optional shade quote overrides</legend><p class="field-help">Enter a confirmed material selling amount per shade to replace the company allowance. A company list using upper historical allowances can retain that allowance when this field is blank.</p><div class="field-grid">${shadeFields}</div></fieldset>` : ''}`;
    const shown = dialog('Review saved project', `<p>Project price list ${escape(project.release)}</p>${project.release !== bootstrap.currentRelease ? `<button class="btn" data-reprice>Apply current price list (${escape(bootstrap.currentRelease)})</button>` : ''}<form data-review class="spaced">${settings}${pricedScope}${routeFields ? `<fieldset><legend>Long wiring routes</legend><div class="field-grid">${routeFields}</div></fieldset>` : ''}<label class="checkline spaced"><input type="checkbox" name="reviewed" required> I verified the scope, site access, device compatibility, hardware counts and task allowances against the project.</label>${shadeCount ? '<label class="checkline spaced"><input type="checkbox" name="shadeAllowanceReviewed" required> I checked the shade allowance or entered quote, assembly inclusions, power and mounting.</label>' : ''}<button class="btn primary spaced">Approve customer range</button></form>`);
    async function submit(action, data, button) {
      button.disabled = true;
      try {
        const row = await request(`/api/projects/${project.id}/${action}`, { ...data, revision: project.revision });
        context.replace(reset(row.scope, row));
        shown.close();
      } catch (error) { showError(shown, error); }
      finally { button.disabled = false; }
    }
    shown.querySelector('[data-reprice]')?.addEventListener('click', event => {
      if (confirm('Apply the current company price list? This clears the previous budget approval.')) submit('reprice', {}, event.target);
    });
    shown.querySelector('[data-review]').addEventListener('submit', event => {
      event.preventDefault();
      const form = new FormData(event.target);
      const design = system === 'RA3' ? { ra3Processors: Number(form.get('ra3Processors')), ra3Repeaters: Number(form.get('ra3Repeaters')) }
        : system === 'HomeWorks' ? { hwArchitecture: form.get('hwArchitecture'), hwCoverage: Number(form.get('hwCoverage')), processorLocation: form.get('processorLocation') } : {};
      const shadePrices = Object.fromEntries([...form.entries()].filter(([key, value]) => key.startsWith('shade-price:') && value !== '').map(([key, value]) => [key.slice('shade-price:'.length), Number(value)]));
      const roomRoutes = Object.fromEntries([...form.entries()].filter(([key, value]) => key.startsWith('route:') && value !== '').map(([key, value]) => [key.slice(6), Number(value)]));
      submit('review', { reviewed: form.has('reviewed'), shadeAllowanceReviewed: form.has('shadeAllowanceReviewed'), design, shadePrices, roomRoutes, permitAllowance: Number(form.get('permitAllowance')) }, event.submitter);
    });
  }

  const actions = new Set(['new', 'import', 'export', 'print', 'estimator-pdf', 'logout', 'company-pricing', 'review-project', 'retry-budget']);
  async function action(name, context) {
    if (!actions.has(name)) return false;
    if (busy) return true;
    busy = true;
    try {
      const state = context.state;
      if (name === 'new' && canLeave(state)) context.open(reset(model().initial()));
      if (name === 'import') await projectList(context);
      if (name === 'export') {
        const snapshot = key(state);
        const row = await request(project ? `/api/projects/${project.id}` : '/api/projects', { scope: payload(state), revision: project?.revision });
        if (snapshot === key(state)) context.replace(reset(row.scope, row));
        else { reset(row.scope, row); context.status(); }
        context.toast('Saved to shared projects.');
      }
      if (name === 'estimator-pdf') {
        const snapshot = key(state);
        const result = await request('/api/estimator-report', { scope: payload(state), id: project?.id });
        if (snapshot !== key(state)) throw new Error('The scope changed. Open the estimator handoff again.');
        context.estimatorReport(result);
      }
      if (name === 'print') {
        const snapshot = estimateKey(state);
        const result = await request('/api/estimate', { scope: estimatePayload(state), id: project?.id });
        if (snapshot !== estimateKey(state)) throw new Error('The scope changed. Open the customer PDF again.');
        context.report(result.report);
      }
      if (name === 'logout' && canLeave(state)) { await request('/api/logout', {}); location.reload(); }
      if (name === 'company-pricing') await priceDialog();
      if (name === 'review-project') await reviewDialog(context);
      if (name === 'retry-budget') { cached = pending = renderError = null; context.render(); }
    } catch (error) { context.toast(error.message); }
    finally { busy = false; }
    return true;
  }

  async function importFile(file, context) {
    if (!canLeave(context.state)) return;
    try {
      if (file.size > JobPhotos.PROJECT_FILE_LIMIT) throw new Error('Use a project file under 8 MB.');
      const data = await request('/api/import', { scope: JSON.parse(await file.text()) });
      context.open(reset(data.scope, null, true));
      context.toast('Offline scope imported. Save it to shared projects.');
    } catch (error) { context.toast(error.message); }
  }

  return { start, model, copyRoom, reset, status, toolbar, schedule, budget, actions, action, importFile, dirty };
})();

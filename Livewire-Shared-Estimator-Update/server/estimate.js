'use strict';

const Photos = require('../dist/job-photos');
const M = require('../dist/model');
const Pricing = require('../dist/pricing');
const Report = require('../dist/customer-report');

const projectDefaults = { ...M.initial().project, systemPlan: 'new' };
const recessDefaults = M.recessGroup();
const shadeDefaults = M.Shade.group(M.uid);
const reviewFields = Object.keys(M.initial().config).filter(key => key.endsWith('Reviewed'));
const allowedValues = {
  ...M.Installation.ENUMS,
  system: ['none', 'RA3', 'HomeWorks', 'unsure'], systemPlan: ['new', 'existing', 'unsure'], networkPlan: ['new', 'existing', 'unsure'], install: Object.keys(M.BUILDS),
  behavior: Object.keys(M.BEHAVIORS), linearBehavior: Object.keys(M.LINEAR_BEHAVIORS),
  family: Object.keys(M.Shade.FAMILIES), travelBand: ['', '0', '1', '2', '3', '4', '5', 'over'],
  power: ['battery', 'wired', 'existing'], communication: ['auto', 'wired', 'wireless'],
  control: ['dimmer', 'switch'], zone: ['shared', 'separate'],
  routeLength: ['medium', 'long'], loadTopology: ['auto', 'distributed', 'centralized'],
  surfaceMaterial: ['unknown', 'open', 'drywall', 'plaster'],
  surfaceAccess: ['unknown', 'accessible', 'removable', 'obstructed', 'open'],
  access: ['normal', 'limited', 'difficult'], powerPlan: ['existing', 'new', 'unknown'],
  fanWork:['unknown','controls','replace','new'], fanSupport:['unknown','verified','replace'], fanComplexity:['standard','special'], fanControl: ['existing','switch', 'fan'], fanMotor: ['unknown', 'ac', 'remote'],
  style: ['roller', 'honeycomb', 'wood', 'roman', 'drapery', 'specialty'],
};

class InputError extends Error {}

function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('Invalid project data.');
  return value;
}

function pick(input, defaults, skip = []) {
  record(input);
  const output = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    if (skip.includes(key)) continue;
    let value = input[key] ?? fallback;
    if (value !== null && (fallback === null || typeof fallback === 'number')) {
      if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) value = Number(value);
      if (!Number.isFinite(value) || value < 0 || value > 10000) throw new InputError(`Invalid ${key}.`);
      if (['qty', 'layers', 'keypadQty', 'fanQty', 'decorNew', 'decorExisting', 'linearZones', 'controlLocations', 'driverCountOverride', 'accessOpeningsOverride', 'legacyZones'].includes(key) && !Number.isInteger(value)) throw new InputError(`Use a whole number for ${key}.`);
      if (key === 'layers' && ![1, 2].includes(value)) throw new InputError('A window group supports one or two layers.');
    } else if (fallback !== null && typeof value !== typeof fallback) {
      throw new InputError(`Invalid ${key}.`);
    }
    if (typeof value === 'string') {
      if (value.length > (key === 'notes' ? 2000 : 160)) throw new InputError(`The ${key} is too long.`);
      if (key === 'id' && !/^[A-Za-z0-9_-]{1,80}$/.test(value)) throw new InputError('Invalid scope identifier.');
      if (allowedValues[key] && !allowedValues[key].includes(value)) throw new InputError(`Invalid ${key} selection.`);
    }
    output[key] = value;
  }
  return output;
}

function list(value, max) {
  if (!Array.isArray(value) || value.length > max) throw new InputError(`This scope list supports up to ${max} entries.`);
  return value;
}

function scope(input, { legacy = false } = {}) {
  record(input);
  if (legacy && input.schema === 1) {
    if (!Array.isArray(input.rooms) || input.rooms.length > 500) throw new InputError('Invalid legacy project rooms.');
    for (const room of input.rooms) record(room);
    input = M.migrate(input);
  } else if (input.schema !== 2) {
    throw new InputError('This project file format is unsupported.');
  }
  const project = pick(input.project, { ...projectDefaults, date: M.initial().project.date }, ['scopeReviewed', 'crewSize', 'permitAllowance']);
  project.name = project.name.trim() || projectDefaults.name;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(project.date) || !Number.isFinite(Date.parse(project.date)) || new Date(project.date).toISOString().slice(0, 10) !== project.date) throw new InputError('Enter a valid installation date.');
  let groupCount = 0;
  const ids = new Set();
  const shadeIds = new Set();
  const recessIds = new Set();
  const normalizeRoom = inputRoom => {
    record(inputRoom);
    let source;
    try { source = legacy ? M.normalizeRoom(inputRoom) : inputRoom; }
    catch (error) { throw new InputError(error.message); }
    const room = pick(source, M.room('Room', source.install), ['shadeGroups', 'recessGroups', 'routeReviewed', 'photos']);
    room.photos = source.photos ?? [];
    room.name = room.name.trim() || 'Room';
    if (ids.has(room.id)) throw new InputError('Room identifiers must be unique.');
    ids.add(room.id);
    room.recessGroups = list(source.recessGroups ?? [], 200).map(group => {
      const recess = pick(group, { ...recessDefaults, id: M.uid(), legacyZones: null });
      if (recess.legacyZones === null) delete recess.legacyZones;
      if (recessIds.has(recess.id)) throw new InputError('Fixture group identifiers must be unique.');
      recessIds.add(recess.id);
      return recess;
    });
    room.shadeGroups = list(source.shadeGroups ?? [], 200).map(group => {
      const shade = pick(group, { ...shadeDefaults, id: M.uid() });
      if (shadeIds.has(shade.id)) throw new InputError('Shade group identifiers must be unique.');
      shadeIds.add(shade.id);
      return shade;
    });
    groupCount += room.recessGroups.length + room.shadeGroups.length;
    if (groupCount > 2000) throw new InputError('This project supports up to 2,000 fixture and shade groups.');
    return room;
  };
  const rooms = list(input.rooms, 500).map(normalizeRoom);
  const archivedRooms = list(input.archivedRooms ?? [], 500).map(normalizeRoom);
  const clean = { schema: 2, project, rooms, archivedRooms };
  try { Photos.validate(clean); } catch (error) { throw new InputError(error.message); }
  return clean;
}

function templates() {
  const draft = M.initial();
  Object.assign(draft.project, { system: 'unsure', systemPlan: 'unsure' });
  const rooms = Object.fromEntries(Object.keys(M.BUILDS).map(install => [install, { ...M.room('Room', install), loadTopology: 'distributed' }]));
  return {
    project: scope(draft), rooms, recess: recessDefaults, shade: shadeDefaults,
    builds: M.BUILDS, behaviors: M.BEHAVIORS, linearBehaviors: M.LINEAR_BEHAVIORS, shadeFamilies: M.Shade.FAMILIES,
  };
}

function stateFor(scopeData, release, reviewed, design) {
  const state = Pricing.apply({ ...M.initial(), ...scopeData }, release);
  state.project.crewSize = 2;
  if (state.project.system === 'unsure') state.project.system = 'none';
  if (design) {
    const { shadePrices, permitAllowance, roomRoutes, ...controls } = design;
    Object.assign(state.config, controls);
    if (permitAllowance !== undefined) state.project.permitAllowance = permitAllowance;
    if (shadePrices) state.config.offlineShadePrices = shadePrices;
    state.config.roomRoutes = roomRoutes || {};
  }
  state.project.scopeReviewed = reviewed;
  for (const key of reviewFields) state.config[key] = reviewed;
  for (const room of state.rooms) room.routeReviewed = Object.hasOwn(state.config.roomRoutes || {}, room.id);
  return state;
}

function reviewPrices(scopeData, input, required) {
  const permitAllowance = input.permitAllowance ?? 0;
  if (typeof permitAllowance !== 'number' || !Number.isFinite(permitAllowance) || permitAllowance < 0) throw new InputError('Enter a nonnegative permit allowance.');
  const shadePrices = Object.create(null);
  const submitted = input.shadePrices ?? {};
  record(submitted);
  for (const room of scopeData.rooms) for (const group of room.shadeGroups) {
    if (!group.qty || group.style !== 'roller') continue;
    const price = Object.hasOwn(submitted, group.id) ? submitted[group.id] : undefined;
    if (price === undefined && !required) continue;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) throw new InputError(`Enter the current material selling price per shade for ${room.name} / ${group.name}.`);
    shadePrices[group.id] = { scope: M.Shade.quoteSignature(group), low: price, high: price };
  }
  const roomRoutes = Object.create(null);
  const routeInput = record(input.roomRoutes ?? {});
  for (const room of scopeData.rooms) {
    if (room.routeLength !== 'long' || !Object.hasOwn(routeInput, room.id)) continue;
    const factor = routeInput[room.id];
    if (typeof factor !== 'number' || !Number.isFinite(factor) || factor <= 1 || factor > 20) throw new InputError(`Enter a route multiplier above 1 and at most 20 for ${room.name}.`);
    roomRoutes[room.id] = factor;
  }
  return { permitAllowance, shadePrices, roomRoutes };
}

function reviewDesign(scopeData, input = {}) {
  const number = (value, min, max, label) => {
    if (!Number.isInteger(value) || value < min || value > max) throw new InputError(`Enter ${label} between ${min} and ${max}.`);
    return value;
  };
  if (scopeData.project.system === 'RA3') return {
    ra3CoverageProcessors: number(input.ra3Processors, 1, 4, 'the RadioRA 3 processor count'),
    ra3Repeaters: number(input.ra3Repeaters, 0, 8, 'the RadioRA 3 Type A repeater count'),
  };
  if (scopeData.project.system === 'HomeWorks') {
    if (!['dual', 'qsx'].includes(input.hwArchitecture)) throw new InputError('Choose the HomeWorks processor architecture after checking the layout.');
    const processorLocation = input.processorLocation ?? 'separate';
    if (!['separate', 'panel'].includes(processorLocation)) throw new InputError('Choose the HomeWorks processor mounting location.');
    return input.hwArchitecture === 'dual'
      ? { processorLocation, hwArchitecture: 'dual', hwCoverageDualProcessors: number(input.hwCoverage, 1, 16, 'the HomeWorks wireless processor count') }
      : { processorLocation, hwArchitecture: 'qsx', hwCoverageGateways: number(input.hwCoverage, 0, 15, 'the HomeWorks Type X gateway count') };
  }
  return {};
}

function calculate(scopeData, release, approval = null, review = false, design = approval?.design) {
  const state = stateFor(scopeData, release, review, design);
  const calculation = M.calculate(state);
  const project = scopeData.project;
  if (project.system === 'unsure' && !calculation.issues.some(issue => issue.key === 'control_plan')) calculation.issues.push({ key: 'control_plan', message: 'Have an estimator confirm the control system. Room scope can be saved now.' });
  if (['RA3', 'HomeWorks'].includes(project.system) && project.systemPlan !== 'new' && !calculation.issues.some(issue => issue.key === 'control_plan')) calculation.issues.push({
    key: 'control_plan',
    message: project.systemPlan === 'existing'
      ? 'Adding to an existing system needs an estimator to check the installed equipment and spare capacity. The equipment shown assumes a new system.'
      : 'Confirm whether this is a new control system or an addition to an existing system.',
  });
  if (review && project.system === 'RA3' && design && design.ra3CoverageProcessors < calculation.processors) calculation.issues.push({ key: 'ra3_coverage_count', message: `The selected RadioRA 3 scope requires at least ${calculation.processors} processors. Review the layout and device counts.` });
  if (review && project.system === 'HomeWorks' && design) {
    const wireless = design.hwArchitecture === 'dual';
    const requested = wireless ? design.hwCoverageDualProcessors : design.hwCoverageGateways;
    const needed = wireless ? calculation.dualProcessors : calculation.gateways;
    if (requested < needed) calculation.issues.push({ key: 'hw_coverage_count', message: `This HomeWorks scope requires at least ${needed} ${wireless ? 'wireless processors' : 'Type X gateways'}. Review the layout and device counts.` });
  }
  if (review && state.config.shippingHandling && !calculation.issues.length && !M.range(calculation, state.config)) calculation.issues.push({key: 'budget_spread', message: 'Use current configured prices to narrow the scope allowances before approving this budget range.'});
  const report = Report.build(state, calculation);
  if (project.system === 'unsure') report.system = 'Control system to be confirmed';
  if (['RA3', 'HomeWorks'].includes(project.system) && project.systemPlan === 'existing') report.system += ' addition, pending capacity review';
  if (!review) report.range = approval?.report?.range ?? null;
  const warnings = calculation.issues.filter(({ key }) => /^(fan_|control_plan|network_plan|rania|ketra|lumaris_(system|adjustable|circuits)|keypads_none|ra3_capacity|hw_capacity|surface_|installation_|decor_shared_|shared_|intelligent_shared_|travel$|travel_distance|shade_(size|dimensions|power_distance|special_work|qs_system|existing_link|palladiom|triathlon_bus|battery_bus)|route_long_|linear_quantity_|retrofit_can_|fan_speed_|linear_zone_lengths_)/.test(key)).map(({ message }) => message);
  const uniqueWarnings = [...new Set(warnings)];
  return {
    report,
    summary: {
      range: report.range,
      warnings: uniqueWarnings,
      hasRoomScope: calculation.roomResults.some(room => room.totalLocations > 0),
      rooms: calculation.roomResults.map(({ id, recessQty, keypadQty, central, shadeQty, totalLocations, scope }) => ({ id, recessQty, keypadQty, central, shadeQty, totalLocations, scope })),
      missingPrices: calculation.materials.filter(line => line.sell === null).length,
      missingTasks: calculation.labor.filter(line => line.hours === null).length,
      shadeCount: calculation.shades.count,
      plan: {
        processors: calculation.processors,
        gateways: calculation.gateways,
        repeaters: state.config.ra3Repeaters ?? 0,
        panels: calculation.panelCount,
        personHours: calculation.knownHours,
        crewDays: calculation.days,
      },
    },
    labor: calculation.labor.map(({group,name,qty,hoursPer,factor,hours})=>({group,name,qty,hoursPer,factor,hours})),
    routes: calculation.routes,
    issues: calculation.issues.map(({ message }) => message),
  };
}

module.exports = { InputError, calculate, scope, templates, reviewDesign, reviewPrices };

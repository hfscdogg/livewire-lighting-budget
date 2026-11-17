const assert=require('node:assert/strict'),M=require('./dist/model'),W=require('./dist/sales-workflow');
const s=M.initial(),r=M.addRoomNamed(s,'Kitchen');r.install='new';W.synchronize(s);assert.equal(r.powerPlan,'new');assert.equal(r.keypadLocation,'new');
W.override(r,'powerPlan');r.powerPlan='existing';W.synchronize(s);assert.equal(r.powerPlan,'existing');r.install='retrofit';W.synchronize(s);assert.equal(r.keypadLocation,'existing');
r.openingPermission='none';r.ceilingFishing='blocked';W.resetDefaults(r);assert.equal(r.openingPermission,'none');assert.equal(r.ceilingFishing,'blocked');
const old={...r};delete old.autoBudgetDefaults;old.powerPlan='new';s.rooms=[M.normalizeRoom(old)];W.synchronize(s);assert.equal(s.rooms[0].powerPlan,'new');assert.equal(s.rooms[0].autoBudgetDefaults,false);
const restored=M.validate(JSON.parse(JSON.stringify(s)));assert.equal(restored.rooms[0].powerPlan,'new');
console.log('PASS: inferred defaults, persistent overrides, explicit reset and legacy preservation');

'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const paths=[...new Set(cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean))].sort();
const files=paths.filter(file=>file!=='source-manifest.json'&&fs.existsSync(file)).map(file=>({path:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
fs.writeFileSync('source-manifest.json',JSON.stringify({release:'2026-11-13-budget-workflow-1',files},null,2)+'\n');
console.log(`Recorded ${files.length} source files.`);

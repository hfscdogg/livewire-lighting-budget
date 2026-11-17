'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {verify}=require('./verify-repository');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'livewire-source-'));
try{
 assert.ok(verify(__dirname).count>20);
 const manifest=require('./source-manifest.json');
 fs.copyFileSync('source-manifest.json',path.join(root,'source-manifest.json'));
 // Reproduce a browser upload containing only the root files from the user's screenshot.
 for(const file of manifest.files.filter(file=>!file.path.includes('/')))fs.copyFileSync(file.path,path.join(root,file.path));
 assert.throws(()=>verify(root),error=>error.message.includes('Missing: dist/app.js')&&error.message.includes('Missing: pricing/catalog.json')&&error.message.includes('Missing: server/index.js'));
 for(const file of manifest.files.filter(file=>file.path.includes('/'))){const dest=path.join(root,file.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file.path,dest);}
 assert.equal(verify(root).count,manifest.files.length);
 fs.appendFileSync(path.join(root,'dist/app.js'),'\n// Older or edited copy\n');
 assert.throws(()=>verify(root),/Different version: dist\/app.js/);
 console.log('PASS: complete source, missing nested folders and mixed-release uploads detected.');
}finally{fs.rmSync(root,{recursive:true,force:true});}

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
 // A browser upload that drops or rewrites dot-prefixed files still deploys, with warnings.
 const dotfiles=manifest.files.filter(file=>file.path.startsWith('.'));
 assert.ok(dotfiles.length>=3);
 fs.rmSync(path.join(root,'.github'),{recursive:true,force:true});
 fs.appendFileSync(path.join(root,'.gitignore'),'\n# edited\n');
 const relaxed=verify(root);
 assert.ok(relaxed.warnings.some(w=>w==='Missing: .github/workflows/verify.yml')&&relaxed.warnings.some(w=>w==='Different version: .gitignore'));
 fs.appendFileSync(path.join(root,'dist/app.js'),'\n// Older or edited copy\n');
 assert.throws(()=>verify(root),/Different version: dist\/app.js/);
 console.log('PASS: complete source, missing nested folders and mixed-release uploads detected; dropped dotfiles warn without blocking.');
}finally{fs.rmSync(root,{recursive:true,force:true});}

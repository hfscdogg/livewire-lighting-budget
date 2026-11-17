'use strict';
const fs=require('node:fs'),path=require('node:path');
require('./verify-repository').verify(__dirname);
const catalog=require('./dist/pricing').validate(JSON.parse(fs.readFileSync('pricing/catalog.json','utf8')));
const script=body=>'<script>'+body+'</script>';
let html=fs.readFileSync('dist/index.html','utf8').replace('<link rel="stylesheet" href="styles.css">','<style>'+fs.readFileSync('dist/styles.css','utf8')+'</style>');
for(const name of ['job-photos','shades','installation','model','pricing','sales-workflow','spreadsheet','customer-report','estimator-report','price-references','app']){
 const tag='<script src="'+name+'.js"></script>';
 if(!html.includes(tag))throw Error('Missing standalone script: '+name);
 html=html.replace(tag,script(fs.readFileSync('dist/'+name+'.js','utf8'))+(name==='pricing'?script('window.LivewireRepositoryCatalog='+JSON.stringify(catalog).replaceAll('<','\\u003c')+';'):''));
}
for(const name of ['sunnata','palladiom'])html=html.replaceAll('assets/keypad-'+name+'.jpg','data:image/jpeg;base64,'+fs.readFileSync('dist/assets/keypad-'+name+'.jpg').toString('base64'));
if(/@import|<script[^>]+src=|<link[^>]+href=/.test(html))throw Error('Standalone file has an external asset dependency.');
fs.mkdirSync('distribution',{recursive:true});
fs.writeFileSync('distribution/Livewire-Lighting-Budget.html',html);
fs.writeFileSync('distribution/Livewire-Internal-Setup.html',html.replace('<body>','<body><script>window.LIVEWIRE_INTERNAL=true;</script>'));
// The same inventory drives verification and packaging, so nested source files cannot silently disappear.
fs.rmSync('distribution/source',{recursive:true,force:true});
const inventory=JSON.parse(fs.readFileSync('source-manifest.json','utf8'));
for(const name of [...inventory.files.map(file=>file.path),'source-manifest.json']){
 const destination=path.join('distribution/source',name);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(name,destination);
}
for(const name of ['SETUP.txt','SCOPE-MATRIX.txt','LABOR-ASSUMPTIONS.txt','SHADING-ASSUMPTIONS.txt','SHARED-APP-PLAN.txt'])fs.copyFileSync('distribution-docs/'+name,'distribution/'+name);
require('./verify-repository').verify(path.resolve('distribution/source'));
console.log('Built offline HTML with embedded pricing and a verified complete source package. No customer projects or credentials included.');

const fs=require('node:fs'),path=require('node:path');
const shades=fs.readFileSync('dist/shades.js','utf8');
const css=fs.readFileSync('dist/styles.css','utf8'),model=fs.readFileSync('dist/model.js','utf8'),app=fs.readFileSync('dist/app.js','utf8'),pricing=fs.readFileSync('dist/pricing.js','utf8');
const sheet=fs.readFileSync('dist/spreadsheet.js','utf8'),report=fs.readFileSync('dist/customer-report.js','utf8'),refs=fs.readFileSync('dist/price-references.js','utf8');
let html=fs.readFileSync('dist/index.html','utf8').replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>').replace('<script src="shades.js"></script>','<script>'+shades+'</script>').replace('<script src="model.js"></script>','<script>'+model+'</script>').replace('<script src="pricing.js"></script>','<script>'+pricing+'</script>').replace('<script src="spreadsheet.js"></script>','<script>'+sheet+'</script>').replace('<script src="customer-report.js"></script>','<script>'+report+'</script>').replace('<script src="price-references.js"></script>','<script>'+refs+'</script>').replace('<script src="app.js"></script>','<script>'+app+'</script>');
if(/@import|<script[^>]+src=|<link[^>]+href=/.test(html))throw Error('Standalone file has an external asset dependency.');
fs.rmSync('distribution/apps-script',{recursive:true,force:true});fs.rmSync('distribution/source',{recursive:true,force:true});fs.mkdirSync('distribution/source/dist',{recursive:true});fs.mkdirSync('distribution/source/distribution-docs',{recursive:true});
fs.writeFileSync('distribution/Livewire-Lighting-Budget.html',html);
fs.writeFileSync('distribution/Livewire-Internal-Setup.html',html.replace('<body>','<body><script>window.LIVEWIRE_INTERNAL=true;</script>'));
for(const name of ['index.html','styles.css','shades.js','model.js','pricing.js','spreadsheet.js','customer-report.js','price-references.js','app.js'])fs.copyFileSync('dist/'+name,'distribution/source/dist/'+name);
for(const name of ['model.test.js','wizard.test.js','scope.test.js','pricing.test.js','spreadsheet.test.js','labor.test.js','shades.test.js','build-distribution.js','README.md'])fs.copyFileSync(name,'distribution/source/'+name);
fs.copyFileSync('distribution-docs/SETUP.txt','distribution/SETUP.txt');fs.copyFileSync('distribution-docs/SETUP.txt','distribution/source/distribution-docs/SETUP.txt');
console.log('Created offline HTML, internal setup, documentation and source. No site identity, credentials, or project records included.');

fs.copyFileSync('distribution-docs/SCOPE-MATRIX.txt','distribution/SCOPE-MATRIX.txt');fs.copyFileSync('distribution-docs/SCOPE-MATRIX.txt','distribution/source/distribution-docs/SCOPE-MATRIX.txt');

fs.copyFileSync('distribution-docs/Livewire-Price-List.csv','distribution/Livewire-Price-List.csv');fs.copyFileSync('distribution-docs/Livewire-Price-List.csv','distribution/source/distribution-docs/Livewire-Price-List.csv');
fs.copyFileSync('distribution-docs/Livewire-Lighting-Price-List.xlsx','distribution/Livewire-Lighting-Price-List.xlsx');fs.copyFileSync('distribution-docs/Livewire-Lighting-Price-List.xlsx','distribution/source/distribution-docs/Livewire-Lighting-Price-List.xlsx');

fs.copyFileSync('distribution-docs/LABOR-ASSUMPTIONS.txt','distribution/LABOR-ASSUMPTIONS.txt');fs.copyFileSync('distribution-docs/LABOR-ASSUMPTIONS.txt','distribution/source/distribution-docs/LABOR-ASSUMPTIONS.txt');

for(const name of ['SHADING-ASSUMPTIONS.txt','SHARED-APP-PLAN.txt']){fs.copyFileSync('distribution-docs/'+name,'distribution/'+name);fs.copyFileSync('distribution-docs/'+name,'distribution/source/distribution-docs/'+name);}

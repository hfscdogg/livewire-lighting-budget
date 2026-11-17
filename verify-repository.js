'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function verify(root=__dirname){
 const manifestPath=path.join(root,'source-manifest.json');
 if(!fs.existsSync(manifestPath))throw Error('Source inventory is missing. Upload the complete source package, including its folders.');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8')),errors=[],warnings=[];
 // Browser uploads often drop or rewrite dot-prefixed files. They do not affect the running application, so they warn instead of blocking a deployment.
 const report=(item,message)=>(item.path.startsWith('.')?warnings:errors).push(message);
 if(!Array.isArray(manifest.files)||manifest.files.length<20)throw Error('Invalid source inventory.');
 for(const item of manifest.files){
  if(!item.path||path.isAbsolute(item.path)||item.path.split(/[\\/]/).includes('..'))throw Error('Invalid source inventory path.');
  const file=path.join(root,item.path);
  if(!fs.existsSync(file)){report(item,'Missing: '+item.path);continue;}
  const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(hash!==item.sha256)report(item,'Different version: '+item.path);
 }
 for(const required of ['dist/app.js','dist/model.js','dist/estimator-report.js','dist/sales-workflow.js','pricing/catalog.json','server/index.js','server/database.js','api/index.js','vercel.json','distribution-docs/VERCEL-DEPLOYMENT.md','distribution-docs/RELEASE-STATUS.md'])if(!manifest.files.some(item=>item.path===required))errors.push('Inventory omits required file: '+required);
 if(errors.length)throw Error('Repository source is incomplete or mixed between releases:\n'+errors.join('\n')+'\nUpload the complete package contents at the repository root. For intentional source edits, regenerate the inventory after reviewing the changes.');
 return {release:manifest.release,count:manifest.files.length,warnings};
}
if(require.main===module){try{const result=verify(process.argv[2]||__dirname);for(const warning of result.warnings)console.warn('Warning (does not block deployment): '+warning);console.log(`PASS: ${result.count-result.warnings.length} of ${result.count} source files match ${result.release}; required application, pricing, server and documentation folders are present.`);}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={verify};

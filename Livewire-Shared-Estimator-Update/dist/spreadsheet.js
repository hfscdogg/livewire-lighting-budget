(function(root){'use strict';const M=root.BudgetModel||(typeof require==='function'?require('./model.js'):null),P=root.CompanyPricing||(typeof require==='function'?require('./pricing.js'):null);
const LEGACY_HEADER=['Type','ID','Description','Category','SKU','Cost USD','MSRP USD','Unit','Price method','Parts size','Hours per unit','Value','On site','Public reference USD','Reference type','Reference SKU','Source','Checked date','Notes'];
const PRODUCT_CHECKS = {
  'SKU verified': 'verified',
  'Package includes power': 'includesPower',
  'Package includes wallplate': 'includesPlate',
  'Package includes enclosure': 'includesEnclosure',
};
const HEADER = [...LEGACY_HEADER, ...Object.keys(PRODUCT_CHECKS), 'QS PDUs'];
const copy=x=>JSON.parse(JSON.stringify(x));
function rows(state,refs=[]){const meta=state.pricingMeta||{},pack=P.make(state,meta.version&&meta.version!=='Unversioned'?meta.version:'2026-11-lighting-shading-v10',meta.effectiveAt||'2026-11-11'),out=[HEADER];const line=(type,id,description)=>Object.fromEntries(HEADER.map(k=>[k,k==='Type'?type:k==='ID'?id:k==='Description'?description:'']));const push=r=>out.push(HEADER.map(k=>r[k]??''));
for(const[id,val]of [['catalogVersion',pack.catalogVersion],['effectiveAt',pack.effectiveAt],['currency','USD']]){const r=line('metadata',id,id==='catalogVersion'?'Price list version':id==='effectiveAt'?'Effective date (label, not scheduled activation)':'Currency');r.Value=val;push(r);}
for(const x of pack.settings.catalog){const r=line('product',x.id,x.name),ref=refs.find(y=>y.id===x.id);Object.assign(r,{'Category':x.id.startsWith('fixture_')?'Recessed fixtures':x.id.startsWith('linear_')||x.id.startsWith('driver_')?'Undercabinet':x.device!=='none'?'Controls / keypads':'Infrastructure / material','SKU':x.sku,'Cost USD':x.cost,'MSRP USD':x.msrp,'Unit':x.unit,'Price method':x.pricing,'Parts size':x.kind,'Source':x.source,'Notes':'Blank cost/MSRP means unknown. Verify complete assembly and compatibility.'});for(const [column,key] of Object.entries(PRODUCT_CHECKS))r[column]=x[key]?'TRUE':'FALSE';r['QS PDUs']=x.pdus;if(ref)Object.assign(r,{'Public reference USD':ref.price,'Reference type':ref.priceType,'Reference SKU':ref.sku,'Source':ref.source,'Checked date':ref.checkedDate,'Notes':ref.notes+' Public reference only; not imported as cost or MSRP.'});push(r);}
for(const[id,label,unit]of M.TASKS){const r=line('labor',id,label);Object.assign(r,{'Category':'Installation standards','Unit':unit,'Hours per unit':pack.settings.labor[id],'On site':pack.settings.laborOnsite[id]?'TRUE':'FALSE','Notes':'Preliminary estimating judgment, not measured company history. Person-hours per unit. See labor assumptions; do not add a blanket productivity multiplier.'});push(r);}
for(const key of P.KEYS.filter(k=>!['catalog','labor','laborOnsite'].includes(k))){const val=pack.settings[key];for(const[sub,v]of val&&typeof val==='object'?Object.entries(val):[['',val]]){const id=key+(sub?'.'+sub:''),r=line('setting',id,id.replace(/([A-Z])/g,' $1').replaceAll('.',' / '));r.Category=key.startsWith('shade')?'Shade historical budgets':key==='travelBands'?'Travel bands':/Margin|Tax|Rate|rate|range/.test(key)?'Rates and pricing':'Company allowances';r.Value=v;r.Notes=key==='shadeLow'||key==='shadeHigh'?'September 2026 historical customer roller-shade budget, USD each. No additional margin. Size band ID uses inches; sales enters feet.':key==='shadeAllowances'?'Historical selling allowance or explicit planning input. Material shares are percentages; blank tax split remains unresolved. No duplicate margin or base wiring labor.':key==='laborFactors'?'Confirmed installation-method factor. Cable uses the highest route/access factor; device work uses working access/height.':key==='currentRate'?'Flat USD per person-hour on all dates.':key==='accessOpeningsPerRoute'?'Legacy setting retained for older releases; the installation planner uses route segments and selectiveOpeningSpacingFt.':key==='newCircuitsPerRoom'?'Provisional new-circuit count per active room when new circuits selected; load schedule still required.':['keypadCableFtPer','branchRunFt','loadHomeRunFt','networkRunFt','circuitFeedFt','panelFeedFt','panelQsRunFt','linearLeadFt','fixtureSpacingFt'].includes(key)?'Provisional medium-run length in ft; adjust to company practice.':key==='materialTax'?'Percentage applied to material selling amounts.':key==='dayHours'||key==='travelBasis'?'Fixed one 2-person crew, 8-hour on-site day.':key==='timezone'?'Use America/New_York.':key==='rateDate'?'YYYY-MM-DD; labor schedule is based on installation date.':'';push(r);}}
return out;}
function csv(matrix){return '\uFEFF'+matrix.map(r=>r.map(v=>{let s=String(v??'');if(typeof v==='string'&&/^[=+@-]/.test(s))s="'"+s;return /[",\n\r]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;}).join(',')).join('\r\n');}
function parse(text){if(text.length>3000000)throw Error('Spreadsheet file is too large.');text=text.replace(/^\uFEFF/,'');const all=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted)quoted=false;else if(cell==='')quoted=true;else throw Error('Invalid CSV quote.');}else if(ch===','&&!quoted){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x!==''))all.push(row);row=[];cell='';}else cell+=ch;}if(quoted)throw Error('Unclosed CSV quote.');row.push(cell);if(row.some(x=>x!==''))all.push(row);if(all.length>1000)throw Error('Too many spreadsheet rows.');return all;}
function number(v,label,signed=false){if(v==='')return null;const format=signed?/^-?\d+(?:\.\d+)?$/:/^\d+(?:\.\d+)?$/;if(!format.test(v)||!Number.isFinite(Number(v)))throw Error(label+': enter a valid number without currency symbols.');return Number(v);}
function importCSV(text,base){const matrix=parse(text);
const signature = JSON.stringify(matrix[0]);
const currentFormat = signature === JSON.stringify(HEADER);
const columns = currentFormat ? HEADER : LEGACY_HEADER;
if (signature !== JSON.stringify(columns)) throw Error('Use the complete Price List tab with its original column headers.');
const expected=rows(base),ids=new Set(expected.slice(1).map(r=>r[0]+':'+r[1])),seen=new Set(),state=copy(base),meta={};for(const cells of matrix.slice(1)){if(cells.length!==columns.length)throw Error('A spreadsheet row has the wrong number of columns.');const r=Object.fromEntries(columns.map((k,i)=>[k,cells[i]])),key=r.Type+':'+r.ID;if(!ids.has(key)||seen.has(key))throw Error('Unknown or duplicate row: '+key);seen.add(key);if(r.Type==='metadata'){meta[r.ID]=r.Value;continue;}if(r.Type==='product'){const x=state.config.catalog.find(x=>x.id===r.ID);if(!['each','ft','m'].includes(r.Unit)||!['margin','msrp'].includes(r['Price method'])||!['small','large'].includes(r['Parts size']))throw Error('Invalid unit, price method or parts size: '+r.ID);if(r.SKU!==x.sku||r.Unit!==x.unit)x.verified=false;x.name=r.Description;x.sku=r.SKU;x.cost=number(r['Cost USD'],r.ID+' cost');x.msrp=number(r['MSRP USD'],r.ID+' MSRP');x.unit=r.Unit;x.pricing=r['Price method'];x.kind=r['Parts size'];x.source=r.Source;
if (currentFormat) {
  for (const [column, key] of Object.entries(PRODUCT_CHECKS)) {
    const checked = r[column].trim().toUpperCase();
    if (!['TRUE', 'FALSE'].includes(checked)) throw Error(`${r.ID}: ${column} must be TRUE or FALSE.`);
    x[key] = checked === 'TRUE';
  }
  if (x.verified && !x.sku.trim()) throw Error(`${r.ID}: enter the exact SKU before marking it verified.`);
  x.pdus = number(r['QS PDUs'], r.ID + ' QS PDUs');
}
}
else if(r.Type==='labor'){if(!['TRUE','FALSE'].includes(r['On site'].toUpperCase()))throw Error('On site must be TRUE or FALSE.');state.config.labor[r.ID]=number(r['Hours per unit'],r.ID+' hours');state.config.laborOnsite[r.ID]=r['On site'].toUpperCase()==='TRUE';}
else{const [a,b]=r.ID.split('.'),old=b?state.config[a][b]:state.config[a];if(typeof old==='boolean'&&!['TRUE','FALSE'].includes(r.Value.toUpperCase()))throw Error(r.ID+': use TRUE or FALSE.');const v=typeof old==='boolean'?r.Value.toUpperCase()==='TRUE':typeof old==='string'?r.Value:number(r.Value,r.ID,a==='rangeLowPct'||a==='rangeHighPct');if(b)state.config[a][b]=v;else state.config[a]=v;}}
if (seen.size !== ids.size) {
  const missing = [...ids].filter(key => !seen.has(key) && !['setting:shippingHandling','setting:fixtureSpacingFt',...M.ESTATE_ADDED_ROWS.map(id=>'product:'+id)].includes(key));
  if (missing.length && (currentFormat || missing.length !== M.LUMARIS_ADDED_ROWS.length || missing.some(key => !M.LUMARIS_ADDED_ROWS.some(id => key === 'product:' + id)))) throw Error('The Price List tab is missing required rows.');
  if (!seen.has('setting:shippingHandling')) state.config.shippingHandling = false;
  if (!seen.has('setting:fixtureSpacingFt')) state.config.fixtureSpacingFt = 0;
  for (const id of M.ESTATE_ADDED_ROWS.filter(id=>!seen.has('product:'+id))) Object.assign(state.config.catalog.find(row=>row.id===id), M.initial().config.catalog.find(row=>row.id===id));
  for (const id of M.LUMARIS_ADDED_ROWS.filter(id => id.endsWith('_hw') && missing.includes('product:' + id))) {
    const oldId = id.slice(0, -3);
    const oldRow = state.config.catalog.find(row => row.id === oldId);
    if (!/^HWL-/i.test(oldRow.sku.trim())) continue;
    const variant = state.config.catalog.find(row => row.id === id);
    for (const field of ['sku', 'cost', 'msrp', 'unit', 'pricing', 'kind', 'source']) variant[field] = oldRow[field];
    variant.verified = false;
    Object.assign(oldRow, base.config.catalog.find(row => row.id === oldId));
  }
}
if(meta.currency!=='USD')throw Error('Currency must be USD.');return P.make(state,meta.catalogVersion,meta.effectiveAt);}
const api={HEADER,rows,csv,parse,importCSV};root.PriceSheet=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

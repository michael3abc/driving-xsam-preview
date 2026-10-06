// Static-only Direct Upload. No dependency install, build, Git integration or research access.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const project='driving-xsam-preview';
const expected=['index.html','README.md','LINKEDIN.md','media/README.md','media/showcase-montage.mp4','media/contact-sheet.jpg'];
for(let n=1;n<=5;n++)for(const ext of ['mp4','jpg'])expected.push('media/case-0'+n+'.'+ext);
expected.sort();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'),'utf8'));
const site=path.join(root,'site');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function assert(value,message){if(!value)throw new Error(message);}
function inventory(dir,prefix=''){
 const result=[];
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const rel=prefix+entry.name;
  assert(!entry.isSymbolicLink(),'Symlink in publication package');
  if(entry.isDirectory())result.push(...inventory(path.join(dir,entry.name),rel+'/'));
  else {assert(entry.isFile(),'Non-regular publication file');result.push(rel);}
 }
 return result.sort();
}
function verify(){
 assert(manifest.schema==='static-showcase-v1'&&manifest.project===project,'Wrong release identity');
 assert(JSON.stringify(manifest.files.map(f=>f.path).sort())===JSON.stringify(expected),'Wrong manifest allowlist');
 assert(JSON.stringify(inventory(site))===JSON.stringify(expected),'Unapproved or missing public file');
 for(const file of manifest.files){
  assert(file.bytes<=25*1024*1024,'Pages per-file limit exceeded');
  const bytes=fs.readFileSync(path.join(site,file.path));
  assert(bytes.length===file.bytes&&sha(bytes)===file.sha256,'Changed package file: '+file.path);
 }
 console.log('Verified 16 approved static files and all locked sizes/SHA256 values.');
}
const [command,...flags]=process.argv.slice(2);
function option(name){const i=flags.indexOf('--'+name);return i<0?undefined:flags[i+1];}
function run(args,{capture=false,env={}}={}){
 const result=spawnSync(process.execPath,[option('wrangler'),...args],{
  cwd:root,env:{...process.env,...env},encoding:'utf8',stdio:capture?'pipe':'inherit',timeout:300000});
 assert(result.status===0,result.stderr||result.error?.message||'Wrangler failed');
 return result.stdout;
}
function jsonOutput(text){
 // Wrangler --json keeps diagnostics off stdout. Reject ambiguous/non-JSON output.
 return JSON.parse(text.trim());
}
function currentCommit(){
 const r=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});
 assert(r.status===0,'Publication commit is required');return r.stdout.trim();
}
function clean(){
 const r=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'});
 assert(r.status===0&&!r.stdout.trim(),'Commit the approved package before deployment');
}
function receiptFolder(){
 const dir=path.join(root,'.release-receipts',new Date().toISOString().replaceAll(':','-'));
 fs.mkdirSync(dir,{recursive:true,mode:0o700});return dir;
}
function save(dir,receipt){fs.writeFileSync(path.join(dir,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});}
async function readback(url,dir,locked=manifest,localSite=site){
 const origin=new URL(url);
 assert(origin.protocol==='https:'&&!origin.username&&!origin.password&&!origin.search&&!origin.hash,'Invalid deployment origin');
 assert(origin.hostname===project+'.pages.dev'||/^[a-z0-9-]+\.driving-xsam-preview\.pages\.dev$/.test(origin.hostname),'Unexpected publication destination');
 const files=[];
 for(const file of locked.files){
  const remote=new URL(file.path==='index.html'?'/':'/'+file.path,origin);
  const response=await fetch(remote,{redirect:'manual',signal:AbortSignal.timeout(45000),cache:'no-store'});
  assert(response.status===200,'Unexpected readback status '+response.status+' for '+file.path);
  const bytes=Buffer.from(await response.arrayBuffer());
  const dest=path.join(dir,'readback',file.path);fs.mkdirSync(path.dirname(dest),{recursive:true,mode:0o700});
  fs.writeFileSync(dest,bytes,{mode:0o600});
  assert(bytes.length===file.bytes&&sha(bytes)===file.sha256,'Readback mismatch: '+file.path);
  files.push({...file,status:response.status,contentType:response.headers.get('content-type')});
 }
 const media=locked.files.find(f=>f.path==='media/showcase-montage.mp4');
 const range=await fetch(new URL('/'+media.path,origin),{headers:{Range:'bytes=0-0'},redirect:'manual',signal:AbortSignal.timeout(45000)});
 const first=Buffer.from(await range.arrayBuffer());
 if(range.status===206){
  assert(range.headers.get('content-range')==='bytes 0-0/'+media.bytes,'Unexpected partial-content range');
  assert(first.length===1&&first[0]===fs.readFileSync(path.join(localSite,media.path))[0],'Range first byte mismatch');
 }else{
  // The authored viewer explicitly seeks a fetched Blob; native HTTP Range is not required.
  // Record the server limitation rather than claiming native Range support.
  assert(range.status===200&&first.length===media.bytes&&sha(first)===media.sha256,'Invalid full-response Range behavior');
 }
 return {files,nativeRangeSupported:range.status===206,rangeResponseStatus:range.status,rangeResponseBytesVerified:true};
}
async function readbackAfterAliasConvergence(url,dir,locked=manifest,localSite=site){
 const failures=[];
 for(let attempt=1;attempt<=12;attempt++){
  try {
   const verified=await readback(url,path.join(dir,'attempt-'+attempt),locked,localSite);
   return {...verified,convergenceAttempts:attempt,priorFailures:failures};
  } catch(error) {
   failures.push({attempt,at:new Date().toISOString(),error:String(error)});
   if(attempt===12)throw new Error('Pages production alias did not converge after 12 recorded attempts',{cause:error});
   await new Promise(resolve=>setTimeout(resolve,2500));
  }
 }
}
function prepareRestore(deployment,dir){
 const source=deployment.Source;
 assert(/^[a-f0-9]{7,40}$/.test(source||''),'Previous production commit is unknown');
 const resolved=spawnSync('git',['rev-parse','--verify',source+'^{commit}'],{cwd:root,encoding:'utf8'});
 assert(resolved.status===0,'Previous production commit is not available locally');
 const commit=resolved.stdout.trim();
 const show=name=>{
  const result=spawnSync('git',['show',commit+':'+name],{cwd:root,maxBuffer:30*1024*1024});
  assert(result.status===0,'Previous approved package is unavailable');return result.stdout;
 };
 const locked=JSON.parse(show('release-manifest.json').toString());
 assert(locked.schema==='static-showcase-v1'&&locked.project===project,'Previous package identity mismatch');
 assert(JSON.stringify(locked.files.map(f=>f.path).sort())===JSON.stringify(expected),'Previous package allowlist mismatch');
 const previousSite=path.join(dir,'restore-site');
 for(const file of locked.files){
  const bytes=show('site/'+file.path);
  assert(file.bytes<=25*1024*1024&&bytes.length===file.bytes&&sha(bytes)===file.sha256,'Previous package hash mismatch');
  const dest=path.join(previousSite,file.path);fs.mkdirSync(path.dirname(dest),{recursive:true,mode:0o700});
  fs.writeFileSync(dest,bytes,{mode:0o600});
 }
 return {commit,site:previousSite,manifest:locked,deploymentId:deployment.Id};
}
async function restore(previous,env,dir){
 const output=run(['pages','deploy',previous.site,'--project-name',project,'--branch','main','--commit-hash',previous.commit,'--commit-dirty=false'],{capture:true,env});
 fs.writeFileSync(path.join(dir,'restore.log'),output,{mode:0o600});
 const verified=await readbackAfterAliasConvergence('https://'+project+'.pages.dev',path.join(dir,'restored'),previous.manifest,previous.site);
 return {previousCommit:previous.commit,previousDeploymentId:previous.deploymentId,restoredBytesVerified:verified.files.length};
}

verify();
if(command==='verify')process.exit(0);
const dir=receiptFolder();
const receipt={project,commit:currentCommit(),startedAt:new Date().toISOString(),status:'running',browserVerified:false};
let restoreOnError=null,releaseEnv=null;
try{
 if(command==='readback'){
  receipt.url=option('url');assert(receipt.url,'--url is required');
  Object.assign(receipt,await readback(receipt.url,dir));receipt.status='readback-verified';
 }else if(command==='restore'){
  assert(option('receipt')&&option('wrangler')&&/^[a-f0-9]{32}$/.test(option('account-id')||''),'Restoration requires the failed production receipt, Wrangler and confirmed account');
  const failed=JSON.parse(fs.readFileSync(option('receipt'),'utf8'));
  assert(failed.project===project&&failed.environment==='production'&&failed.previousProduction,'No verified previous production version');
  const env={CLOUDFLARE_ACCOUNT_ID:option('account-id')};
  receipt.rollback=await restore(prepareRestore(failed.previousProduction,dir),env,dir);
  receipt.status='previous-production-restored';
 }else if(command==='deploy'){
  clean();assert(/^[a-f0-9]{32}$/.test(option('account-id')||''),'Confirmed --account-id required');
  assert(option('wrangler')&&path.isAbsolute(option('wrangler')),'Explicit pinned --wrangler path required');
  const env={CLOUDFLARE_ACCOUNT_ID:option('account-id')};
  assert(run(['--version'],{capture:true,env}).includes('4.147.0'),'Wrong Wrangler version');
  const projects=jsonOutput(run(['pages','project','list','--json'],{capture:true,env}));
  const found=projects.find(p=>p['Project Name']===project);
  assert(found,'Exact project does not exist; never create/rename automatically');
  assert(found['Git Provider']==='No','Git-integrated projects are not allowed');
  assert(found['Project Domains'].split(', ').includes(project+'.pages.dev'),'Project name/domain conflict');
  const production=flags.includes('--production');
  receipt.environment=production?'production':'preview';
  if(production){
   assert(option('browser-receipt'),'Production requires a preview browser receipt');
   const browser=JSON.parse(fs.readFileSync(option('browser-receipt'),'utf8'));
   assert(browser.label==='deployed-preview'&&browser.htmlSha256===manifest.files.find(f=>f.path==='index.html').sha256,'Wrong preview browser evidence');
   assert(browser.staticViewerActionsAbsent&&!browser.errors.length&&!browser.externalRequests.length&&!browser.backendRequests.length,'Preview browser gate failed');
   assert(browser.mediaPlayback.length===6&&browser.offlineMediaPlayback.length===6&&browser.caseJumps.length===5&&browser.montageSeeks.length===13&&browser.ended.id==='case-05'&&browser.replay,'Preview media gate incomplete');
   receipt.previewBrowserReceiptSha256=sha(fs.readFileSync(option('browser-receipt')));
  }
  const before=jsonOutput(run(['pages','deployment','list','--project-name',project,'--environment','production','--json'],{capture:true,env}));
  receipt.previousProduction=before[0]||null;
  const previous=production&&receipt.previousProduction?prepareRestore(receipt.previousProduction,dir):null;
  restoreOnError=previous;releaseEnv=env;
  const branch=production?'main':'release-'+receipt.commit.slice(0,7);
  const output=run(['pages','deploy',site,'--project-name',project,'--branch',branch,'--commit-hash',receipt.commit,'--commit-dirty=false'],{capture:true,env});
  fs.writeFileSync(path.join(dir,'upload.log'),output,{mode:0o600});
  const urls=output.match(/https:\/\/[a-z0-9-]+\.driving-xsam-preview\.pages\.dev/g)||[];
  assert(urls.length,'Deployment URL was not returned');receipt.url=urls[0];
  const after=jsonOutput(run(['pages','deployment','list','--project-name',project,'--environment',receipt.environment,'--json'],{capture:true,env}));
  receipt.deployment=after.find(d=>d.Deployment===receipt.url);
  assert(receipt.deployment,'Deployment identity missing');
  save(dir,receipt);
  try{
   receipt.deploymentReadback=await readback(receipt.url,dir);
   if(production)receipt.productionReadback=await readbackAfterAliasConvergence('https://'+project+'.pages.dev',path.join(dir,'production'));
  }catch(error){
   if(previous)receipt.rollback=await restore(previous,env,dir);
   throw error;
  }
  receipt.status='readback-verified';
 }else throw new Error('Use verify, deploy or readback');
 receipt.completedAt=new Date().toISOString();save(dir,receipt);
 console.log(JSON.stringify({receipt:path.join(dir,'receipt.json'),status:receipt.status,url:receipt.url}));
}catch(error){
 receipt.status='failed';receipt.error=String(error);
 if(restoreOnError&&!receipt.rollback){
  try{receipt.rollback=await restore(restoreOnError,releaseEnv,dir);}
  catch(restoreError){receipt.rollbackError=String(restoreError);}
 }
 save(dir,receipt);throw error;
}

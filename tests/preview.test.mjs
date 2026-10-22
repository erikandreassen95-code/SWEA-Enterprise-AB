import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewHandler } from '../api/sitecms/preview.mjs';
import { createPreviewContentHandler } from '../api/sitecms/content.mjs';
import { renderSite } from '../lib/render-site.mjs';
import { readFileSync } from 'node:fs';

const env = { CMS_API_KEY: 'private-test-key' };
const verified = { ok: true, panelOrigin: 'https://sitecms.se' };
async function invoke(handler, url, cookie = '', method = 'GET') {
  const res = { headers:{}, setHeader(k,v){this.headers[k]=v;}, end(body){this.body=body;} };
  await handler({url,method,headers:{cookie}},res);
  return res;
}
test('verified token creates isolated secure partitioned cookies then redirects locally', async () => {
  const handler = createPreviewHandler({ env, fetchImpl:async(url,options)=>{
    assert.equal(url,'https://sitecms.se/api/v1/site/preview');
    assert.equal(options.headers['x-api-key'],env.CMS_API_KEY);
    assert.equal(options.headers['x-sitecms-preview'],'test-token');
    return {ok:true,json:async()=>verified};
  }});
  const r = await invoke(handler,'/api/sitecms/preview?token=test-token&path=%2Fkontakt%2F');
  assert.equal(r.statusCode,307); assert.equal(r.headers.Location,'/kontakt/');
  assert.equal(r.headers['Set-Cookie'].length,3);
  for(const c of r.headers['Set-Cookie']) assert.match(c,/Secure; SameSite=None; Partitioned; Path=\/; Max-Age=7200/);
  assert.match(r.headers['Set-Cookie'][0],/HttpOnly/);
  assert.match(r.headers['Set-Cookie'][1],/HttpOnly/);
  assert.doesNotMatch(r.headers['Set-Cookie'][2],/HttpOnly/);
  assert.equal(r.headers['Cache-Control'],'no-store');
});
test('rejects redirects, malicious origins, failed verification and missing tokens',async()=>{
  for(const path of ['//evil.test','/\\evil.test','https://evil.test','/%2fevil.test','/\r\nevil']){
    const r=await invoke(createPreviewHandler({env}),'/api/sitecms/preview?token=test&path='+encodeURIComponent(path));
    assert.equal(r.statusCode,401); assert.equal(r.headers.Location,undefined);
  }
  for(const data of [{ok:true,panelOrigin:'https://evil.test'},{ok:false,panelOrigin:'https://sitecms.se'}]) {
    const r=await invoke(createPreviewHandler({env,fetchImpl:async()=>({ok:true,json:async()=>data})}),'/api/sitecms/preview?token=test');
    assert.equal(r.statusCode,401); assert.doesNotMatch(r.body,/private-test-key/);
  }
  assert.equal((await invoke(createPreviewHandler({env}),'/api/sitecms/preview')).statusCode,401);
});
test('disable clears all three cookies without CMS request',async()=>{
  const r=await invoke(createPreviewHandler({env,fetchImpl:()=>{throw Error('No network');}}),'/api/sitecms/preview?disable=1&path=/');
  assert.equal(r.statusCode,307);for(const c of r.headers['Set-Cookie'])assert.match(c,/Max-Age=0/);
});
test('preview content is never available without a verified HttpOnly token',async()=>{
  const handler=createPreviewContentHandler({env,fetchImpl:async()=>{throw Error('No network');}});
  const r=await invoke(handler,'/api/sitecms/content');assert.equal(r.statusCode,401);assert.deepEqual(JSON.parse(r.body),{preview:false});
});
test('preview content forwards token without exposing key or token and rejects expired token',async()=>{
  const content={pages:[],seo:[]};let calls=0;
  const handler=createPreviewContentHandler({env,fetchImpl:async(url,options)=>{
    assert.equal(options.cache,'no-store');assert.equal(options.headers['x-sitecms-preview'],'test');calls++;
    return {ok:true,json:async()=>calls===1?verified:content};
  }});
  const r=await invoke(handler,'/api/sitecms/content','sitecms_preview=test; sitecms_preview_origin=https%3A%2F%2Fevil.test');
  assert.equal(r.statusCode,200);assert.deepEqual(JSON.parse(r.body),{preview:true,panelOrigin:'https://sitecms.se',content});
  assert.doesNotMatch(r.body,/private-test-key/);
  const expired=createPreviewContentHandler({env,fetchImpl:async()=>({ok:false,status:401})});
  assert.equal((await invoke(expired,'/api/sitecms/content','sitecms_preview=test')).statusCode,401);
});
test('all 31 CMS fields have DOM markers including repeated service names',()=>{
  const schema=JSON.parse(readFileSync(new URL('../sitecms.schema.json',import.meta.url)));
  const html=[...renderSite().values()].join('');
  for(const page of schema.pages)for(const block of page.blocks)assert.ok(html.includes(`data-sitecms="${page.slug}:${block.key}"`),`${page.slug}:${block.key}`);
});

import { readFile } from 'node:fs/promises';
import { cmsSettings } from '../lib/sitecms.mjs';

const settings = cmsSettings({ ...process.env, CMS_REQUIRED: 'true' });
const schema = JSON.parse(await readFile(new URL('../sitecms.schema.json', import.meta.url), 'utf8'));
if (schema.prune !== false) throw new Error('Schemat måste synkas utan borttagning (prune:false).');
const response = await fetch(`${settings.baseUrl}/schema`, {
  method: 'POST',
  headers: { 'x-api-key': settings.apiKey, 'Content-Type': 'application/json' },
  body: JSON.stringify(schema),
  redirect: 'error',
  signal: AbortSignal.timeout(25_000),
});
if (!response.ok) throw new Error(`SiteCMS schema-sync misslyckades (HTTP ${response.status}).`);
const report = await response.json();
if (report.ok !== true) throw new Error('SiteCMS bekräftade inte schema-sync.');
console.log(`SiteCMS: ${schema.pages.length} sidor synkade. Befintligt innehåll bevaras.`);

import fs from 'fs';
import path from 'path';

type Config = Record<string, any>;

function loadJson(p: string): Config {
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

function merge(base: Config, override: Config): Config {
  const out = { ...base };
  for (const k of Object.keys(override)) {
    if (override[k] && typeof override[k] === 'object' && !Array.isArray(override[k]) && typeof out[k] === 'object') {
      out[k] = merge(out[k], override[k]);
    } else {
      out[k] = override[k];
    }
  }
  return out;
}

function applyEnv(cfg: Config, prefix = 'APP_'): Config {
  const out = { ...cfg };
  for (const [k, v] of Object.entries(process.env)) {
    if (!k.startsWith(prefix)) continue;
    const key = k.slice(prefix.length).toLowerCase();
    if (v === 'true') out[key] = true;
    else if (v === 'false') out[key] = false;
    else if (v && /^-?\d+(\.\d+)?$/.test(v)) out[key] = Number(v);
    else out[key] = v;
  }
  return out;
}

function validate(cfg: Config, schema: Record<string, string>): string[] {
  const errors: string[] = [];
  for (const [k, type] of Object.entries(schema)) {
    if (!(k in cfg)) { errors.push(`missing ${k}`); continue; }
    const v = cfg[k];
    if (type === 'number' && typeof v !== 'number') errors.push(`${k} must be number`);
    if (type === 'string' && typeof v !== 'string') errors.push(`${k} must be string`);
    if (type === 'boolean' && typeof v !== 'boolean') errors.push(`${k} must be boolean`);
  }
  return errors;
}

const profile = process.argv[2] || 'default';
const base = loadJson(path.join(process.cwd(), 'config', 'base.json'));
const prof = loadJson(path.join(process.cwd(), 'config', profile + '.json'));
let cfg = merge(base, prof);
cfg = applyEnv(cfg);
const schema = loadJson(path.join(process.cwd(), 'config', 'schema.json'));
const errs = validate(cfg, schema);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(JSON.stringify(cfg, null, 2));

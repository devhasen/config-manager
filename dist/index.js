"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function loadJson(p) {
    if (!fs_1.default.existsSync(p))
        return {};
    try {
        return JSON.parse(fs_1.default.readFileSync(p, 'utf8'));
    }
    catch {
        return {};
    }
}
function merge(base, override) {
    const out = { ...base };
    for (const k of Object.keys(override)) {
        if (override[k] && typeof override[k] === 'object' && !Array.isArray(override[k]) && typeof out[k] === 'object') {
            out[k] = merge(out[k], override[k]);
        }
        else {
            out[k] = override[k];
        }
    }
    return out;
}
function applyEnv(cfg, prefix = 'APP_') {
    const out = { ...cfg };
    for (const [k, v] of Object.entries(process.env)) {
        if (!k.startsWith(prefix))
            continue;
        const key = k.slice(prefix.length).toLowerCase();
        if (v === 'true')
            out[key] = true;
        else if (v === 'false')
            out[key] = false;
        else if (v && /^-?\d+(\.\d+)?$/.test(v))
            out[key] = Number(v);
        else
            out[key] = v;
    }
    return out;
}
function validate(cfg, schema) {
    const errors = [];
    for (const [k, type] of Object.entries(schema)) {
        if (!(k in cfg)) {
            errors.push(`missing ${k}`);
            continue;
        }
        const v = cfg[k];
        if (type === 'number' && typeof v !== 'number')
            errors.push(`${k} must be number`);
        if (type === 'string' && typeof v !== 'string')
            errors.push(`${k} must be string`);
        if (type === 'boolean' && typeof v !== 'boolean')
            errors.push(`${k} must be boolean`);
    }
    return errors;
}
const profile = process.argv[2] || 'default';
const base = loadJson(path_1.default.join(process.cwd(), 'config', 'base.json'));
const prof = loadJson(path_1.default.join(process.cwd(), 'config', profile + '.json'));
let cfg = merge(base, prof);
cfg = applyEnv(cfg);
const schema = loadJson(path_1.default.join(process.cwd(), 'config', 'schema.json'));
const errs = validate(cfg, schema);
if (errs.length) {
    console.error(errs.join('\n'));
    process.exit(1);
}
console.log(JSON.stringify(cfg, null, 2));

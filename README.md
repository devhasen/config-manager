# config-manager

Layered config manager with profiles, env override and validation.

## Layout

```
config/
  base.json
  default.json
  prod.json
  schema.json
```

## Usage

```bash
cfg prod
APP_PORT=9000 cfg prod
```

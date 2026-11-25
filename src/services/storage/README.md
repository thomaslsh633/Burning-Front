# src/services/storage/

**Layer 3 — Data / Service** — The only place that touches localStorage.

## Owns
- namespaced keys
- quota and error handling

## Public API (planned, exported from `index.js`)
- `createStorage(namespace)`
- `get`
- `set`
- `remove`
- `keys`

## May import
- `services/*` only (other systems through their `index.js`)

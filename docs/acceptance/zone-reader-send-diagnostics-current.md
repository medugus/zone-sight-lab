# Zone Reader Send to LIS diagnostics — current state

## Correct deployed Medugu boundary

The Send to LIS diagnostics now point operators at the deployed Medugu Zone Reader intake path:

```text
POST /api/public/zone-reader/result
```

Operator-facing examples use the full URL form:

```text
https://your-medugu-host/api/public/zone-reader/result
```

No retired Medugu intake path is shown in Send to LIS guidance, examples, diagnostics, or tests.

## Endpoint validation diagnostics

Before dispatch, Zone Reader validates only local operator-entry requirements:

- the endpoint must be present;
- the endpoint must be a full `http` or `https` URL, not a relative path;
- obvious preview hosts are blocked;
- stable published hosts, including stable `lovable.app` hosts, are allowed.

Exact user-facing endpoint messages:

- Missing endpoint: `Missing Medugu endpoint: enter the full Medugu URL before sending to LIS. Example: https://your-medugu-host/api/public/zone-reader/result`
- Relative or malformed endpoint: `Invalid Medugu endpoint: enter the full Medugu URL, not a relative path. Example: https://your-medugu-host/api/public/zone-reader/result`
- Preview host: `Preview Medugu endpoint blocked: use the published/stable Medugu URL for Send to LIS. Obvious preview hosts such as id-preview--... or preview--... are not allowed. Example: https://your-medugu-host/api/public/zone-reader/result`
- Medugu 404 response: `Medugu endpoint was not found (404). Confirm the full URL uses /api/public/zone-reader/result.`

## Preview-host rule

Previous broad rule to avoid: treating every `.lovable.app` host as invalid.

Current narrowed rule: inspect hostname labels and block only labels that are clear preview markers:

- exactly `preview`;
- starting with `preview--`;
- starting with `id-preview--`;
- containing `-preview--`;
- containing `--preview--`;
- ending with `--preview`.

This means `https://medugu-stable.lovable.app/api/public/zone-reader/result` is allowed, while `https://id-preview--medugu.lovable.app/api/public/zone-reader/result` is blocked before dispatch.

## Authentication and fallback preserved

Bearer authentication is still required before any network request:

```text
Authorization: Bearer <Medugu ZoneResult token>
```

The exact missing-token diagnostic remains:

```text
Missing Medugu bearer token: enter the bearer token before sending to LIS.
```

Manual JSON export remains visible on the Reports page as the fallback if live Send to LIS is not configured or fails.

## Tests refreshed

The Send to LIS diagnostics tests cover:

- schema-valid payload reuse with bearer auth;
- stable published `lovable.app` host allowed;
- obvious preview host blocked before dispatch;
- `404` response message naming `/api/public/zone-reader/result`;
- missing bearer token preserved;
- missing endpoint and relative endpoint diagnostics using `/api/public/zone-reader/result`;
- schema validation failure before send;
- request/network failure;
- manual JSON export fallback remaining visible.

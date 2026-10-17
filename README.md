# AmableData app catalog

The public catalog of apps that extend [AmableData](https://github.com/Ratne/AmableData).
Every installation, managed or self-hosted, downloads the signed index published by this
repository and shows the apps in its Marketplace.

Apps are hosted by their developers. AmableData never runs third-party code: it calls the
app's endpoints with signed requests, hands it an OAuth token limited to the scopes the
workspace approved, and shows its screens in sandboxed iframes.

## Publish an app

1. Build the app with the [developer guide](https://github.com/Ratne/AmableData/blob/main/docs/apps/README.md)
   (`npx create-amable-app` gives you a working Cloudflare Worker).
2. Run the conformance suite locally against a development installation:
   `npx amable-app test --manifest manifest.json --local`.
3. Open a pull request that adds `apps/<your-app-id>/manifest.json`. The folder name is the app id
   and can never change.
4. CI validates the manifest, checks that `base_url` and the JWKS are live and that every
   endpoint rejects unsigned requests. A maintainer reviews the scopes, the privacy policy
   and the app itself, then merges.
5. Within six hours every installation sees the app in its Marketplace.

Updates follow the same path. Changing `base_url` or `jwks_url` of a published app needs an
out-of-band check of the developer (label `identity-change-approved`). Apps asking for new
scopes stay installed with the old ones until each workspace approves the new ones.

## Rules

- `https` everywhere, no development URLs.
- Ask only for the scopes the app uses. Apps that read personal data must handle the
  `privacy.erasure_requested` and `privacy.data_requested` webhooks.
- Billing is the developer's business: declare it in `pricing`, link it with `billing_url`.
- A maintainer can revoke an app (`apps/<id>/catalog.json` with `"revoked": true`). Revoked
  apps are disabled on every installation at the next catalog sync (immediately on managed ones).

## How the index is published

On every push to `main` (and daily) the `Publish catalog` workflow validates every manifest,
builds `index.json`, signs it with the catalog Ed25519 key (`CATALOG_SIGNING_KEY` secret) and
attaches `index.signed.json` to a new `latest` release. Installations pin the public key and
ignore any index whose signature does not match.

## App

- App id:
- Developer contact:
- New app / update:
- Source code (public repository):

## Checklist

- [ ] `apps/<id>/manifest.json` only (no `catalog.json`, no other app touched)
- [ ] The app is live at `base_url` and its JWKS is published at `jwks_url`
- [ ] Every request from AmableData is verified (`Amable-Signature` HMAC, 5 minute tolerance)
- [ ] `privacy.erasure_requested` and `privacy.data_requested` are handled within 30 days
- [ ] The privacy policy at `privacy_url` describes what the app stores and for how long
- [ ] The app ships offline tests against recorded provider answers (`test/fixtures/`, see
      [Tests and fixtures](https://github.com/Ratne/AmableData/blob/main/docs/apps/README.md#tests-and-fixtures-required)),
      with the script that records them; no credential or personal data in the fixtures
- [ ] Hooks fail open within their budget; actions and provider webhooks are idempotent
- [ ] Local conformance run passes:

```
npx amable-app test --manifest apps/<id>/manifest.json --local
```

<details><summary>Conformance output</summary>

```
paste here
```

</details>

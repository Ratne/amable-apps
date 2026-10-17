## App

- App id:
- Developer contact:
- New app / update:

## Checklist

- [ ] `apps/<id>/manifest.json` only (no `catalog.json`, no other app touched)
- [ ] The app is live at `base_url` and its JWKS is published at `jwks_url`
- [ ] Every request from AmableData is verified (`Amable-Signature` HMAC, 5 minute tolerance)
- [ ] `privacy.erasure_requested` and `privacy.data_requested` are handled within 30 days
- [ ] The privacy policy at `privacy_url` describes what the app stores and for how long
- [ ] Local conformance run passes:

```
npx amable-app test --manifest apps/<id>/manifest.json --local
```

<details><summary>Conformance output</summary>

```
paste here
```

</details>

# feature-flags

Browser-persisted feature flags behind the Beta tab of the settings modal.

- `FEATURE_FLAGS` lists every flag with its label and description; add a flag
  there and it shows up in Settings → Beta with a switch.
- `useFeatureFlag(id)` / `useFeatureFlags()` read and write the flags. They are
  kept in `localStorage` under one key, so every caller and every tab agrees
  without a provider.
- `<FeatureGate flag="...">` renders its children only while the flag is on.

## Running unit tests

Run `nx test bublik-features-feature-flags` to execute the unit tests via
[Vitest](https://vitest.dev/).

# Changelog

## 1.0.0 (2026-06-25)


### Features

* parse the expo-router route tree from the app/ directory ([#1](https://github.com/KMavr/deeplink-doctor/issues/1)) ([a574747](https://github.com/KMavr/deeplink-doctor/commit/a574747b7dbdff78020d92c0057cbecf278e77ec))
* read native deep-link config from `expo config --json` ([#2](https://github.com/KMavr/deeplink-doctor/issues/2)) ([43f4ad5](https://github.com/KMavr/deeplink-doctor/commit/43f4ad51ab9f32f92fe902555caefe119e913d23))
* reconcile routes against native config — DL001/DL002 + check command ([#3](https://github.com/KMavr/deeplink-doctor/issues/3)) ([8ce30cd](https://github.com/KMavr/deeplink-doctor/commit/8ce30cd30f3b30015dfdf789da8b64e29cab3ef4))
* add config-hygiene checks DL003 and DL101–DL104 ([#4](https://github.com/KMavr/deeplink-doctor/issues/4)) ([1cce5cc](https://github.com/KMavr/deeplink-doctor/commit/1cce5cc1287345843bfcfda6c14f4a5ea5eac69d))
* add governed suppressions with DL901/DL902 accountability checks ([#5](https://github.com/KMavr/deeplink-doctor/issues/5)) ([ae7d789](https://github.com/KMavr/deeplink-doctor/commit/ae7d7893ed3949bcb8fb2bdfa53959255b585bf1))
* verify hosted association files over the network — DL2xx via --remote ([#6](https://github.com/KMavr/deeplink-doctor/issues/6)) ([2ce500f](https://github.com/KMavr/deeplink-doctor/commit/2ce500f3c28c710a7c7f634b7b3f8eca5dc0c9fa))
* add --config flag for suppression config path ([#7](https://github.com/KMavr/deeplink-doctor/issues/7)) ([cd581fe](https://github.com/KMavr/deeplink-doctor/commit/cd581fe6743af5e7b729ab6f9ac08e3a1d043ae1))
* add --explain to append finding explanations ([#12](https://github.com/KMavr/deeplink-doctor/issues/12)) ([c0bc95c](https://github.com/KMavr/deeplink-doctor/commit/c0bc95c9d9eb1f5a58db9d48fc06ab308bcbb3e3))
* add --silent flag to hide warnings ([#11](https://github.com/KMavr/deeplink-doctor/issues/11)) ([3055f94](https://github.com/KMavr/deeplink-doctor/commit/3055f94c73c7d2d65501a28ee1353ef800de35b8))
* include suppressed findings in JSON output ([#8](https://github.com/KMavr/deeplink-doctor/issues/8)) ([1eb1f13](https://github.com/KMavr/deeplink-doctor/commit/1eb1f13d0f1818bcb164ad4cf95ed1dd36b74e39))

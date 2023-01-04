# Keep3r V2 subgraph

[![Lint](https://github.com/keep3r-network/keep3r-v2-subgraph/actions/workflows/lint.yml/badge.svg)](https://github.com/keep3r-network/keep3r-v2-subgraph/actions/workflows/lint.yml)
[![Tests](https://github.com/keep3r-network/keep3r-v2-subgraph/actions/workflows/tests.yml/badge.svg)](https://github.com/keep3r-network/keep3r-v2-subgraph/actions/workflows/tests.yml)

This repository aims to create a subgraph that will index basic data about the [Keep3r network](https://keep3r.network/).

It will allow to query for things like:

- Jobs worked (by whom, when, credits or kp3rs minted, etc.)
- Jobs KLPs history (bonded, pending unbonds, etc.)
- Keep3r LPs mint and burns
- Keeper's bonds (history, actives, etc.)

## Deployment

This repository assumes that there are two subgraphs active: a canary, and a stable one. Standard deployment will be done to `canary` as to avoid mistakes.

### Canary

```bash
yarn deploy:ethereum
```

### Stable

```bash
yarn deploy:ethereum:stable
```

## Tests

There is a misc. test implemented, but for anyone looking to contribute and execute the tests

```bash
yarn prepare:ethereum && yarn test
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

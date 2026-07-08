# Task Completion

Run all commands from `challenge-prediction-markets/` (see `mem:core`).

## After implementing/editing a single checkpoint in PredictionMarket.sol

1. `yarn test --grep "CheckpointN"` for the checkpoint just touched (N = 2..9).
2. If the checkpoint affects frontend-visible state, confirm the relevant `getPrediction()` block in
   the contract is uncommented (see `mem:conventions`), then `yarn deploy --reset` and eyeball the
   corresponding page (`/liquidity-provider`, `/oracle`, or `/user`) with `yarn start` running.

## Before considering the whole challenge/task done

1. `yarn test` — full checkpoint suite must pass (this is what the SpeedrunEthereum autograder runs).
2. `yarn lint` — must pass for both `packages/hardhat` and `packages/nextjs`.
3. `yarn hardhat:check-types` and `yarn next:check-types` if TypeScript files (deploy script, witnesses,
   frontend hooks/components) were touched.

Do not attempt `yarn deploy --network sepolia`, `yarn verify`, or `yarn generate` as an agent — they
require an interactive password prompt (see `mem:suggested_commands`).

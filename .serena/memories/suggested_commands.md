# Suggested Commands

All commands run from `challenge-prediction-markets/` (see `mem:core` for why), not the git repo root.

## Dev loop (3 separate terminals)

- `yarn chain` — local Hardhat node.
- `yarn deploy` — deploy `PredictionMarket` (compiles first). Use `yarn deploy --reset` to force a fresh
  redeploy after contract changes (Hardhat 3 + rocketh caches deployments and may skip redeploying otherwise).
- `yarn start` — Next.js dev server at localhost:3000.

## Testing

- `yarn test` — full checkpoint suite (delegates to `yarn hardhat:test` = `hardhat test --network hardhat --gas-stats`).
- `yarn test --grep "Checkpoint4"` etc. — single checkpoint (2 through 9 exist).

## Quality

- `yarn lint` / `yarn format` — runs both `next:*` and `hardhat:*` variants across both packages.
- `yarn hardhat:check-types` / `yarn next:check-types` — `tsc --noEmit --incremental` per package.

## Commands that CANNOT be run by an agent (interactive password prompt)

- `yarn generate` (account:generate), `yarn account`, `yarn account:import`, `yarn account:reveal-pk`
- `yarn deploy --network sepolia`
- `yarn verify` / `yarn hardhat-verify` (testnet contract verification)

## Frontend deploy

- `yarn vercel` / `yarn vercel --prod` (from `packages/nextjs`, or via root workspace script).

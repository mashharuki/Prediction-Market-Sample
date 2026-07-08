# Core

## Repo nesting (non-obvious)

- Git root: `/Users/harukikondo/git/Prediction-Market-Sample` (this repo). It is a thin wrapper —
  only `README.md`, `AGENTS.md`, `CLAUDE.md`, `.ai/`, `.challenge-ai/`, `.claude/`.
- The actual Scaffold-ETH 2 yarn workspace monorepo lives one level down at
  `challenge-prediction-markets/` (has its own `package.json`, `yarn.lock`, `.yarnrc.yml`, `.husky/`).
  **All yarn/hardhat/next commands must be run with cwd = `challenge-prediction-markets/`**, not the git root.
- `CLAUDE.md` at git root just does `@AGENTS.md` — full project instructions (contract spec, checkpoints,
  frontend architecture, commands, code style) live in root `AGENTS.md`. Read that file first; it is the
  canonical source, not duplicated further in these memories.

## What this project is

- A Speedrun Ethereum "Prediction Markets" challenge (AMM-based binary outcome prediction market).
- `challenge-prediction-markets/packages/hardhat/contracts/PredictionMarket.sol` is currently an
  **unimplemented skeleton** — function bodies only contain `/// Checkpoint N ////` comment markers,
  no logic. `getPrediction()` has its return-assignment block entirely commented out.
- `PredictionMarketToken.sol` (ERC-20 outcome token) is fully implemented and provided — do not edit it.
- Grading/checkpoint tests live in `packages/hardhat/test/PredictionMarket.ts` (~64KB, 8 checkpoint groups,
  run via `yarn test --grep "CheckpointN"`), also used by the SpeedrunEthereum autograder.
- `.challenge-ai/progress.json` (learner progress tracker for the `/start` `/skip` AI-guided mode) does not
  exist yet as of this writing — challenge has not been started via the interactive AI flow.

## Related memories

- `mem:tech_stack` — languages/frameworks/versions worth knowing (not in AGENTS.md's summary form).
- `mem:suggested_commands` — where commands must run from, which ones need interactive password prompts.
- `mem:conventions` — pointer to AGENTS.md code-style section, plus what's NOT covered there.
- `mem:task_completion` — verification steps per checkpoint and before calling the challenge done.

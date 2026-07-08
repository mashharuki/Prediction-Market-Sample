# Conventions

Full code-style table (UpperCamelCase for components/types/contracts, lowerCamelCase for
vars/functions/params, CONSTANT_CASE for constants/enum values, snake_case for Hardhat deploy filenames)
and key warnings are documented in root `AGENTS.md` under "Code Style" and "Key Warnings" — read there,
not duplicated here.

## Points easy to miss (not obvious from a quick AGENTS.md skim)

- Solidity: `i_<name>` = immutable, `s_<name>` = mutable storage — this prefix convention is load-bearing
  for reading `PredictionMarket.sol`'s intended design even though the fields don't exist yet in the skeleton.
- `getPrediction()` in `PredictionMarket.sol` has its whole return-block commented out; sections must be
  uncommented specifically after Checkpoint 3 (fields up to `noTokenReserve`) and after Checkpoint 5
  (`isReported`, `winningToken`) — forgetting this leaves the frontend silently blank, no error.
- Frontend hooks: only use `useScaffoldReadContract` / `useScaffoldWriteContract` /
  `useScaffoldEventHistory` / `useScaffoldContract` from `~~/hooks/scaffold-eth` — the deprecated
  `useScaffoldContractRead`/`useScaffoldContractWrite` names do not exist in this SE-2 version.
- Import alias `~~` maps into the `packages/nextjs` package root (App Router, not Pages Router).
- LP (contract owner) is deliberately blocked from buying/selling/redeeming tokens (`notOwner` modifier) —
  always test trading flows with a second, non-owner account.

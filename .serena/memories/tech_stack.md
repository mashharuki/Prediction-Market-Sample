# Tech Stack

- Package manager: Yarn 4.13.0 (Berry, workspaces), pinned via `packageManager` field — use `yarn`, not `npm`.
  Node >=22.10.0 required (`engines` in root `challenge-prediction-markets/package.json`).
- Workspaces: `packages/hardhat` (`@se-2/hardhat`) and `packages/nextjs` (`@se-2/nextjs`).

## hardhat package

- Hardhat 3.x (`hardhat@^3.4.5`) with `rocketh` + `@rocketh/*` deploy plugins (not classic `hardhat-deploy`
  patterns even though `hardhat-deploy@^2` is also a dep) — deploy scripts under `deploy/00_*.ts`.
  One yarn patch applied: `.yarn/patches/@rocketh-deploy-npm-0.19.7-*.patch`.
- ethers v6, TypeChain (`@nomicfoundation/hardhat-typechain`), mocha/chai test runner
  (`hardhat test --network hardhat --gas-stats`).
- Solidity: OpenZeppelin Contracts v5 (`Ownable` from `@openzeppelin/contracts/access/Ownable.sol`),
  pragma `>=0.8.0 <0.9.0`.
- Deployer key handling via `@inquirer/password` (encrypted keystore) — see `scripts/generateAccount.ts`,
  `runHardhatDeployWithPK.ts`, `runVerify.ts`; all interactive.

## nextjs package

- Next.js ~16.2.4 App Router, React ~19.2.5.
- wagmi 2.19.5 / viem 2.39.0 / RainbowKit 2.2.9 for wallet + chain interaction.
- `@scaffold-ui/components`, `@scaffold-ui/debug-contracts`, `@scaffold-ui/hooks` — externalized
  scaffold-eth-2 UI/hook packages (not vendored in-repo like older SE-2 versions).
- Tailwind CSS 4.2.4 + DaisyUI 5.5.19.
- Contract ABIs auto-generated to `packages/nextjs/contracts/deployedContracts.ts` on `yarn deploy` — never
  hand-edit that file.

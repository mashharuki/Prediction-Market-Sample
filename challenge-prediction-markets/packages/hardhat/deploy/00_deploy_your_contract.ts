import { artifacts, deployScript } from "../rocketh/deploy.js";
import { parseEther } from "viem";
import * as fs from "fs";

/**
 * デプロイヤーアカウントを使って「PredictionMarket」という名前のコントラクトをデプロイする
 *
 * localhostでは、デプロイヤーアカウントはHardhatに付属しているもので、あらかじめ資金が入っている
 *
 * 本番ネットワークにデプロイする場合(例: `yarn deploy --network sepolia`)、デプロイヤーアカウントは
 * コントラクト作成のガス代を支払うのに十分な残高を持っている必要がある
 *
 * `yarn generate` でランダムなアカウントを生成するか、`yarn account:import` で既存の秘密鍵をインポートできる
 * (インポートすると .env ファイルの DEPLOYER_PRIVATE_KEY_ENCRYPTED が設定され、hardhat.config.ts で使われる)。
 * `yarn account` を実行すると、各ネットワークでのデプロイヤーの残高を確認できる。
 */
export default deployScript(
  async env => {
    const { deployer } = env.namedAccounts;

    const question = "Will the green car win the race?";
    const initialLiquidity = parseEther("1");
    const initialTokenValue = parseEther("0.01");
    const initialProbability = 50;
    const percentageLocked = 10;
    const liquidityProvider = deployer;
    const oracle = deployer;

    const predictionMarket = await env.deploy("PredictionMarket", {
      account: deployer,
      artifact: artifacts.PredictionMarket,
      args: [liquidityProvider, oracle, question, initialTokenValue, initialProbability, percentageLocked],
      value: initialLiquidity,
    });

    console.log("PredictionMarket deployed to:", predictionMarket.address);

    // デプロイされたYES・NOトークンのアドレスとABIを取得し、deploymentsディレクトリにコピーする
    try {
      const i_yesToken = (await env.read(predictionMarket, { functionName: "i_yesToken" })) as `0x${string}`;
      const i_noToken = (await env.read(predictionMarket, { functionName: "i_noToken" })) as `0x${string}`;
      const abi = artifacts.PredictionMarketToken.abi;
      const yesToken = { address: i_yesToken, abi };
      const noToken = { address: i_noToken, abi };

      const chainDir = `./deployments/${env.name}`;
      fs.writeFileSync(`${chainDir}/PredictionMarketTokenYes.json`, JSON.stringify(yesToken, null, 2));
      fs.writeFileSync(`${chainDir}/PredictionMarketTokenNo.json`, JSON.stringify(noToken, null, 2));
      console.log("Token JSON files written successfully");
    } catch (error) {
      console.error("Error handling token files:", error);
    }
  },
  // タグは、複数のデプロイファイルがあり、そのうち1つだけを実行したい場合に便利
  // 例: yarn deploy --tags PredictionMarket
  { tags: ["PredictionMarket"] },
);

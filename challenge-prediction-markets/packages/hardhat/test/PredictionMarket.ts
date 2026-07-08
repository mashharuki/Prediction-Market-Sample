import { expect } from "chai";
import { network } from "hardhat";
import type { PredictionMarket, PredictionMarket__factory } from "../types/ethers-contracts/index.js";

describe("📈📉🏎️ Prediction Markets Challenge", function () {
  // すべてのテストで同じセットアップを再利用するためにフィクスチャを定義する。

  let ethers: Awaited<ReturnType<typeof network.create>>["ethers"];
  let predictionMarket: PredictionMarket;
  let owner: any;
  let oracle: any;

  let contractArtifact = "";
  if (process.env.CONTRACT_ADDRESS) {
    contractArtifact = `contracts/download-${process.env.CONTRACT_ADDRESS}.sol:PredictionMarket`;
  } else {
    // 短い名前を使うことで、hardhat-ethersがPredictionMarket__factory(型付きメソッド)を返すようにする
    contractArtifact = "PredictionMarket";
  }

  async function getPredictionMarketFactory(): Promise<PredictionMarket__factory> {
    return (await ethers.getContractFactory(contractArtifact)) as PredictionMarket__factory;
  }

  before(async () => {
    ({ ethers } = await network.create());
    [owner, oracle] = await ethers.getSigners();
    const predictionMarketFactory = await getPredictionMarketFactory();
    predictionMarket = await predictionMarketFactory.deploy(
      owner.address,
      oracle.address,
      "Test Question",
      ethers.parseEther("1"),
      50,
      20,
      { value: ethers.parseEther("10") },
    );
    await predictionMarket.waitForDeployment();
  });

  describe("Checkpoint2", function () {
    it("Should revert when no ETH is provided for initial liquidity", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();

      await expect(
        predictionMarketFactory.deploy(
          owner.address,
          oracle.address,
          "Test Question",
          ethers.parseEther("1"),
          50,
          20,
          { value: 0 }, // No ETH provided
        ),
      ).to.be.revertedWithCustomError(predictionMarketFactory, "PredictionMarket__MustProvideETHForInitialLiquidity");
    });

    it("Should revert when initialYesProbability is 0 or >= 100", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();

      // テストケース1: initialYesProbability = 0
      await expect(
        predictionMarketFactory.deploy(
          owner.address,
          oracle.address,
          "Test Question",
          ethers.parseEther("1"),
          0, // Invalid probability (0)
          20,
          { value: ethers.parseEther("10") },
        ),
      ).to.be.revertedWithCustomError(predictionMarketFactory, "PredictionMarket__InvalidProbability");

      // テストケース2: initialYesProbability = 100
      await expect(
        predictionMarketFactory.deploy(
          owner.address,
          oracle.address,
          "Test Question",
          ethers.parseEther("1"),
          100, // Invalid probability (>= 100)
          20,
          { value: ethers.parseEther("10") },
        ),
      ).to.be.revertedWithCustomError(predictionMarketFactory, "PredictionMarket__InvalidProbability");
    });

    it("Should revert when percentageToLock is >= 100 or 0", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();

      // テストケース1: percentageToLock = 0
      await expect(
        predictionMarketFactory.deploy(
          owner.address,
          oracle.address,
          "Test Question",
          ethers.parseEther("1"),
          50,
          0, // Invalid percentage (0)
          { value: ethers.parseEther("10") },
        ),
      ).to.be.revertedWithCustomError(predictionMarketFactory, "PredictionMarket__InvalidPercentageToLock");

      // テストケース2: percentageToLock = 100
      await expect(
        predictionMarketFactory.deploy(
          owner.address,
          oracle.address,
          "Test Question",
          ethers.parseEther("1"),
          50,
          100, // Invalid percentage (>= 100)
          { value: ethers.parseEther("10") },
        ),
      ).to.be.revertedWithCustomError(predictionMarketFactory, "PredictionMarket__InvalidPercentageToLock");
    });
    it("Should set the correct state variables on deployment", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const question = "Will the green car win the race?";
      const initialTokenValue = ethers.parseEther("0.01");
      const initialYesProbability = 60;
      const percentageToLock = 10;
      const initialLiquidity = ethers.parseEther("1");

      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        question,
        initialTokenValue,
        initialYesProbability,
        percentageToLock,
        { value: initialLiquidity },
      );
      await predictionMarket.waitForDeployment();

      // すべての状態変数が正しく設定されていることを検証する
      expect(await predictionMarket.i_oracle()).to.equal(oracle.address);
      expect(await predictionMarket.s_question()).to.equal(question);
      expect(await predictionMarket.i_initialTokenValue()).to.equal(initialTokenValue);
      expect(await predictionMarket.i_initialYesProbability()).to.equal(initialYesProbability);
      expect(await predictionMarket.i_percentageLocked()).to.equal(percentageToLock);
      expect(await predictionMarket.s_ethCollateral()).to.equal(initialLiquidity);
    });
  });

  describe("Checkpoint3", function () {
    it("Should correctly calculate initial token amounts", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const question = "Will the green car win the race?";
      const initialTokenValue = ethers.parseEther("0.01");
      const initialYesProbability = 60;
      const percentageToLock = 10;
      const initialLiquidity = ethers.parseEther("1");

      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        question,
        initialTokenValue,
        initialYesProbability,
        percentageToLock,
        { value: initialLiquidity },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const noTokenAddress = await predictionMarket.i_noToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);
      const noToken = await ethers.getContractAt("PredictionMarketToken", noTokenAddress);

      // 期待値を計算する
      const PRECISION = BigInt(1e18); // 1e18 precision
      const initialTokenAmount = (initialLiquidity * PRECISION) / initialTokenValue; // 10 tokens

      // トークンの量を検証する
      expect(await yesToken.totalSupply()).to.equal(initialTokenAmount);
      expect(await noToken.totalSupply()).to.equal(initialTokenAmount);
    });

    it("Should correctly transfer locked tokens to deployer", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const question = "Will the green car win the race?";
      const initialTokenValue = ethers.parseEther("0.01");
      const initialYesProbability = 60;
      const percentageToLock = 10;
      const initialLiquidity = ethers.parseEther("1");

      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        question,
        initialTokenValue,
        initialYesProbability,
        percentageToLock,
        { value: initialLiquidity },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const noTokenAddress = await predictionMarket.i_noToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);
      const noToken = await ethers.getContractAt("PredictionMarketToken", noTokenAddress);

      // 期待値を計算する
      const PRECISION = BigInt(1e18); // 1e18 precision
      const initialTokenAmount = (initialLiquidity * PRECISION) / initialTokenValue; // 10 tokens
      const initialYesAmountLocked =
        (initialTokenAmount * BigInt(initialYesProbability) * BigInt(percentageToLock) * BigInt(2)) / BigInt(10000);
      const initialNoAmountLocked =
        (initialTokenAmount * BigInt(100 - initialYesProbability) * BigInt(percentageToLock) * BigInt(2)) /
        BigInt(10000);

      // ロックされたトークンがデプロイヤーに送金されたことを検証する
      expect(await yesToken.balanceOf(owner.address)).to.equal(initialYesAmountLocked);
      expect(await noToken.balanceOf(owner.address)).to.equal(initialNoAmountLocked);
    });
  });

  describe("Checkpoint4", function () {
    it("Should successfully add liquidity, mint tokens and update state variables", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();
      const initialEthCollateral = await predictionMarket.s_ethCollateral();
      const liquidityToAdd = ethers.parseEther("5");
      const expectedTokenAmount = (liquidityToAdd * BigInt(1e18)) / ethers.parseEther("1");
      // 初期トークン残高を取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const noTokenAddress = await predictionMarket.i_noToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);
      const noToken = await ethers.getContractAt("PredictionMarketToken", noTokenAddress);
      const initialYesTokenBalance = await yesToken.balanceOf(predictionMarket.getAddress());
      const initialNoTokenBalance = await noToken.balanceOf(predictionMarket.getAddress());
      // 流動性を追加する
      await predictionMarket.connect(owner).addLiquidity({ value: liquidityToAdd });
      // 状態の変化を検証する
      expect(await predictionMarket.s_ethCollateral()).to.equal(initialEthCollateral + liquidityToAdd);
      expect(await yesToken.balanceOf(predictionMarket.getAddress())).to.equal(
        initialYesTokenBalance + expectedTokenAmount,
      );
      expect(await noToken.balanceOf(predictionMarket.getAddress())).to.equal(
        initialNoTokenBalance + expectedTokenAmount,
      );
    });

    it("Should revert when trying to remove more tokens than available", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 最初に提供した量より多くのETHの削除を試みる
      const ethToRemove = ethers.parseEther("11"); // Try to remove 11 ETH when we only have 10 ETH worth of tokens

      // 利用可能な量より多くのトークンで流動性の削除を試みる
      await expect(predictionMarket.connect(owner).removeLiquidity(ethToRemove)).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__InsufficientTokenReserve",
      );
    });
    it("Should successfully remove liquidity, burn tokens and update state variables", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();
      const initialEthCollateral = await predictionMarket.s_ethCollateral();
      const ethToRemove = ethers.parseEther("5");
      const expectedTokenAmount = (ethToRemove * BigInt(1e18)) / ethers.parseEther("1");
      // 初期トークン残高を取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const noTokenAddress = await predictionMarket.i_noToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);
      const noToken = await ethers.getContractAt("PredictionMarketToken", noTokenAddress);
      const initialYesTokenBalance = await yesToken.balanceOf(predictionMarket.getAddress());
      const initialNoTokenBalance = await noToken.balanceOf(predictionMarket.getAddress());
      // 流動性を削除する
      await predictionMarket.connect(owner).removeLiquidity(ethToRemove);
      // 状態の変化を検証する
      expect(await predictionMarket.s_ethCollateral()).to.equal(initialEthCollateral - ethToRemove);
      expect(await yesToken.balanceOf(predictionMarket.getAddress())).to.equal(
        initialYesTokenBalance - expectedTokenAmount,
      );
      expect(await noToken.balanceOf(predictionMarket.getAddress())).to.equal(
        initialNoTokenBalance - expectedTokenAmount,
      );
    });

    it("Should emit correct events when adding and removing liquidity", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // LiquidityAddedイベントをテストする
      const liquidityToAdd = ethers.parseEther("5");
      const expectedTokenAmount = (liquidityToAdd * BigInt(1e18)) / ethers.parseEther("1");

      // 流動性を追加し、イベントを期待する
      await expect(predictionMarket.connect(owner).addLiquidity({ value: liquidityToAdd }))
        .to.emit(predictionMarket, "LiquidityAdded")
        .withArgs(owner.address, liquidityToAdd, expectedTokenAmount);

      // LiquidityRemovedイベントをテストする
      const ethToRemove = ethers.parseEther("3");
      const expectedTokenAmountToRemove = (ethToRemove * BigInt(1e18)) / ethers.parseEther("1");

      // 流動性を削除し、イベントを期待する
      await expect(predictionMarket.connect(owner).removeLiquidity(ethToRemove))
        .to.emit(predictionMarket, "LiquidityRemoved")
        .withArgs(owner.address, ethToRemove, expectedTokenAmountToRemove);
    });
  });

  describe("Checkpoint5", function () {
    it("Should revert when trying to add liquidity after prediction is reported", async function () {
      // まず予測結果を報告する
      await predictionMarket.connect(oracle).report(0); // Report YES as winning option

      // 予測結果が報告された後に流動性の追加を試みる
      await expect(
        predictionMarket.connect(owner).addLiquidity({ value: ethers.parseEther("1") }),
      ).to.be.revertedWithCustomError(predictionMarket, "PredictionMarket__PredictionAlreadyReported");
    });

    it("Should revert when trying to remove liquidity after prediction is reported", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // まず予測結果を報告する
      await predictionMarket.connect(oracle).report(0); // Report YES as winning option

      // 予測結果が報告された後に流動性の削除を試みる
      await expect(
        predictionMarket.connect(owner).removeLiquidity(ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(predictionMarket, "PredictionMarket__PredictionAlreadyReported");
    });

    it("Should revert when trying to report after prediction is reported", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // まず予測結果を報告する
      await predictionMarket.connect(oracle).report(0); // Report YES as winning option

      // 再度報告を試みる
      await expect(predictionMarket.connect(oracle).report(0)).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__PredictionAlreadyReported",
      );
    });

    it("Should revert when trying to report when not called by the s_oracle", async function () {
      const [owner, oracle, nonOracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // オラクル以外のアカウントからの報告を試みる
      await expect(predictionMarket.connect(nonOracle).report(0)).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__OnlyOracleCanReport",
      );
    });

    it("Should correctly set winning token and isReported flag when reporting", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 報告前にトークンアドレスを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();

      // 初期状態ではisReportedはfalseのはず
      expect(await predictionMarket.s_isReported()).to.equal(false);

      // YESの結果を報告する
      await predictionMarket.connect(oracle).report(0);

      // isReportedがtrueに設定されていることを検証する
      expect(await predictionMarket.s_isReported()).to.equal(true);

      // 勝ちトークンがYESトークンに設定されていることを検証する
      expect(await predictionMarket.s_winningToken()).to.equal(yesTokenAddress);

      // NOの結果をテストするために新しいインスタンスをデプロイする
      const predictionMarket2 = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question 2",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket2.waitForDeployment();

      // 2つ目のインスタンスのトークンアドレスを取得する
      const noTokenAddress2 = await predictionMarket2.i_noToken();

      // 初期状態ではisReportedはfalseのはず
      expect(await predictionMarket2.s_isReported()).to.equal(false);

      // NOの結果を報告する
      await predictionMarket2.connect(oracle).report(1);

      // isReportedがtrueに設定されていることを検証する
      expect(await predictionMarket2.s_isReported()).to.equal(true);

      // 勝ちトークンがNOトークンに設定されていることを検証する
      expect(await predictionMarket2.s_winningToken()).to.equal(noTokenAddress2);
    });

    it("Should emit correct MarketReported event when reporting", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 報告前にトークンアドレスを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();

      // YESの結果を報告し、イベントを期待する
      await expect(predictionMarket.connect(oracle).report(0))
        .to.emit(predictionMarket, "MarketReported")
        .withArgs(oracle.address, 0, yesTokenAddress); // 0 represents YES outcome

      // NOの結果をテストするために新しいインスタンスをデプロイする
      const predictionMarket2 = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question 2",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket2.waitForDeployment();

      // 2つ目のインスタンスのトークンアドレスを取得する
      const noTokenAddress2 = await predictionMarket2.i_noToken();

      // NOの結果を報告し、イベントを期待する
      await expect(predictionMarket2.connect(oracle).report(1))
        .to.emit(predictionMarket2, "MarketReported")
        .withArgs(oracle.address, 1, noTokenAddress2); // 1 represents NO outcome
    });
  });

  describe("Checkpoint6", function () {
    it("Should revert when trying to resolve before prediction is reported", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 報告前に解決を試みる
      await expect(predictionMarket.connect(owner).resolveMarketAndWithdraw()).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__PredictionNotReported",
      );
    });

    it("Should correctly resolve market and withdraw ETH", async function () {
      const [owner, oracle, nonOwner] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 初期残高を取得する
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const initialContractBalance = await ethers.provider.getBalance(predictionMarket.getAddress());

      // 予測結果を報告する
      await predictionMarket.connect(oracle).report(0); // Report YES as winning option

      // 勝ちトークンのコントラクトと初期値を取得する
      const winningTokenAddress = await predictionMarket.s_winningToken();
      const winningToken = await ethers.getContractAt("PredictionMarketToken", winningTokenAddress);
      const initialWinningTokens = await winningToken.balanceOf(predictionMarket.getAddress());
      const initialLpTradingRevenue = await predictionMarket.s_lpTradingRevenue();

      // 解決前に期待される量を計算する
      const expectedEthAmount = (initialWinningTokens * ethers.parseEther("1")) / BigInt(1e18);
      const expectedTotalEthToSend = expectedEthAmount + initialLpTradingRevenue;

      // オーナー以外のアカウントからの解決を試みる(失敗するはず)
      await expect(predictionMarket.connect(nonOwner).resolveMarketAndWithdraw()).to.be.revertedWithCustomError(
        predictionMarket,
        "OwnableUnauthorizedAccount",
      );

      // マーケットを解決する
      const tx = await predictionMarket.connect(owner).resolveMarketAndWithdraw();
      const receipt = await tx.wait();

      // 最終残高を取得する
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      const finalContractBalance = await ethers.provider.getBalance(predictionMarket.getAddress());
      const finalWinningTokens = await winningToken.balanceOf(predictionMarket.getAddress());

      // 状態の変化を検証する
      const expectedWinningTokens = BigInt(0);
      expect(finalWinningTokens).to.equal(expectedWinningTokens); // All winning tokens should be burned

      // 残高計算でガス代を考慮する
      const gasUsed = receipt?.gasUsed || BigInt(0);
      const gasPrice = tx.gasPrice || BigInt(0);
      const gasCost = gasUsed * gasPrice;
      const actualEthReceived = finalOwnerBalance - initialOwnerBalance + gasCost;

      // 正確な金額が送金されたことを検証する
      expect(actualEthReceived).to.equal(expectedTotalEthToSend);
      expect(finalContractBalance).to.equal(initialContractBalance - expectedTotalEthToSend);

      // イベントの発行を検証する
      const marketResolvedEvent = receipt?.logs.find(log => {
        try {
          return predictionMarket.interface.parseLog({ topics: log.topics, data: log.data })?.name === "MarketResolved";
        } catch {
          return false;
        }
      });
      const expectedEvent = marketResolvedEvent !== undefined;
      expect(expectedEvent).to.equal(true);
    });

    it("Should send exact totalEthToSend amount to msg.sender", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 初期残高を取得する
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const initialContractBalance = await ethers.provider.getBalance(predictionMarket.getAddress());
      const initialLpTradingRevenue = await predictionMarket.s_lpTradingRevenue();

      // 予測結果を報告する
      await predictionMarket.connect(oracle).report(0); // Report YES as winning option

      // 勝ちトークンのコントラクトと残高を取得する
      const winningTokenAddress = await predictionMarket.s_winningToken();
      const winningToken = await ethers.getContractAt("PredictionMarketToken", winningTokenAddress);
      const contractWinningTokens = await winningToken.balanceOf(predictionMarket.getAddress());

      // 勝ちトークンから期待されるETH量を計算する
      const ethFromWinningTokens = (contractWinningTokens * ethers.parseEther("1")) / BigInt(1e18);

      // 送金されるはずの合計ETHを計算する
      const expectedTotalEthToSend = ethFromWinningTokens + initialLpTradingRevenue;

      // マーケットを解決し、トランザクションを取得する
      const tx = await predictionMarket.connect(owner).resolveMarketAndWithdraw();
      const receipt = await tx.wait();

      // 最終残高を取得する
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      const finalContractBalance = await ethers.provider.getBalance(predictionMarket.getAddress());

      // 実際に送金されたETHを計算する(ガス代を考慮)
      const gasUsed = receipt?.gasUsed || BigInt(0);
      const gasPrice = tx.gasPrice || BigInt(0);
      const gasCost = gasUsed * gasPrice;
      const actualEthReceived = finalOwnerBalance - initialOwnerBalance + gasCost;

      // 正確な金額が送金されたことを検証する
      expect(actualEthReceived).to.equal(expectedTotalEthToSend);
      expect(finalContractBalance).to.equal(initialContractBalance - expectedTotalEthToSend);
    });
  });

  describe("Checkpoint7", function () {
    it("Should correctly calculate buy price in ETH", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const noTokenAddress = await predictionMarket.i_noToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);
      const noToken = await ethers.getContractAt("PredictionMarketToken", noTokenAddress);

      // 期待値を計算する
      const PRECISION = BigInt(1e18);
      const initialTokenAmount = (ethers.parseEther("10") * PRECISION) / ethers.parseEther("1");
      const tradingAmount = initialTokenAmount / BigInt(10); // Buy 10% of total supply

      // YESトークンの購入価格を取得する
      const buyPrice = await predictionMarket.getBuyPriceInEth(0, tradingAmount);

      // 価格計算を検証する
      const currentTokenSoldBefore = initialTokenAmount - (await yesToken.balanceOf(predictionMarket.getAddress()));
      const currentOtherTokenSold = initialTokenAmount - (await noToken.balanceOf(predictionMarket.getAddress()));
      const totalTokensSoldBefore = currentTokenSoldBefore + currentOtherTokenSold;
      const probabilityBefore = (currentTokenSoldBefore * PRECISION) / totalTokensSoldBefore;

      const currentTokenReserveAfter = (await yesToken.balanceOf(predictionMarket.getAddress())) - tradingAmount;
      const currentTokenSoldAfter = initialTokenAmount - currentTokenReserveAfter;
      const totalTokensSoldAfter = totalTokensSoldBefore + tradingAmount;
      const probabilityAfter = (currentTokenSoldAfter * PRECISION) / totalTokensSoldAfter;

      const probabilityAvg = (probabilityBefore + probabilityAfter) / BigInt(2);
      const expectedPrice = (ethers.parseEther("1") * probabilityAvg * tradingAmount) / (PRECISION * PRECISION);

      expect(buyPrice).to.equal(expectedPrice);
    });

    it("Should correctly calculate sell price in ETH", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const noTokenAddress = await predictionMarket.i_noToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);
      const noToken = await ethers.getContractAt("PredictionMarketToken", noTokenAddress);

      // 期待値を計算する
      const PRECISION = BigInt(1e18);
      const initialTokenAmount = (ethers.parseEther("10") * PRECISION) / ethers.parseEther("1");
      const tradingAmount = initialTokenAmount / BigInt(10); // Sell 10% of total supply

      // YESトークンの売却価格を取得する
      const sellPrice = await predictionMarket.getSellPriceInEth(0, tradingAmount);

      // 価格計算を検証する
      const currentTokenSoldBefore = initialTokenAmount - (await yesToken.balanceOf(predictionMarket.getAddress()));
      const currentOtherTokenSold = initialTokenAmount - (await noToken.balanceOf(predictionMarket.getAddress()));
      const totalTokensSoldBefore = currentTokenSoldBefore + currentOtherTokenSold;
      const probabilityBefore = (currentTokenSoldBefore * PRECISION) / totalTokensSoldBefore;

      const currentTokenReserveAfter = (await yesToken.balanceOf(predictionMarket.getAddress())) + tradingAmount;
      const currentTokenSoldAfter = initialTokenAmount - currentTokenReserveAfter;
      const totalTokensSoldAfter = totalTokensSoldBefore - tradingAmount;
      const probabilityAfter = (currentTokenSoldAfter * PRECISION) / totalTokensSoldAfter;

      const probabilityAvg = (probabilityBefore + probabilityAfter) / BigInt(2);
      const expectedPrice = (ethers.parseEther("1") * probabilityAvg * tradingAmount) / (PRECISION * PRECISION);

      expect(sellPrice).to.equal(expectedPrice);
    });

    it("Should revert when trying to buy more tokens than available in reserve", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // リザーブにある量より多くのトークンの購入を試みる
      const reserveAmount = await yesToken.balanceOf(predictionMarket.getAddress());
      const tooManyTokens = reserveAmount + BigInt(1);

      await expect(predictionMarket.getBuyPriceInEth(0, tooManyTokens)).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__InsufficientLiquidity",
      );
    });

    it("Should correctly calculate probability for different token amounts", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const noTokenAddress = await predictionMarket.i_noToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);
      const noToken = await ethers.getContractAt("PredictionMarketToken", noTokenAddress);

      // 期待値を計算する
      const PRECISION = BigInt(1e18);
      const initialTokenAmount = (ethers.parseEther("10") * PRECISION) / ethers.parseEther("1");

      // 様々なシナリオをテストする
      const scenarios = [
        { liquidityToAdd: ethers.parseEther("10"), expectedProbability: PRECISION / BigInt(2) }, // 50% YES (initial state)
        { liquidityToAdd: ethers.parseEther("20"), expectedProbability: PRECISION / BigInt(2) }, // Still 50% YES
      ];

      for (const scenario of scenarios) {
        // トークン残高を作るために流動性を追加する
        await predictionMarket.connect(owner).addLiquidity({ value: scenario.liquidityToAdd });

        // 確率を計算する
        const currentTokenSold = initialTokenAmount - (await yesToken.balanceOf(predictionMarket.getAddress()));
        const totalTokensSold =
          initialTokenAmount -
          (await yesToken.balanceOf(predictionMarket.getAddress())) +
          (initialTokenAmount - (await noToken.balanceOf(predictionMarket.getAddress())));
        const probability = (currentTokenSold * PRECISION) / totalTokensSold;

        expect(probability).to.equal(scenario.expectedProbability);
      }
    });

    it("Should correctly get current reserves for both YES and NO outcomes", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const noTokenAddress = await predictionMarket.i_noToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);
      const noToken = await ethers.getContractAt("PredictionMarketToken", noTokenAddress);

      // 初期リザーブを取得する
      const initialYesReserve = await yesToken.balanceOf(predictionMarket.getAddress());
      const initialNoReserve = await noToken.balanceOf(predictionMarket.getAddress());

      // YESの結果の価格計算を通じてリザーブをテストする
      const smallAmount = BigInt(1e15); // Small amount to minimize price impact
      const yesPrice = await predictionMarket.getBuyPriceInEth(0, smallAmount);
      expect(yesPrice).to.be.gt(0); // Price should be calculated correctly

      // NOの結果の価格計算を通じてリザーブをテストする
      const noPrice = await predictionMarket.getBuyPriceInEth(1, smallAmount);
      expect(noPrice).to.be.gt(0); // Price should be calculated correctly

      // リザーブを変化させるために流動性を追加する
      await predictionMarket.connect(owner).addLiquidity({ value: ethers.parseEther("5") });

      // 新しいリザーブを取得する
      const newYesReserve = await yesToken.balanceOf(predictionMarket.getAddress());
      const newNoReserve = await noToken.balanceOf(predictionMarket.getAddress());

      // リザーブが均等に増加したことを検証する
      expect(newYesReserve).to.be.gt(initialYesReserve);
      expect(newNoReserve).to.be.gt(initialNoReserve);
      expect(newYesReserve).to.equal(newNoReserve);

      // 価格計算を通じて再度リザーブをテストする
      const yesPriceAfter = await predictionMarket.getBuyPriceInEth(0, smallAmount);
      const noPriceAfter = await predictionMarket.getBuyPriceInEth(1, smallAmount);

      // 新しいリザーブでも価格が正しく計算されているはず
      expect(yesPriceAfter).to.be.gt(0);
      expect(noPriceAfter).to.be.gt(0);
    });

    it("Should correctly calculate probability with edge cases", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 期待値を計算する
      const PRECISION = BigInt(1e18);
      const initialTokenAmount = (ethers.parseEther("10") * PRECISION) / ethers.parseEther("1");

      // 確率計算の様々なシナリオをテストする
      const scenarios = [
        // 売却されたトークンがごく少量(ほぼ全てがリザーブにある状態)
        {
          yesTokensSold: BigInt(1),
          totalTokensSold: BigInt(2),
          expectedProbability: PRECISION / BigInt(2), // 50%
        },
        // ほぼ全てのトークンが売却された状態(リザーブが極めて少ない)
        {
          yesTokensSold: initialTokenAmount - BigInt(1),
          totalTokensSold: initialTokenAmount * BigInt(2) - BigInt(2),
          expectedProbability: PRECISION / BigInt(2), // 50%
        },
        // 偏った分布(YESトークンがより多く売却されている)
        {
          yesTokensSold: initialTokenAmount / BigInt(2),
          totalTokensSold: initialTokenAmount,
          expectedProbability: PRECISION / BigInt(2), // 50%
        },
        // 偏った分布(NOトークンがより多く売却されている)
        {
          yesTokensSold: initialTokenAmount / BigInt(4),
          totalTokensSold: initialTokenAmount,
          expectedProbability: PRECISION / BigInt(4), // 25%
        },
      ];

      for (const scenario of scenarios) {
        // コントラクトの計算式を使って確率を計算する
        const probability = (scenario.yesTokensSold * PRECISION) / scenario.totalTokensSold;

        // 確率計算を検証する
        expect(probability).to.equal(scenario.expectedProbability);

        // 確率が有効な範囲(0から1)内にあることを検証する
        expect(probability).to.be.gte(BigInt(0));
        expect(probability).to.be.lte(PRECISION);
      }
    });
  });

  describe("Checkpoint8", function () {
    it("Should revert when trying to buy tokens with zero amount", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 量が0でトークンの購入を試みる
      await expect(
        predictionMarket.connect(owner).buyTokensWithETH(0, 0, { value: ethers.parseEther("1") }),
      ).to.be.revertedWithCustomError(predictionMarket, "PredictionMarket__AmountMustBeGreaterThanZero");
    });

    it("Should revert when trying to sell tokens with zero amount", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 量が0でトークンの売却を試みる
      await expect(predictionMarket.connect(owner).sellTokensForEth(0, 0)).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__AmountMustBeGreaterThanZero",
      );
    });

    it("Should revert when trying to buy tokens with incorrect ETH amount", async function () {
      const [owner, oracle, buyer] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // 購入する量を計算する
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);

      // 誤ったETH量で購入を試みる
      await expect(
        predictionMarket.connect(buyer).buyTokensWithETH(0, amountToBuy, { value: requiredEth + BigInt(1) }),
      ).to.be.revertedWithCustomError(predictionMarket, "PredictionMarket__MustSendExactETHAmount");
    });

    it("Should successfully buy tokens with ETH", async function () {
      const [owner, oracle, buyer] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // 購入する量を計算する
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);

      // 初期残高を取得する
      const initialBuyerBalance = await yesToken.balanceOf(buyer.address);
      const initialContractBalance = await ethers.provider.getBalance(predictionMarket.getAddress());

      // トークンを購入する
      await predictionMarket.connect(buyer).buyTokensWithETH(0, amountToBuy, { value: requiredEth });

      // 最終残高を取得する
      const finalBuyerBalance = await yesToken.balanceOf(buyer.address);
      const finalContractBalance = await ethers.provider.getBalance(predictionMarket.getAddress());

      // トークンの送金を検証する
      expect(finalBuyerBalance).to.equal(initialBuyerBalance + amountToBuy);
      expect(finalContractBalance).to.equal(initialContractBalance + requiredEth);
    });

    it("Should successfully sell tokens for ETH", async function () {
      const [owner, oracle, seller] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // まずトークンを購入する
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);
      await predictionMarket.connect(seller).buyTokensWithETH(0, amountToBuy, { value: requiredEth });

      // 売却のためにトークンを承認する
      await yesToken.connect(seller).approve(predictionMarket.getAddress(), amountToBuy);

      // 初期残高を取得する
      const initialSellerBalance = await ethers.provider.getBalance(seller.address);
      const initialContractBalance = await ethers.provider.getBalance(predictionMarket.getAddress());
      const initialSellerTokens = await yesToken.balanceOf(seller.address);

      // 受け取るETHを計算する
      const ethToReceive = await predictionMarket.getSellPriceInEth(0, amountToBuy);

      // トークンを売却する
      const tx = await predictionMarket.connect(seller).sellTokensForEth(0, amountToBuy);
      const receipt = await tx.wait();

      // 最終残高を取得する
      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      const finalContractBalance = await ethers.provider.getBalance(predictionMarket.getAddress());
      const finalSellerTokens = await yesToken.balanceOf(seller.address);

      // 実際に受け取ったETHを計算する(ガス代を考慮)
      const gasUsed = receipt?.gasUsed || BigInt(0);
      const gasPrice = tx.gasPrice || BigInt(0);
      const gasCost = gasUsed * gasPrice;
      const actualEthReceived = finalSellerBalance - initialSellerBalance + gasCost;

      // トークンの送金と受け取ったETHを検証する
      expect(finalSellerTokens).to.equal(initialSellerTokens - amountToBuy);
      expect(actualEthReceived).to.equal(ethToReceive);
      expect(finalContractBalance).to.equal(initialContractBalance - ethToReceive);
    });

    it("Should revert when trying to sell more tokens than owned", async function () {
      const [owner, oracle, seller] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // まずトークンを購入する
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);
      await predictionMarket.connect(seller).buyTokensWithETH(0, amountToBuy, { value: requiredEth });

      // 売却のためにトークンを承認する
      await yesToken.connect(seller).approve(predictionMarket.getAddress(), amountToBuy);

      // 保有量より多くのトークンの売却を試みる
      const tooManyTokens = amountToBuy + BigInt(1);
      await expect(predictionMarket.connect(seller).sellTokensForEth(0, tooManyTokens)).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__InsufficientBalance",
      );
    });

    it("Should revert when trying to sell tokens without approval", async function () {
      const [owner, oracle, seller] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // まずトークンを購入する
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);
      await predictionMarket.connect(seller).buyTokensWithETH(0, amountToBuy, { value: requiredEth });

      // 承認なしでトークンの売却を試みる
      await expect(predictionMarket.connect(seller).sellTokensForEth(0, amountToBuy)).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__InsufficientAllowance",
      );
    });

    it("Should emit correct events when buying and selling tokens", async function () {
      const [owner, oracle, trader] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // 購入する量を計算する
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);

      // トークンを購入し、イベントを期待する
      await expect(predictionMarket.connect(trader).buyTokensWithETH(0, amountToBuy, { value: requiredEth }))
        .to.emit(predictionMarket, "TokensPurchased")
        .withArgs(trader.address, 0, amountToBuy, requiredEth);

      // 売却のためにトークンを承認する
      await yesToken.connect(trader).approve(predictionMarket.getAddress(), amountToBuy);

      // 受け取るETHを計算する
      const ethToReceive = await predictionMarket.getSellPriceInEth(0, amountToBuy);

      // トークンを売却し、イベントを期待する
      await expect(predictionMarket.connect(trader).sellTokensForEth(0, amountToBuy))
        .to.emit(predictionMarket, "TokensSold")
        .withArgs(trader.address, 0, amountToBuy, ethToReceive);
    });

    it("Should revert when trying to buy tokens after prediction is reported", async function () {
      const [owner, oracle, buyer] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // 購入する量を計算する
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);

      // 予測結果を報告する
      await predictionMarket.connect(oracle).report(0);

      // 予測結果が報告された後にトークンの購入を試みる
      await expect(
        predictionMarket.connect(buyer).buyTokensWithETH(0, amountToBuy, { value: requiredEth }),
      ).to.be.revertedWithCustomError(predictionMarket, "PredictionMarket__PredictionAlreadyReported");
    });

    it("Should revert when trying to sell tokens after prediction is reported", async function () {
      const [owner, oracle, seller] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // まずトークンを購入する
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);
      await predictionMarket.connect(seller).buyTokensWithETH(0, amountToBuy, { value: requiredEth });

      // 売却のためにトークンを承認する
      await yesToken.connect(seller).approve(predictionMarket.getAddress(), amountToBuy);

      // 予測結果を報告する
      await predictionMarket.connect(oracle).report(0);

      // 予測結果が報告された後にトークンの売却を試みる
      await expect(predictionMarket.connect(seller).sellTokensForEth(0, amountToBuy)).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__PredictionAlreadyReported",
      );
    });

    it("Owner cannot buy or sell tokens", async function () {
      const [owner] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        owner.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);

      // オーナーがトークンの購入を試みる
      await expect(
        predictionMarket.connect(owner).buyTokensWithETH(0, amountToBuy, { value: requiredEth }),
      ).to.be.revertedWithCustomError(predictionMarket, "PredictionMarket__OwnerCannotCall");

      // オーナーがトークンの売却を試みる(オーナーがトークンを持っていなくても、オーナーチェックでrevertするはず)
      await expect(predictionMarket.connect(owner).sellTokensForEth(0, amountToBuy)).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__OwnerCannotCall",
      );
    });
  });

  describe("Checkpoint9", function () {
    it("Should revert when trying to redeem before prediction is reported", async function () {
      const [owner, oracle, redeemer] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 予測結果が報告される前に償還を試みる
      await expect(
        predictionMarket.connect(redeemer).redeemWinningTokens(ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(predictionMarket, "PredictionMarket__PredictionNotReported");
    });

    it("Should revert when trying to redeem more tokens than owned", async function () {
      const [owner, oracle, redeemer] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 予測結果を報告する
      await predictionMarket.connect(oracle).report(0); // Report YES as winning outcome

      // 保有量より多くのトークンの償還を試みる
      await expect(
        predictionMarket.connect(redeemer).redeemWinningTokens(ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(predictionMarket, "PredictionMarket__InsufficientWinningTokens");
    });

    it("Should revert when trying to redeem zero tokens", async function () {
      const [owner, oracle, redeemer] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // 予測結果を報告する
      await predictionMarket.connect(oracle).report(0);

      // 0トークンの償還を試みる
      await expect(predictionMarket.connect(redeemer).redeemWinningTokens(0)).to.be.revertedWithCustomError(
        predictionMarket,
        "PredictionMarket__AmountMustBeGreaterThanZero",
      );
    });

    it("Should successfully redeem winning tokens and receive ETH", async function () {
      const [owner, oracle, redeemer] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // まずYESトークンを購入する
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);
      await predictionMarket.connect(redeemer).buyTokensWithETH(0, amountToBuy, { value: requiredEth });

      // YESを勝ちの結果として報告する
      await predictionMarket.connect(oracle).report(0);

      // 初期残高を取得する
      const initialRedeemerBalance = await ethers.provider.getBalance(redeemer.address);
      const initialContractBalance = await ethers.provider.getBalance(predictionMarket.getAddress());
      const initialRedeemerTokens = await yesToken.balanceOf(redeemer.address);

      // 受け取るはずのETHを計算する
      const expectedEthToReceive = (amountToBuy * ethers.parseEther("1")) / BigInt(1e18);

      // トークンを償還する
      const tx = await predictionMarket.connect(redeemer).redeemWinningTokens(amountToBuy);
      const receipt = await tx.wait();

      // 最終残高を取得する
      const finalRedeemerBalance = await ethers.provider.getBalance(redeemer.address);
      const finalContractBalance = await ethers.provider.getBalance(predictionMarket.getAddress());
      const finalRedeemerTokens = await yesToken.balanceOf(redeemer.address);

      // 実際に受け取ったETHを計算する(ガス代を考慮)
      const gasUsed = receipt?.gasUsed || BigInt(0);
      const gasPrice = tx.gasPrice || BigInt(0);
      const gasCost = gasUsed * gasPrice;
      const actualEthReceived = finalRedeemerBalance - initialRedeemerBalance + gasCost;

      // トークンのバーンとETHの送金を検証する
      expect(finalRedeemerTokens).to.equal(initialRedeemerTokens - amountToBuy);
      expect(actualEthReceived).to.equal(expectedEthToReceive);
      expect(finalContractBalance).to.equal(initialContractBalance - expectedEthToReceive);
    });

    it("Should emit correct WinningTokensRedeemed event", async function () {
      const [owner, oracle, redeemer] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // トークンコントラクトを取得する
      const yesTokenAddress = await predictionMarket.i_yesToken();
      const yesToken = await ethers.getContractAt("PredictionMarketToken", yesTokenAddress);

      // まずYESトークンを購入する
      const amountToBuy = (await yesToken.balanceOf(predictionMarket.getAddress())) / BigInt(10);
      const requiredEth = await predictionMarket.getBuyPriceInEth(0, amountToBuy);
      await predictionMarket.connect(redeemer).buyTokensWithETH(0, amountToBuy, { value: requiredEth });

      // YESを勝ちの結果として報告する
      await predictionMarket.connect(oracle).report(0);

      // 受け取るはずのETHを計算する
      const expectedEthToReceive = (amountToBuy * ethers.parseEther("1")) / BigInt(1e18);

      // トークンを償還し、イベントを期待する
      await expect(predictionMarket.connect(redeemer).redeemWinningTokens(amountToBuy))
        .to.emit(predictionMarket, "WinningTokensRedeemed")
        .withArgs(redeemer.address, amountToBuy, expectedEthToReceive);
    });

    it("Owner cannot redeem tokens", async function () {
      const [owner, oracle] = await ethers.getSigners();
      const predictionMarketFactory = await getPredictionMarketFactory();
      const predictionMarket = await predictionMarketFactory.deploy(
        owner.address,
        oracle.address,
        "Test Question",
        ethers.parseEther("1"),
        50,
        20,
        { value: ethers.parseEther("10") },
      );
      await predictionMarket.waitForDeployment();

      // YESを勝ちの結果として報告する
      await predictionMarket.connect(oracle).report(0);

      // オーナーとして償還を試みる(revertするはず)
      await expect(
        predictionMarket.connect(owner).redeemWinningTokens(ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(predictionMarket, "PredictionMarket__OwnerCannotCall");
    });
  });
});

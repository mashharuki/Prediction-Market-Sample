//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { PredictionMarketToken } from "./PredictionMarketToken.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract PredictionMarket is Ownable {
    /////////////////
    /// エラー //////
    /////////////////

    error PredictionMarket__MustProvideETHForInitialLiquidity();
    error PredictionMarket__InvalidProbability();
    error PredictionMarket__PredictionAlreadyReported();
    error PredictionMarket__OnlyOracleCanReport();
    error PredictionMarket__OwnerCannotCall();
    error PredictionMarket__PredictionNotReported();
    error PredictionMarket__InsufficientWinningTokens();
    error PredictionMarket__AmountMustBeGreaterThanZero();
    error PredictionMarket__MustSendExactETHAmount();
    error PredictionMarket__InsufficientTokenReserve(Outcome _outcome, uint256 _amountToken);
    error PredictionMarket__TokenTransferFailed();
    error PredictionMarket__ETHTransferFailed();
    error PredictionMarket__InsufficientBalance(uint256 _tradingAmount, uint256 _userBalance);
    error PredictionMarket__InsufficientAllowance(uint256 _tradingAmount, uint256 _allowance);
    error PredictionMarket__InsufficientLiquidity();
    error PredictionMarket__InvalidPercentageToLock();

    //////////////////////////
    /// 状態変数 //////
    //////////////////////////

    enum Outcome {
        YES,
        NO
    }

    uint256 private constant PRECISION = 1e18;

    /// Checkpoint 2 ///

    /// Checkpoint 3 ///

    /// Checkpoint 5 ///

    /////////////////////////
    /// イベント //////
    /////////////////////////

    event TokensPurchased(address indexed buyer, Outcome outcome, uint256 amount, uint256 ethAmount);
    event TokensSold(address indexed seller, Outcome outcome, uint256 amount, uint256 ethAmount);
    event WinningTokensRedeemed(address indexed redeemer, uint256 amount, uint256 ethAmount);
    event MarketReported(address indexed oracle, Outcome winningOutcome, address winningToken);
    event MarketResolved(address indexed resolver, uint256 totalEthToSend);
    event LiquidityAdded(address indexed provider, uint256 ethAmount, uint256 tokensAmount);
    event LiquidityRemoved(address indexed provider, uint256 ethAmount, uint256 tokensAmount);

    /////////////////
    /// 修飾子 ///
    /////////////////

    /// Checkpoint 5 ///

    /// Checkpoint 6 ///

    /// Checkpoint 8 ///

    //////////////////
    ////コンストラクタ///
    //////////////////

    constructor(
        address _liquidityProvider,
        address _oracle,
        string memory _question,
        uint256 _initialTokenValue,
        uint8 _initialYesProbability,
        uint8 _percentageToLock
    ) payable Ownable(_liquidityProvider) {
        /// Checkpoint 2 ////
        /// Checkpoint 3 ////
    }

    /////////////////
    /// 関数 ///
    /////////////////

    /**
     * @notice 予測市場に流動性を追加し、トークンをミントする
     * @dev オーナーのみが呼び出せ、かつ予測結果がまだ報告されていない場合のみ実行できる
     */
    function addLiquidity() external payable onlyOwner {
        //// Checkpoint 4 ////
    }

    /**
     * @notice 予測市場から流動性を引き出し、対応するトークンをバーンする。予測結果が確定する前に流動性を引き出した場合、lpReserveの取り分は得られない
     * @dev オーナーのみが呼び出せ、かつ予測結果がまだ報告されていない場合のみ実行できる
     * @param _ethToWithdraw 流動性プールから引き出すETHの量
     */
    function removeLiquidity(uint256 _ethToWithdraw) external onlyOwner {
        //// Checkpoint 4 ////
    }

    /**
     * @notice 予測結果の勝敗をオラクルが報告する
     * @dev オラクルのみが呼び出せ、かつ予測結果がまだ報告されていない場合のみ実行できる
     * @param _winningOutcome 勝った結果(YESまたはNO)
     */
    function report(Outcome _winningOutcome) external {
        //// Checkpoint 5 ////
    }

    /**
     * @notice 予測結果が確定した後、コントラクトオーナーがコントラクトの保有する勝ちトークンを償還し、LPの取引収益と担保も含めてETHを引き出せる
     * @dev オーナーのみが呼び出せ、かつ予測結果が確定している場合のみ実行できる
     * @return ethRedeemed 償還されたETHの量
     */
    function resolveMarketAndWithdraw() external onlyOwner returns (uint256 ethRedeemed) {
        /// Checkpoint 6 ////
    }

    /**
     * @notice ETHで予測結果トークンを購入する。事前にpriceInETH関数を呼び出して正しい購入量を確認する必要がある
     * @param _outcome 購入したい結果(YESまたはNO)
     * @param _amountTokenToBuy 購入するトークンの量
     */
    function buyTokensWithETH(Outcome _outcome, uint256 _amountTokenToBuy) external payable {
        /// Checkpoint 8 ////
    }

    /**
     * @notice 予測結果トークンを売却してETHを受け取る。事前にpriceInETH関数を呼び出して正しい売却量を確認する必要がある
     * @param _outcome 売却したい結果(YESまたはNO)
     * @param _tradingAmount 売却するトークンの量
     */
    function sellTokensForEth(Outcome _outcome, uint256 _tradingAmount) external {
        /// Checkpoint 8 ////
    }

    /**
     * @notice 予測結果が確定した後、勝ちトークンをETHと交換する。勝ちトークンはバーンされ、ユーザーはETHを受け取る
     * @dev 予測結果が確定している場合のみ実行できる
     * @param _amount 償還する勝ちトークンの量
     */
    function redeemWinningTokens(uint256 _amount) external {
        /// Checkpoint 9 ////
    }

    /**
     * @notice トークン購入にかかる合計ETH価格を計算する
     * @param _outcome 購入したい結果(YESまたはNO)
     * @param _tradingAmount 購入するトークンの量
     * @return 合計ETH価格
     */
    function getBuyPriceInEth(Outcome _outcome, uint256 _tradingAmount) public view returns (uint256) {
        /// Checkpoint 7 ////
    }

    /**
     * @notice トークン売却で得られる合計ETH価格を計算する
     * @param _outcome 売却したい結果(YESまたはNO)
     * @param _tradingAmount 売却するトークンの量
     * @return 合計ETH価格
     */
    function getSellPriceInEth(Outcome _outcome, uint256 _tradingAmount) public view returns (uint256) {
        /// Checkpoint 7 ////
    }

    /////////////////////////
    /// ヘルパー関数 ///
    ////////////////////////

    /**
     * @dev 購入・売却の両方に使うETH価格を計算する内部ヘルパー
     * @param _outcome 結果(YESまたはNO)
     * @param _tradingAmount トークンの量
     * @param _isSelling 売却時の計算かどうか
     */
    function _calculatePriceInEth(
        Outcome _outcome,
        uint256 _tradingAmount,
        bool _isSelling
    ) private view returns (uint256) {
        /// Checkpoint 7 ////
    }

    /**
     * @dev トークンの現在のリザーブ量を取得する内部ヘルパー
     * @param _outcome 結果(YESまたはNO)
     * @return トークンの現在のリザーブ量
     */
    function _getCurrentReserves(Outcome _outcome) private view returns (uint256, uint256) {
        /// Checkpoint 7 ////
    }

    /**
     * @dev トークンの確率を計算する内部ヘルパー
     * @param tokensSold 売却済みトークンの数
     * @param totalSold 売却済みトークンの合計数
     * @return トークンの確率
     */
    function _calculateProbability(uint256 tokensSold, uint256 totalSold) private pure returns (uint256) {
        /// Checkpoint 7 ////
    }

    /////////////////////////
    /// ゲッター関数 ///
    ////////////////////////

    /**
     * @notice 予測市場の詳細情報を取得する
     */
    function getPrediction()
        external
        view
        returns (
            string memory question,
            string memory outcome1,
            string memory outcome2,
            address oracle,
            uint256 initialTokenValue,
            uint256 yesTokenReserve,
            uint256 noTokenReserve,
            bool isReported,
            address yesToken,
            address noToken,
            address winningToken,
            uint256 ethCollateral,
            uint256 lpTradingRevenue,
            address predictionMarketOwner,
            uint256 initialProbability,
            uint256 percentageLocked
        )
    {
        /// Checkpoint 3 ////
        // oracle = i_oracle;
        // initialTokenValue = i_initialTokenValue;
        // percentageLocked = i_percentageLocked;
        // initialProbability = i_initialYesProbability;
        // question = s_question;
        // ethCollateral = s_ethCollateral;
        // lpTradingRevenue = s_lpTradingRevenue;
        // predictionMarketOwner = owner();
        // yesToken = address(i_yesToken);
        // noToken = address(i_noToken);
        // outcome1 = i_yesToken.name();
        // outcome2 = i_noToken.name();
        // yesTokenReserve = i_yesToken.balanceOf(address(this));
        // noTokenReserve = i_noToken.balanceOf(address(this));
        /// Checkpoint 5 ////
        // isReported = s_isReported;
        // winningToken = address(s_winningToken);
    }
}

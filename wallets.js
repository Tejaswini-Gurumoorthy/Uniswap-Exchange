const wallets= [
        '0x7b207Eeb64eb13AFe475650009726d46F486Ba0b',
        '0xf24C92100948D0356479D29a7cfFDB14E2346b51',
        '0xbD8612E80960dDA82fE05EC43B6a28338064D8DA',
        '0x2a1566dEE00D59c0254638fC1f86e82FB11A8379',
        '0x2628CD27d9f19f5a5fDDBcef24BD101dC144Ee5d',
        '0x9e887D880bfF46efF9A92F44B73758D1e56e5553',
        '0xa9aCACBa143A0f8DAc4450AbdFA585152D76c959',
        '0x692352874Fdd9c8664B6d2B0cc1E52f8577c120A',
        '0x8a05B99B3df259D7E6E017fD20e924069Db2301C',
        '0x6866Bb8ffCF0263F1674eED466Add06d5E95E3aD'
]
module.exports= {wallets};

const { ethers } = require('ethers');
const { ChainId, Token, WETH, TradeType, TokenAmount, Trade, Route, Percent } = require('@uniswap/sdk');

// Set up provider and signer
const provider = new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID');
const signer = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

// Set up Uniswap router address and instance
const uniswapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const uniswapRouterAbi = [
  'function exactInput(params ExactInputParams) returns (uint256 amountOut)',
  'function exactOutput(params ExactOutputParams) returns (uint256 amountIn)',
];
const uniswapRouter = new ethers.Contract(uniswapRouterAddress, uniswapRouterAbi, provider).connect(signer);

// Set up tokens for the trade
const tokenIn = new Token(
  ChainId.MAINNET, // chain ID
  '0x2265631747D434fb8BBBDf355b7B4782cB06AE3F', // token address
  18 // decimal places
);
const tokenOut = new Token(
  ChainId.MAINNET, // chain ID
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // token address
  18 // decimal places
);

// Set up the trade parameters
const amountIn = new TokenAmount(tokenIn, '1000000000000000000'); // 1 tokenIn
const route = new Route([tokenIn, tokenOut], WETH[ChainId.MAINNET]);
const trade = new Trade(route, amountIn, TradeType.EXACT_INPUT);

// Set up gas price and deadline
const gasPrice = ethers.utils.parseUnits('30', 'gwei');
const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time

// Loop through 10 wallets and perform the trade
for (let i = 0; i < 10; i++) {
  const wallet = ethers.Wallet.createRandom().connect(provider);

  // Approve the token transfer
  const amountToApprove = trade.maximumAmountIn.add(trade.route.path[0].liquidityProviderFee);
  const tokenInContract = new ethers.Contract(tokenIn.address, tokenIn.abi, wallet);
  const approveTx = await tokenInContract.approve(uniswapRouter.address, amountToApprove.toString());

  // Wait for the approval transaction to be mined
  const approveTxReceipt = await approveTx.wait();

  // Perform the trade
  const amountOutMin = trade.minimumAmountOut(0.01).raw;
  const path = [tokenIn.address, tokenOut.address];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const swapTx = await uniswapRouter.exactInput({
    path,
    recipient: wallet.address,
    deadline,
    amountIn: amountIn.raw.toString(),
    amountOutMinimum: amountOutMin.toString(),
  });

  // Wait for the swap transaction to be mined
  const swapTxReceipt = await swapTx.wait();

  console.log(`Swap executed successfully for wallet ${i + 1} with address ${wallet.address}`);
}
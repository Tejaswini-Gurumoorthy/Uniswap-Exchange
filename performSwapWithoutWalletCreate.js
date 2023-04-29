const { ethers } = require('ethers');
require('dotenv').config();
const uniswapRouterAbi = require('./uniswapRouterAbi.json');

const provider = new ethers.providers.AlchemyProvider('goerli', process.env.ALCHEMY_API_KEY);

const getSigner = async () => {
    try{
    const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider); //for funding the newly created wallets
   return mainWallet.connect(provider);
    }
    catch(err){
        console.error('The error before getting signer is : ', err);
    }
}

const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const uniswapRouter = new ethers.Contract(uniswapRouterAddress, uniswapRouterAbi, provider);
const tokenIn = '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6' //address of weth token on goerli
const tokenOut = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'// address of uni token on goerli
const path = [tokenIn, tokenOut]
const amountIn = ethers.utils.parseEther('1');
const deadline = Math.floor(Date.now() / 1000) + 60 * 5; //5 mins
const minAmountOut = 0;
const gasLimit= 20000;
const gasPrice = ethers.utils.parseUnits('500', 'gwei');
const trade = async () => {
    await getSigner().then(async (wallet) => {
      const uniswapTrade = uniswapRouter.connect(wallet);
      await provider
        .getBalance(wallet.address)
        .then((balance) =>
          console.log('Balance Before swap: ', ethers.utils.formatEther(balance))
        )
        .catch((err) =>
          console.error('The error before swap is: ', err)
        );
  
      const gasLimit = await uniswapTrade.estimateGas
        .swapExactETHForTokens(
          minAmountOut,
          path,
          wallet.address,
          deadline,
          {
            value: amountIn,
          }
        );
      console.log('Gas limit: ', gasLimit.toString());  
      const tx = await uniswapTrade.swapExactETHForTokens(
        minAmountOut,
        path,
        wallet.address,
        deadline,
        {
          value: amountIn.add(gasPrice.mul(gasLimit)),
          gasLimit: gasLimit,
          gasPrice: gasPrice,
        }
      );
      console.log('Transaction hash: ', tx.hash);
  
      await tx.wait(); // wait for the transaction to be mined
      console.log('Transaction mined');
  
      await provider
        .getBalance(wallet.address)
        .then((balance) =>
          console.log('Balance After swap: ', ethers.utils.formatEther(balance))
        )
        .catch((err) => console.error('The error after swap is: ', err));
    }).catch((err) =>
      console.error('The error is before createWallet is: ', err)
    );
  };
  

trade().catch((err) => console.error('The error is: ', err));

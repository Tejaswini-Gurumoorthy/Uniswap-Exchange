const { ethers } = require('ethers');
require('dotenv').config();
const uniswapRouterAbi = require('./uniswapRouterAbi.json');

const provider = new ethers.providers.AlchemyProvider('goerli', process.env.ALCHEMY_API_KEY);

const getSigner=()=>{
    const mainWallet= new ethers.Wallet(process.env.PRIVATE_KEY, provider); //for funding the newly created wallets
    const signer= mainWallet.connect(provider);
    return signer;
    }
    
const createWallets= async()=>{            
            const wallet= ethers.Wallet.createRandom();
            const txn= {
                to: wallet.address,
                value: ethers.utils.parseEther('0.07') //after calculating gaslimit*gasprice + value
            };
            const signer= getSigner();
            await signer.sendTransaction(txn).then((tx)=>{
                console.log('txn', tx);
            });
            await provider.getBalance(wallet.address).then((balance)=>{
                console.log('balance', ethers.utils.formatEther(balance));
            });
            return wallet
            
        }


const uniswapRouterAddress= '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const uniswapRouter = new ethers.Contract(uniswapRouterAddress, uniswapRouterAbi, provider);
const tokenIn= '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6' //address of weth token on goerli
const tokenOut= '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'// address of uni token on goerli
const path= [tokenIn, tokenOut]
const amountIn= ethers.utils.parseEther('0.0005');
const deadline= Math.floor(Date.now() / 1000) + 60 * 5; //5 mins
const minAmountOut= 0;
const gasLimit= 1500000;
const gasPrice= ethers.utils.parseUnits('20', 'gwei');
const value = amountIn.add(gasPrice.mul(gasLimit));

const trade=async()=>{
    for (let i = 0; i < 10; i++) {
        const newWallet= await createWallets();
        const wallet = newWallet.connect(provider);
        const uniswapTrade= uniswapRouter.connect(wallet);
        const balanceBefore= await provider.getBalance(wallet.address);
        console.log('Before transaction: ', ethers.utils.formatEther(balanceBefore));
        const tx= await uniswapTrade.swapExactETHForTokens(
            minAmountOut,
            path,
            wallet.address,
            deadline,
            {value: value, gasPrice: gasPrice, gasLimit: gasLimit}

        );
        await tx.wait();
        console.log(`Transaction hash: ${tx.hash}`)
        const balanceAfter= await provider.getBalance(wallet.address);
        console.log('Before transaction: ', ethers.utils.formatEther(balanceAfter));
        
    }
}

trade().catch((err)=> console.error('The error is: ', err));
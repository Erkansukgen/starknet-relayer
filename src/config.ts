import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { Account, constants, ec, SequencerProvider } from 'starknet';

// Constants
export const ETH_PRIV_KEY = process.env.ETH_PRIVKEY || '';
export const ETH_RPC_URL = process.env.ETH_RPC_URL || '';

export const STARKNET_PRIVKEY = process.env.STARKNET_PRIVKEY || '';
export const STARKNET_ADDRESS = process.env.STARKNET_ADDRESS || '';

// Libs
export const ethProvider = new JsonRpcProvider(ETH_RPC_URL);
export const ethWallet = new Wallet(ETH_PRIV_KEY, ethProvider);
export const starknetProvider = new SequencerProvider({
  baseUrl: 'https://alpha4.starknet.io',
  chainId: constants.StarknetChainId.TESTNET
});
export const starknetKeyPair = ec.getKeyPair(STARKNET_PRIVKEY);
export const starknetAccount = new Account(starknetProvider, STARKNET_ADDRESS, starknetKeyPair);

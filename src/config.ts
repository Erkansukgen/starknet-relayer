import { Account, defaultProvider, ec } from 'starknet';

// Constants
export const STARKNET_PRIVKEY = process.env.STARKNET_PRIVKEY || '';
export const STARKNET_ADDRESS = process.env.STARKNET_ADDRESS || '';

// Libs
export const starkKeyPair = ec.getKeyPair(STARKNET_PRIVKEY);
export const account = new Account(defaultProvider, STARKNET_ADDRESS, starkKeyPair);

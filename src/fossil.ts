import express from 'express';
import fetch from 'cross-fetch';
import { Wallet } from '@ethersproject/wallet';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { defaultProvider, Account, ec } from 'starknet';
import { utils } from '@prophouse/sdk';

const ETH_PRIV_KEY = process.env.ETH_PRIVKEY || '';
const ETH_RPC_URL = process.env.ETH_RPC_URL || '';

const FOSSIL_ADDRESS = process.env.FOSSIL_ADDRESS || '';
const FOSSIL_L1_HEADERS_STORE_ADDRESS =
  '0x1d9b36a00d7d5300e5da456c56d09c46dfefbc91b3a6b1552b6f2a34d6e34c4';
const MAX_FEE = '857400005301800';
const ABI = [
  'function sendExactParentHashToL2(uint256) payable',
  'function sendLatestParentHashToL2() payable'
];

const STARKNET_PRIV_KEY = process.env.STARKNET_PRIVKEY || '';
const STARKNET_ADDRESS = process.env.STARKNET_ADDRESS || '';

const provider = new JsonRpcProvider(ETH_RPC_URL);
const wallet = new Wallet(ETH_PRIV_KEY, provider);

const starkKeyPair = ec.getKeyPair(STARKNET_PRIV_KEY);
const starknetAccount = new Account(defaultProvider, STARKNET_ADDRESS, starkKeyPair);

const sendExactParentHashToL2 = async (blockNumber: number) => {
  const contract = new Contract(FOSSIL_ADDRESS, ABI);
  const contractWithSigner = contract.connect(wallet);
  return contractWithSigner.sendExactParentHashToL2(blockNumber, { value: MAX_FEE });
};

const sendLatestParentHashToL2 = async () => {
  const contract = new Contract(FOSSIL_ADDRESS, ABI);
  const contractWithSigner = contract.connect(wallet);
  return contractWithSigner.sendLatestParentHashToL2({ value: MAX_FEE });
};

const processBlock = async (blockNumber: number) => {
  const res = await fetch(ETH_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [`0x${blockNumber.toString(16)}`, false],
      id: 1
    })
  });
  const block = (await res.json()).result;
  const processBlockInputs = utils.storageProofs.getProcessBlockInputs(block);
  return starknetAccount.execute(
    [
      {
        contractAddress: FOSSIL_L1_HEADERS_STORE_ADDRESS,
        entrypoint: 'process_block',
        calldata: [
          processBlockInputs.blockOptions,
          processBlockInputs.blockNumber,
          processBlockInputs.headerInts.bytesLength,
          processBlockInputs.headerInts.values.length,
          ...processBlockInputs.headerInts.values
        ]
      }
    ],
    undefined,
    { maxFee: MAX_FEE }
  );
};

const router = express.Router();

router.get('/send/:blockNum?', async (req, res) => {
  const { blockNum } = req.params;
  try {
    const result = await (blockNum
      ? sendExactParentHashToL2(parseInt(blockNum))
      : sendLatestParentHashToL2());
    return res.json({ result });
  } catch (e) {
    console.log('Send parent hash failed', e);
  }
});

router.get('/process/:blockNum', async (req, res) => {
  const { blockNum } = req.params;
  try {
    const result = await processBlock(parseInt(blockNum));
    return res.json({ result });
  } catch (e) {
    console.log('Process block failed', e);
  }
});

export default router;

import express from 'express';
import fetch from 'cross-fetch';
import { Contract } from '@ethersproject/contracts';
import { utils } from '@prophouse/sdk';
import { ethWallet, ETH_RPC_URL, starknetAccount } from './config';

const HERODOTUS_ADDRESS = process.env.HERODOTUS_ADDRESS || '';
const HERODOTUS_L1_HEADERS_STORE_ADDRESS =
  '0x1d9b36a00d7d5300e5da456c56d09c46dfefbc91b3a6b1552b6f2a34d6e34c4';
const MAX_FEE = '857400005301800';
const ABI = [
  'function sendExactParentHashToL2(uint256) payable',
  'function sendLatestParentHashToL2() payable'
];

const sendExactParentHashToL2 = async (blockNumber: number) => {
  const contract = new Contract(HERODOTUS_ADDRESS, ABI);
  const contractWithSigner = contract.connect(ethWallet);
  return contractWithSigner.sendExactParentHashToL2(blockNumber, { value: MAX_FEE });
};

const sendLatestParentHashToL2 = async () => {
  const contract = new Contract(HERODOTUS_ADDRESS, ABI);
  const contractWithSigner = contract.connect(ethWallet);
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
        contractAddress: HERODOTUS_L1_HEADERS_STORE_ADDRESS,
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

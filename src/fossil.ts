import express from 'express';
import fetch from 'cross-fetch';
import { Wallet } from '@ethersproject/wallet';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { defaultProvider, Account, ec } from 'starknet';
import { utils } from '@prophouse/sdk';

const ethPrivkey = process.env.ETH_PRIVKEY || '';
const ethRpcUrl = process.env.ETH_RPC_URL || '';
const provider = new JsonRpcProvider(ethRpcUrl);
const wallet = new Wallet(ethPrivkey, provider);

const fossilAddress = process.env.FOSSIL_ADDRESS || '';
const fossilL1HeadersStoreAddress =
  '0x6ca3d25e901ce1fff2a7dd4079a24ff63ca6bbf8ba956efc71c1467975ab78f';

const abi = ['function sendExactParentHashToL2(uint256)', 'function sendLatestParentHashToL2()'];

const starknetPrivkey = process.env.STARKNET_PRIVKEY || '';
const starknetAddress = process.env.STARKNET_ADDRESS || '';
const starkKeyPair = ec.getKeyPair(starknetPrivkey);
const starknetAccount = new Account(defaultProvider, starknetAddress, starkKeyPair);

const sendExactParentHashToL2 = async (blockNumber: number) => {
  const contract = new Contract(fossilAddress, abi);
  const contractWithSigner = contract.connect(wallet);
  return contractWithSigner.sendExactParentHashToL2(blockNumber);
};

const sendLatestParentHashToL2 = async () => {
  const contract = new Contract(fossilAddress, abi);
  const contractWithSigner = contract.connect(wallet);
  return contractWithSigner.sendLatestParentHashToL2();
};

const processBlock = async (blockNumber: number) => {
  const res = await fetch(ethRpcUrl, {
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
        contractAddress: fossilL1HeadersStoreAddress,
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
    { maxFee: '857400005301800' }
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

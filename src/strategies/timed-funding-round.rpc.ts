import { InvokeFunctionResponse } from 'starknet';
import { ChainId, TimedFunding, TimedFundingRound } from '@prophouse/sdk';
import { rpcError, rpcSuccess } from '../utils';
import { starknetAccount, starknetProvider } from '../config';

const evmChainId = parseInt(process.env.ETH_CHAIN_ID ?? ChainId.EthereumGoerli.toString());
const round = new TimedFundingRound({
  evmChainId,
  evm: process.env.ETH_RPC_URL as string,
  starknet: starknetProvider
});

export const rpc = {
  async send(id: string, params: TimedFunding.RequestParams, res: unknown) {
    try {
      let receipt: InvokeFunctionResponse | undefined;

      switch (params.action) {
        case TimedFunding.Action.Propose:
          receipt = await round.relaySignedProposePayload(
            starknetAccount,
            params as TimedFunding.RequestParams<TimedFunding.Action.Propose>
          );
          break;
        case TimedFunding.Action.Vote:
          receipt = await round.relaySignedVotePayload(
            starknetAccount,
            params as TimedFunding.RequestParams<TimedFunding.Action.Vote>
          );
          break;
        default:
          throw new Error(`Unknown action: ${params.action}.`);
      }
      return rpcSuccess(res, receipt, id);
    } catch (error) {
      return rpcError(res, 500, error, id);
    }
  }
};

import {
  ethChainId as evmChainId,
  ETH_RPC_URL,
  starknetAccount,
  starknetProvider
} from '../config';
import { TimedFunding, TimedFundingRound } from '@prophouse/sdk';
import { InvokeFunctionResponse } from 'starknet';
import { rpcError, rpcSuccess } from '../utils';

const round = new TimedFundingRound({
  evmChainId,
  evm: ETH_RPC_URL,
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

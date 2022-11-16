import { defaultProvider, InvokeFunctionResponse } from 'starknet';
import { rpcError, rpcSuccess } from '../utils';
import { account } from '../config';
import {
  EthSigProposeMessage,
  EthSigVoteMessage,
  ProposeMessage,
  TimedFundingRoundAction,
  TimedFundingRoundClient,
  TimedFundingRoundEnvelope,
  VoteMessage
} from '@prophouse/sdk';

interface TimedFundingRoundParams {
  envelope: TimedFundingRoundEnvelope;
}

const client = new TimedFundingRoundClient({
  ethUrl: process.env.ETH_RPC_URL as string,
  starkProvider: defaultProvider
});

export const rpc = {
  async send(id: string, params: TimedFundingRoundParams, res: unknown) {
    try {
      const { action } = params.envelope.data;
      let receipt: InvokeFunctionResponse | undefined;

      switch (action) {
        case TimedFundingRoundAction.Propose:
          receipt = await client.propose(
            account,
            params.envelope as TimedFundingRoundEnvelope<ProposeMessage | EthSigProposeMessage>
          );
          break;
        case TimedFundingRoundAction.Vote:
          receipt = await client.vote(
            account,
            params.envelope as TimedFundingRoundEnvelope<VoteMessage | EthSigVoteMessage>
          );
          break;
        default:
          throw new Error(`Unknown action: ${action}.`);
      }
      return rpcSuccess(res, receipt, id);
    } catch (error) {
      return rpcError(res, 500, error, id);
    }
  }
};

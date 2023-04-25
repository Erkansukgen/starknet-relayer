import {
  Abi,
  Account,
  AllowArray,
  BlockTag,
  Call,
  InvocationsDetails,
  InvokeFunctionResponse,
  KeyPair,
  ProviderInterface,
  ProviderOptions,
  SignerInterface
} from 'starknet';
import BN from 'bn.js';

declare type BigNumberish = string | number | BN;

export class NonceManagedAccount extends Account {
  #noncePromise: null | Promise<BigNumberish>;
  #delta: number;

  constructor(
    providerOrOptions: ProviderOptions | ProviderInterface,
    address: string,
    keyPairOrSigner: KeyPair | SignerInterface
  ) {
    super(providerOrOptions, address, keyPairOrSigner);

    this.#noncePromise = null;
    this.#delta = 0;
  }

  async getNonce(blockTag?: BlockTag): Promise<BigNumberish> {
    if (blockTag === 'pending') {
      if (this.#noncePromise == null) {
        this.#noncePromise = super.getNonce('pending');
      }

      const delta = this.#delta;
      const nonce = await this.#noncePromise;
      return parseInt(nonce.toString(), 16) + delta;
    }

    return super.getNonce(blockTag);
  }

  increment(): void {
    this.#delta++;
  }

  reset(): void {
    this.#delta = 0;
    this.#noncePromise = null;
  }

  async execute(
    calls: AllowArray<Call>,
    abis?: Abi[] | undefined,
    transactionsDetail?: InvocationsDetails
  ): Promise<InvokeFunctionResponse> {
    const noncePromise = this.getNonce('pending');
    this.increment();

    return super.execute(calls, abis, {
      ...(transactionsDetail || {}),
      nonce: await noncePromise
    });
  }
}

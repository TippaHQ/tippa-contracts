import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBTUWPRNCPOUHVT4JLFW5TDVHYNJIWQRKA3MHBWKV4I7RPRS2WTTQUCV",
  }
} as const

export const Errors = {
  1: {message:"UserNotFound"},
  2: {message:"NotOwner"},
  3: {message:"TooManyRules"},
  4: {message:"RulesTotalExceedsMax"},
  5: {message:"SelfReference"},
  6: {message:"InvalidPercentage"},
  7: {message:"NothingToDistribute"},
  9: {message:"InvalidAmount"},
  10: {message:"UsernameAlreadyTaken"},
  11: {message:"RulesNotSet"},
  12: {message:"RecipientNotRegistered"}
}

export type DataKey = {tag: "Owner", values: readonly [string]} | {tag: "Rules", values: readonly [string]} | {tag: "Pool", values: readonly [string, string]} | {tag: "TotalReceived", values: readonly [string, string]} | {tag: "TotalReceivedFromOthers", values: readonly [string, string]} | {tag: "Unclaimed", values: readonly [string, string]} | {tag: "DonorToUser", values: readonly [DonorKey]} | {tag: "DonorTotal", values: readonly [string, string]} | {tag: "TotalForwarded", values: readonly [string, string]} | {tag: "GrandTotal", values: readonly [string]} | {tag: "PaidTo", values: readonly [string, string]};


export interface DonorKey {
  asset: string;
  donor: string;
  username: string;
}

export interface Client {
  /**
   * Construct and simulate a claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  claim: ({caller, username, asset, to}: {caller: string, username: string, asset: string, to: Option<string>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a donate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  donate: ({caller, username, asset, amount, donor_override}: {caller: string, username: string, asset: string, amount: i128, donor_override: Option<string>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_pool: ({username, asset}: {username: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  register: ({caller, username}: {caller: string, username: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_owner: ({username}: {username: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a get_rules transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_rules: ({username}: {username: string}, options?: MethodOptions) => Promise<AssembledTransaction<Map<string, u32>>>

  /**
   * Construct and simulate a set_rules transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_rules: ({caller, username, rules}: {caller: string, username: string, rules: Map<string, u32>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a distribute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * `min_distribution`: smallest amount worth forwarding (in token stroops).
   * Shares below this threshold stay with the owner instead of cascading.
   * Pass 0 to disable the threshold.
   */
  distribute: ({username, asset, min_distribution}: {username: string, asset: string, min_distribution: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_paid_to transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_paid_to: ({address, asset}: {address: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_unclaimed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_unclaimed: ({username, asset}: {username: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_donor_total transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_donor_total: ({donor, asset}: {donor: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_grand_total transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_grand_total: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_donor_to_user transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_donor_to_user: ({donor, username, asset}: {donor: string, username: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_total_received transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_received: ({username, asset}: {username: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a transfer_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_ownership: ({caller, username, new_owner}: {caller: string, username: string, new_owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_total_forwarded transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_forwarded: ({username, asset}: {username: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a distribute_and_claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  distribute_and_claim: ({caller, username, asset, to, min_distribution}: {caller: string, username: string, asset: string, to: Option<string>, min_distribution: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_total_received_from_others transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_received_from_others: ({username, asset}: {username: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAACwAAAAAAAAAMVXNlck5vdEZvdW5kAAAAAQAAAAAAAAAITm90T3duZXIAAAACAAAAAAAAAAxUb29NYW55UnVsZXMAAAADAAAAAAAAABRSdWxlc1RvdGFsRXhjZWVkc01heAAAAAQAAAAAAAAADVNlbGZSZWZlcmVuY2UAAAAAAAAFAAAAAAAAABFJbnZhbGlkUGVyY2VudGFnZQAAAAAAAAYAAAAAAAAAE05vdGhpbmdUb0Rpc3RyaWJ1dGUAAAAABwAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAkAAAAAAAAAFFVzZXJuYW1lQWxyZWFkeVRha2VuAAAACgAAAAAAAAALUnVsZXNOb3RTZXQAAAAACwAAAAAAAAAWUmVjaXBpZW50Tm90UmVnaXN0ZXJlZAAAAAAADA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAACwAAAAEAAAAAAAAABU93bmVyAAAAAAAAAQAAABAAAAABAAAAAAAAAAVSdWxlcwAAAAAAAAEAAAAQAAAAAQAAAAAAAAAEUG9vbAAAAAIAAAAQAAAAEwAAAAEAAAAAAAAADVRvdGFsUmVjZWl2ZWQAAAAAAAACAAAAEAAAABMAAAABAAAAAAAAABdUb3RhbFJlY2VpdmVkRnJvbU90aGVycwAAAAACAAAAEAAAABMAAAABAAAAAAAAAAlVbmNsYWltZWQAAAAAAAACAAAAEAAAABMAAAABAAAAAAAAAAtEb25vclRvVXNlcgAAAAABAAAH0AAAAAhEb25vcktleQAAAAEAAAAAAAAACkRvbm9yVG90YWwAAAAAAAIAAAATAAAAEwAAAAEAAAAAAAAADlRvdGFsRm9yd2FyZGVkAAAAAAACAAAAEAAAABMAAAABAAAAAAAAAApHcmFuZFRvdGFsAAAAAAABAAAAEwAAAAEAAAAAAAAABlBhaWRUbwAAAAAAAgAAABMAAAAT",
        "AAAAAQAAAAAAAAAAAAAACERvbm9yS2V5AAAAAwAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAAVkb25vcgAAAAAAABMAAAAAAAAACHVzZXJuYW1lAAAAEA==",
        "AAAAAAAAAAAAAAAFY2xhaW0AAAAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACHVzZXJuYW1lAAAAEAAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAAJ0bwAAAAAD6AAAABMAAAABAAAD6QAAAAsAAAAD",
        "AAAAAAAAAAAAAAAGZG9uYXRlAAAAAAAFAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACHVzZXJuYW1lAAAAEAAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAADmRvbm9yX292ZXJyaWRlAAAAAAPoAAAAEwAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAAIZ2V0X3Bvb2wAAAACAAAAAAAAAAh1c2VybmFtZQAAABAAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAIcmVnaXN0ZXIAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACHVzZXJuYW1lAAAAEAAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAAJZ2V0X293bmVyAAAAAAAAAQAAAAAAAAAIdXNlcm5hbWUAAAAQAAAAAQAAA+gAAAAT",
        "AAAAAAAAAAAAAAAJZ2V0X3J1bGVzAAAAAAAAAQAAAAAAAAAIdXNlcm5hbWUAAAAQAAAAAQAAA+wAAAAQAAAABA==",
        "AAAAAAAAAAAAAAAJc2V0X3J1bGVzAAAAAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAh1c2VybmFtZQAAABAAAAAAAAAABXJ1bGVzAAAAAAAD7AAAABAAAAAEAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAK9gbWluX2Rpc3RyaWJ1dGlvbmA6IHNtYWxsZXN0IGFtb3VudCB3b3J0aCBmb3J3YXJkaW5nIChpbiB0b2tlbiBzdHJvb3BzKS4KU2hhcmVzIGJlbG93IHRoaXMgdGhyZXNob2xkIHN0YXkgd2l0aCB0aGUgb3duZXIgaW5zdGVhZCBvZiBjYXNjYWRpbmcuClBhc3MgMCB0byBkaXNhYmxlIHRoZSB0aHJlc2hvbGQuAAAAAApkaXN0cmlidXRlAAAAAAADAAAAAAAAAAh1c2VybmFtZQAAABAAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAQbWluX2Rpc3RyaWJ1dGlvbgAAAAsAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAAAAAAALZ2V0X3BhaWRfdG8AAAAAAgAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAANZ2V0X3VuY2xhaW1lZAAAAAAAAAIAAAAAAAAACHVzZXJuYW1lAAAAEAAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAPZ2V0X2Rvbm9yX3RvdGFsAAAAAAIAAAAAAAAABWRvbm9yAAAAAAAAEwAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAPZ2V0X2dyYW5kX3RvdGFsAAAAAAEAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAARZ2V0X2Rvbm9yX3RvX3VzZXIAAAAAAAADAAAAAAAAAAVkb25vcgAAAAAAABMAAAAAAAAACHVzZXJuYW1lAAAAEAAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAASZ2V0X3RvdGFsX3JlY2VpdmVkAAAAAAACAAAAAAAAAAh1c2VybmFtZQAAABAAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAASdHJhbnNmZXJfb3duZXJzaGlwAAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACHVzZXJuYW1lAAAAEAAAAAAAAAAJbmV3X293bmVyAAAAAAAAEwAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAATZ2V0X3RvdGFsX2ZvcndhcmRlZAAAAAACAAAAAAAAAAh1c2VybmFtZQAAABAAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAUZGlzdHJpYnV0ZV9hbmRfY2xhaW0AAAAFAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACHVzZXJuYW1lAAAAEAAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAAAAAAJ0bwAAAAAD6AAAABMAAAAAAAAAEG1pbl9kaXN0cmlidXRpb24AAAALAAAAAQAAA+kAAAALAAAAAw==",
        "AAAAAAAAAAAAAAAeZ2V0X3RvdGFsX3JlY2VpdmVkX2Zyb21fb3RoZXJzAAAAAAACAAAAAAAAAAh1c2VybmFtZQAAABAAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAEAAAAL" ]),
      options
    )
  }
  public readonly fromJSON = {
    claim: this.txFromJSON<Result<i128>>,
        donate: this.txFromJSON<Result<void>>,
        get_pool: this.txFromJSON<i128>,
        register: this.txFromJSON<Result<void>>,
        get_owner: this.txFromJSON<Option<string>>,
        get_rules: this.txFromJSON<Map<string, u32>>,
        set_rules: this.txFromJSON<Result<void>>,
        distribute: this.txFromJSON<Result<void>>,
        get_paid_to: this.txFromJSON<i128>,
        get_unclaimed: this.txFromJSON<i128>,
        get_donor_total: this.txFromJSON<i128>,
        get_grand_total: this.txFromJSON<i128>,
        get_donor_to_user: this.txFromJSON<i128>,
        get_total_received: this.txFromJSON<i128>,
        transfer_ownership: this.txFromJSON<Result<void>>,
        get_total_forwarded: this.txFromJSON<i128>,
        distribute_and_claim: this.txFromJSON<Result<i128>>,
        get_total_received_from_others: this.txFromJSON<i128>
  }
}
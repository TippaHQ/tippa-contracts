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
    contractId: "CA5CQ7URF2Y364SMRN4L7PNMSFEW46LRRWGMCUEKU3RGA2E7JKSRGWJ6",
  }
} as const

export const Errors = {
  1: {message:"ProjectNotFound"},
  2: {message:"NotOwner"},
  3: {message:"TooManyRules"},
  4: {message:"RulesTotalExceedsMax"},
  5: {message:"SelfReference"},
  6: {message:"InvalidPercentage"},
  7: {message:"NothingToDistribute"},
  8: {message:"NicknameAlreadyTaken"},
  9: {message:"InvalidAmount"},
  10: {message:"ProjectAlreadyExists"},
  11: {message:"RulesNotSet"},
  12: {message:"RecipientNotRegistered"}
}

export type DataKey = {tag: "Owner", values: readonly [string]} | {tag: "Rules", values: readonly [string]} | {tag: "Pool", values: readonly [string, string]} | {tag: "TotalReceived", values: readonly [string, string]} | {tag: "TotalReceivedFromProjects", values: readonly [string, string]} | {tag: "Unclaimed", values: readonly [string, string]} | {tag: "DonorToProject", values: readonly [DonorProjectKey]} | {tag: "DonorTotal", values: readonly [string, string]} | {tag: "GrandTotal", values: readonly [string]} | {tag: "PaidTo", values: readonly [string, string]} | {tag: "Nickname", values: readonly [string]} | {tag: "NicknameOwner", values: readonly [string]};


export interface DonorProjectKey {
  asset: string;
  donor: string;
  project: string;
}

export interface Client {
  /**
   * Construct and simulate a claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  claim: ({caller, project_id, asset, to}: {caller: string, project_id: string, asset: string, to: Option<string>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a donate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  donate: ({caller, project_id, asset, amount, donor_override}: {caller: string, project_id: string, asset: string, amount: i128, donor_override: Option<string>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_pool: ({project_id, asset}: {project_id: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_owner: ({project_id}: {project_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a get_rules transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_rules: ({project_id}: {project_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Map<string, u32>>>

  /**
   * Construct and simulate a set_rules transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_rules: ({caller, project_id, rules}: {caller: string, project_id: string, rules: Map<string, u32>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a distribute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * `min_distribution`: smallest amount worth forwarding (in token stroops).
   * Shares below this threshold stay with the owner instead of cascading.
   * Pass 0 to disable the threshold.
   */
  distribute: ({project_id, asset, min_distribution}: {project_id: string, asset: string, min_distribution: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_paid_to transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_paid_to: ({address, asset}: {address: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_nickname transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_nickname: ({address}: {address: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a set_nickname transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_nickname: ({caller, nickname}: {caller: string, nickname: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_unclaimed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_unclaimed: ({project_id, asset}: {project_id: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_donor_total transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_donor_total: ({donor, asset}: {donor: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_grand_total transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_grand_total: ({asset}: {asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a register_project transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  register_project: ({caller, project_id}: {caller: string, project_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_nickname_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_nickname_owner: ({nickname}: {nickname: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a get_total_received transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_received: ({project_id, asset}: {project_id: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a transfer_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_ownership: ({caller, project_id, new_owner}: {caller: string, project_id: string, new_owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a distribute_and_claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  distribute_and_claim: ({caller, project_id, asset, to, min_distribution}: {caller: string, project_id: string, asset: string, to: Option<string>, min_distribution: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_donor_to_project transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_donor_to_project: ({donor, project_id, asset}: {donor: string, project_id: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_total_received_from_projects transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_received_from_projects: ({project_id, asset}: {project_id: string, asset: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

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
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADAAAAAAAAAAPUHJvamVjdE5vdEZvdW5kAAAAAAEAAAAAAAAACE5vdE93bmVyAAAAAgAAAAAAAAAMVG9vTWFueVJ1bGVzAAAAAwAAAAAAAAAUUnVsZXNUb3RhbEV4Y2VlZHNNYXgAAAAEAAAAAAAAAA1TZWxmUmVmZXJlbmNlAAAAAAAABQAAAAAAAAARSW52YWxpZFBlcmNlbnRhZ2UAAAAAAAAGAAAAAAAAABNOb3RoaW5nVG9EaXN0cmlidXRlAAAAAAcAAAAAAAAAFE5pY2tuYW1lQWxyZWFkeVRha2VuAAAACAAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAkAAAAAAAAAFFByb2plY3RBbHJlYWR5RXhpc3RzAAAACgAAAAAAAAALUnVsZXNOb3RTZXQAAAAACwAAAAAAAAAWUmVjaXBpZW50Tm90UmVnaXN0ZXJlZAAAAAAADA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAADAAAAAEAAAAAAAAABU93bmVyAAAAAAAAAQAAABAAAAABAAAAAAAAAAVSdWxlcwAAAAAAAAEAAAAQAAAAAQAAAAAAAAAEUG9vbAAAAAIAAAAQAAAAEwAAAAEAAAAAAAAADVRvdGFsUmVjZWl2ZWQAAAAAAAACAAAAEAAAABMAAAABAAAAAAAAABlUb3RhbFJlY2VpdmVkRnJvbVByb2plY3RzAAAAAAAAAgAAABAAAAATAAAAAQAAAAAAAAAJVW5jbGFpbWVkAAAAAAAAAgAAABAAAAATAAAAAQAAAAAAAAAORG9ub3JUb1Byb2plY3QAAAAAAAEAAAfQAAAAD0Rvbm9yUHJvamVjdEtleQAAAAABAAAAAAAAAApEb25vclRvdGFsAAAAAAACAAAAEwAAABMAAAABAAAAAAAAAApHcmFuZFRvdGFsAAAAAAABAAAAEwAAAAEAAAAAAAAABlBhaWRUbwAAAAAAAgAAABMAAAATAAAAAQAAAAAAAAAITmlja25hbWUAAAABAAAAEwAAAAEAAAAAAAAADU5pY2tuYW1lT3duZXIAAAAAAAABAAAAEA==",
        "AAAAAQAAAAAAAAAAAAAAD0Rvbm9yUHJvamVjdEtleQAAAAADAAAAAAAAAAVhc3NldAAAAAAAABMAAAAAAAAABWRvbm9yAAAAAAAAEwAAAAAAAAAHcHJvamVjdAAAAAAQ",
        "AAAAAAAAAAAAAAAFY2xhaW0AAAAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACnByb2plY3RfaWQAAAAAABAAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAACdG8AAAAAA+gAAAATAAAAAQAAA+kAAAALAAAAAw==",
        "AAAAAAAAAAAAAAAGZG9uYXRlAAAAAAAFAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACnByb2plY3RfaWQAAAAAABAAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAA5kb25vcl9vdmVycmlkZQAAAAAD6AAAABMAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAAAAAAAIZ2V0X3Bvb2wAAAACAAAAAAAAAApwcm9qZWN0X2lkAAAAAAAQAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAAJZ2V0X293bmVyAAAAAAAAAQAAAAAAAAAKcHJvamVjdF9pZAAAAAAAEAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAAAAAAAAJZ2V0X3J1bGVzAAAAAAAAAQAAAAAAAAAKcHJvamVjdF9pZAAAAAAAEAAAAAEAAAPsAAAAEAAAAAQ=",
        "AAAAAAAAAAAAAAAJc2V0X3J1bGVzAAAAAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAApwcm9qZWN0X2lkAAAAAAAQAAAAAAAAAAVydWxlcwAAAAAAA+wAAAAQAAAABAAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAK9gbWluX2Rpc3RyaWJ1dGlvbmA6IHNtYWxsZXN0IGFtb3VudCB3b3J0aCBmb3J3YXJkaW5nIChpbiB0b2tlbiBzdHJvb3BzKS4KU2hhcmVzIGJlbG93IHRoaXMgdGhyZXNob2xkIHN0YXkgd2l0aCB0aGUgb3duZXIgaW5zdGVhZCBvZiBjYXNjYWRpbmcuClBhc3MgMCB0byBkaXNhYmxlIHRoZSB0aHJlc2hvbGQuAAAAAApkaXN0cmlidXRlAAAAAAADAAAAAAAAAApwcm9qZWN0X2lkAAAAAAAQAAAAAAAAAAVhc3NldAAAAAAAABMAAAAAAAAAEG1pbl9kaXN0cmlidXRpb24AAAALAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAAAAAAALZ2V0X3BhaWRfdG8AAAAAAgAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAAMZ2V0X25pY2tuYW1lAAAAAQAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAQAAA+gAAAAQ",
        "AAAAAAAAAAAAAAAMc2V0X25pY2tuYW1lAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAhuaWNrbmFtZQAAABAAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAAAAAAANZ2V0X3VuY2xhaW1lZAAAAAAAAAIAAAAAAAAACnByb2plY3RfaWQAAAAAABAAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAPZ2V0X2Rvbm9yX3RvdGFsAAAAAAIAAAAAAAAABWRvbm9yAAAAAAAAEwAAAAAAAAAFYXNzZXQAAAAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAPZ2V0X2dyYW5kX3RvdGFsAAAAAAEAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAQcmVnaXN0ZXJfcHJvamVjdAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAKcHJvamVjdF9pZAAAAAAAEAAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAASZ2V0X25pY2tuYW1lX293bmVyAAAAAAABAAAAAAAAAAhuaWNrbmFtZQAAABAAAAABAAAD6AAAABM=",
        "AAAAAAAAAAAAAAASZ2V0X3RvdGFsX3JlY2VpdmVkAAAAAAACAAAAAAAAAApwcm9qZWN0X2lkAAAAAAAQAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAASdHJhbnNmZXJfb3duZXJzaGlwAAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACnByb2plY3RfaWQAAAAAABAAAAAAAAAACW5ld19vd25lcgAAAAAAABMAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAAAAAAAUZGlzdHJpYnV0ZV9hbmRfY2xhaW0AAAAFAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACnByb2plY3RfaWQAAAAAABAAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAAAAAACdG8AAAAAA+gAAAATAAAAAAAAABBtaW5fZGlzdHJpYnV0aW9uAAAACwAAAAEAAAPpAAAACwAAAAM=",
        "AAAAAAAAAAAAAAAUZ2V0X2Rvbm9yX3RvX3Byb2plY3QAAAADAAAAAAAAAAVkb25vcgAAAAAAABMAAAAAAAAACnByb2plY3RfaWQAAAAAABAAAAAAAAAABWFzc2V0AAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAAgZ2V0X3RvdGFsX3JlY2VpdmVkX2Zyb21fcHJvamVjdHMAAAACAAAAAAAAAApwcm9qZWN0X2lkAAAAAAAQAAAAAAAAAAVhc3NldAAAAAAAABMAAAABAAAACw==" ]),
      options
    )
  }
  public readonly fromJSON = {
    claim: this.txFromJSON<Result<i128>>,
        donate: this.txFromJSON<Result<void>>,
        get_pool: this.txFromJSON<i128>,
        get_owner: this.txFromJSON<Option<string>>,
        get_rules: this.txFromJSON<Map<string, u32>>,
        set_rules: this.txFromJSON<Result<void>>,
        distribute: this.txFromJSON<Result<void>>,
        get_paid_to: this.txFromJSON<i128>,
        get_nickname: this.txFromJSON<Option<string>>,
        set_nickname: this.txFromJSON<Result<void>>,
        get_unclaimed: this.txFromJSON<i128>,
        get_donor_total: this.txFromJSON<i128>,
        get_grand_total: this.txFromJSON<i128>,
        register_project: this.txFromJSON<Result<void>>,
        get_nickname_owner: this.txFromJSON<Option<string>>,
        get_total_received: this.txFromJSON<i128>,
        transfer_ownership: this.txFromJSON<Result<void>>,
        distribute_and_claim: this.txFromJSON<Result<i128>>,
        get_donor_to_project: this.txFromJSON<i128>,
        get_total_received_from_projects: this.txFromJSON<i128>
  }
}
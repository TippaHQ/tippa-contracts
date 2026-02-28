import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions, Result } from "@stellar/stellar-sdk/contract";
import type { u32, i128, Option } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CBTUWPRNCPOUHVT4JLFW5TDVHYNJIWQRKA3MHBWKV4I7RPRS2WTTQUCV";
    };
};
export declare const Errors: {
    1: {
        message: string;
    };
    2: {
        message: string;
    };
    3: {
        message: string;
    };
    4: {
        message: string;
    };
    5: {
        message: string;
    };
    6: {
        message: string;
    };
    7: {
        message: string;
    };
    9: {
        message: string;
    };
    10: {
        message: string;
    };
    11: {
        message: string;
    };
    12: {
        message: string;
    };
};
export type DataKey = {
    tag: "Owner";
    values: readonly [string];
} | {
    tag: "Rules";
    values: readonly [string];
} | {
    tag: "Pool";
    values: readonly [string, string];
} | {
    tag: "TotalReceived";
    values: readonly [string, string];
} | {
    tag: "TotalReceivedFromOthers";
    values: readonly [string, string];
} | {
    tag: "Unclaimed";
    values: readonly [string, string];
} | {
    tag: "DonorToUser";
    values: readonly [DonorKey];
} | {
    tag: "DonorTotal";
    values: readonly [string, string];
} | {
    tag: "TotalForwarded";
    values: readonly [string, string];
} | {
    tag: "GrandTotal";
    values: readonly [string];
} | {
    tag: "PaidTo";
    values: readonly [string, string];
};
export interface DonorKey {
    asset: string;
    donor: string;
    username: string;
}
export interface Client {
    /**
     * Construct and simulate a claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    claim: ({ caller, username, asset, to }: {
        caller: string;
        username: string;
        asset: string;
        to: Option<string>;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>;
    /**
     * Construct and simulate a donate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    donate: ({ caller, username, asset, amount, donor_override }: {
        caller: string;
        username: string;
        asset: string;
        amount: i128;
        donor_override: Option<string>;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>;
    /**
     * Construct and simulate a get_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_pool: ({ username, asset }: {
        username: string;
        asset: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    register: ({ caller, username }: {
        caller: string;
        username: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>;
    /**
     * Construct and simulate a get_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_owner: ({ username }: {
        username: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>;
    /**
     * Construct and simulate a get_rules transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_rules: ({ username }: {
        username: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Map<string, u32>>>;
    /**
     * Construct and simulate a set_rules transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    set_rules: ({ caller, username, rules }: {
        caller: string;
        username: string;
        rules: Map<string, u32>;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>;
    /**
     * Construct and simulate a distribute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * `min_distribution`: smallest amount worth forwarding (in token stroops).
     * Shares below this threshold stay with the owner instead of cascading.
     * Pass 0 to disable the threshold.
     */
    distribute: ({ username, asset, min_distribution }: {
        username: string;
        asset: string;
        min_distribution: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>;
    /**
     * Construct and simulate a get_paid_to transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_paid_to: ({ address, asset }: {
        address: string;
        asset: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_unclaimed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_unclaimed: ({ username, asset }: {
        username: string;
        asset: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_donor_total transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_donor_total: ({ donor, asset }: {
        donor: string;
        asset: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_grand_total transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_grand_total: ({ asset }: {
        asset: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_donor_to_user transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_donor_to_user: ({ donor, username, asset }: {
        donor: string;
        username: string;
        asset: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_total_received transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_total_received: ({ username, asset }: {
        username: string;
        asset: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a transfer_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    transfer_ownership: ({ caller, username, new_owner }: {
        caller: string;
        username: string;
        new_owner: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>;
    /**
     * Construct and simulate a get_total_forwarded transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_total_forwarded: ({ username, asset }: {
        username: string;
        asset: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a distribute_and_claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    distribute_and_claim: ({ caller, username, asset, to, min_distribution }: {
        caller: string;
        username: string;
        asset: string;
        to: Option<string>;
        min_distribution: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>;
    /**
     * Construct and simulate a get_total_received_from_others transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_total_received_from_others: ({ username, asset }: {
        username: string;
        asset: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        claim: (json: string) => AssembledTransaction<Result<bigint, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        donate: (json: string) => AssembledTransaction<Result<void, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        get_pool: (json: string) => AssembledTransaction<bigint>;
        register: (json: string) => AssembledTransaction<Result<void, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        get_owner: (json: string) => AssembledTransaction<Option<string>>;
        get_rules: (json: string) => AssembledTransaction<Map<string, number>>;
        set_rules: (json: string) => AssembledTransaction<Result<void, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        distribute: (json: string) => AssembledTransaction<Result<void, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        get_paid_to: (json: string) => AssembledTransaction<bigint>;
        get_unclaimed: (json: string) => AssembledTransaction<bigint>;
        get_donor_total: (json: string) => AssembledTransaction<bigint>;
        get_grand_total: (json: string) => AssembledTransaction<bigint>;
        get_donor_to_user: (json: string) => AssembledTransaction<bigint>;
        get_total_received: (json: string) => AssembledTransaction<bigint>;
        transfer_ownership: (json: string) => AssembledTransaction<Result<void, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        get_total_forwarded: (json: string) => AssembledTransaction<bigint>;
        distribute_and_claim: (json: string) => AssembledTransaction<Result<bigint, import("@stellar/stellar-sdk/contract").ErrorMessage>>;
        get_total_received_from_others: (json: string) => AssembledTransaction<bigint>;
    };
}

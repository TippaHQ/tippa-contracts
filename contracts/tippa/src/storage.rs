use soroban_sdk::{contracttype, Address, Env, String};

pub const LEDGERS_PER_YEAR: u32 = 6_307_200;
pub const TTL_THRESHOLD: u32 = 518_400;
pub const MAX_RULES: u32 = 10;

/// 10 000 BPS = 100%. Allows fractional percentages (e.g. 3050 = 30.50%).
pub const BPS_BASE: u32 = 10_000;

#[contracttype]
#[derive(Clone)]
pub struct DonorKey {
    pub donor:    Address,
    pub username: String,
    pub asset:    Address,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner(String),
    Rules(String),
    Pool(String, Address),
    TotalReceived(String, Address),
    TotalReceivedFromOthers(String, Address),
    Unclaimed(String, Address),
    DonorToUser(DonorKey),
    DonorTotal(Address, Address),
    GrandTotal(Address),
    PaidTo(Address, Address),
}

pub fn storage_add(env: &Env, key: &DataKey, amount: i128) {
    let current: i128 = env.storage().persistent().get(key).unwrap_or(0);
    env.storage().persistent().set(key, &(current + amount));
    env.storage()
        .persistent()
        .extend_ttl(key, TTL_THRESHOLD, LEDGERS_PER_YEAR);
}

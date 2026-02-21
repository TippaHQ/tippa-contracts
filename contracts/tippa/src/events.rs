use soroban_sdk::{Address, Env, Map, String, Symbol};

pub fn emit_registered(env: &Env, username: &String, owner: &Address) {
    env.events().publish(
        (Symbol::new(env, "registered"), username.clone()),
        owner.clone(),
    );
}

pub fn emit_ownership_transferred(
    env: &Env,
    username: &String,
    old_owner: &Address,
    new_owner: &Address,
) {
    env.events().publish(
        (Symbol::new(env, "ownership_transferred"), username.clone()),
        (old_owner.clone(), new_owner.clone()),
    );
}

pub fn emit_rules_set(env: &Env, username: &String, rules: &Map<String, u32>) {
    env.events().publish(
        (Symbol::new(env, "rules_set"), username.clone()),
        rules.clone(),
    );
}

pub fn emit_donated(
    env: &Env,
    username: &String,
    donor: &Address,
    asset: &Address,
    amount: i128,
) {
    env.events().publish(
        (Symbol::new(env, "donated"), username.clone()),
        (donor.clone(), asset.clone(), amount),
    );
}

pub fn emit_distributed(env: &Env, username: &String, asset: &Address, pool_snapshot: i128) {
    env.events().publish(
        (Symbol::new(env, "distributed"), username.clone()),
        (asset.clone(), pool_snapshot),
    );
}

pub fn emit_claimed(
    env: &Env,
    username: &String,
    recipient: &Address,
    asset: &Address,
    amount: i128,
) {
    env.events().publish(
        (Symbol::new(env, "claimed"), username.clone()),
        (recipient.clone(), asset.clone(), amount),
    );
}

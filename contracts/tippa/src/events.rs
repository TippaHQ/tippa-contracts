use soroban_sdk::{Address, Env, Map, String, Symbol};

pub fn emit_project_registered(env: &Env, project_id: &String, owner: &Address) {
    env.events().publish(
        (Symbol::new(env, "project_registered"), project_id.clone()),
        owner.clone(),
    );
}

pub fn emit_ownership_transferred(
    env: &Env,
    project_id: &String,
    old_owner: &Address,
    new_owner: &Address,
) {
    env.events().publish(
        (Symbol::new(env, "ownership_transferred"), project_id.clone()),
        (old_owner.clone(), new_owner.clone()),
    );
}

pub fn emit_rules_set(env: &Env, project_id: &String, rules: &Map<String, u32>) {
    env.events().publish(
        (Symbol::new(env, "rules_set"), project_id.clone()),
        rules.clone(),
    );
}

pub fn emit_donated(
    env: &Env,
    project_id: &String,
    donor: &Address,
    asset: &Address,
    amount: i128,
) {
    env.events().publish(
        (Symbol::new(env, "donated"), project_id.clone()),
        (donor.clone(), asset.clone(), amount),
    );
}

pub fn emit_distributed(env: &Env, project_id: &String, asset: &Address, pool_snapshot: i128) {
    env.events().publish(
        (Symbol::new(env, "distributed"), project_id.clone()),
        (asset.clone(), pool_snapshot),
    );
}

pub fn emit_claimed(
    env: &Env,
    project_id: &String,
    recipient: &Address,
    asset: &Address,
    amount: i128,
) {
    env.events().publish(
        (Symbol::new(env, "claimed"), project_id.clone()),
        (recipient.clone(), asset.clone(), amount),
    );
}

pub fn emit_nickname_set(env: &Env, address: &Address, nickname: &String) {
    env.events().publish(
        (Symbol::new(env, "nickname_set"), address.clone()),
        nickname.clone(),
    );
}

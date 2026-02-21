#![cfg(test)]

use crate::contract::{CascadingDonations, CascadingDonationsClient};
use soroban_sdk::{
    testutils::Address as _,
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, Map, String,
};

fn setup() -> (Env, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CascadingDonations, ());
    let token_id = env.register_stellar_asset_contract(Address::generate(&env));

    (env, contract_id, token_id)
}

fn mint(env: &Env, token: &Address, to: &Address, amount: i128) {
    StellarAssetClient::new(env, token).mint(to, &amount);
}

fn client<'a>(env: &'a Env, id: &'a Address) -> CascadingDonationsClient<'a> {
    CascadingDonationsClient::new(env, id)
}

fn str(env: &Env, s: &str) -> String {
    String::from_str(env, s)
}

#[test]
fn test_register() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let username = str(&env, "alice");

    c.register(&owner, &username);
    assert_eq!(c.get_owner(&username), Some(owner));
}

#[test]
#[should_panic]
fn test_register_duplicate_fails() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let username = str(&env, "alice");

    c.register(&owner, &username);
    c.register(&owner, &username);
}

#[test]
fn test_set_rules() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let username = str(&env, "alice");
    let dep = str(&env, "bob");

    c.register(&owner, &username);
    c.register(&Address::generate(&env), &dep);

    let mut rules = Map::new(&env);
    rules.set(dep.clone(), 3000u32); // 30% in BPS
    c.set_rules(&owner, &username, &rules);

    let stored = c.get_rules(&username);
    assert_eq!(stored.get(dep).unwrap(), 3000);
}

#[test]
#[should_panic]
fn test_rules_exceed_max_fails() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let username = str(&env, "alice");
    c.register(&owner, &username);

    c.register(&Address::generate(&env), &str(&env, "bob"));
    c.register(&Address::generate(&env), &str(&env, "carol"));

    let mut rules = Map::new(&env);
    rules.set(str(&env, "bob"), 6000u32);   // 60% in BPS
    rules.set(str(&env, "carol"), 6000u32); // 60% — total 120%, exceeds max
    c.set_rules(&owner, &username, &rules);
}

#[test]
#[should_panic]
fn test_rules_unregistered_recipient_fails() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let username = str(&env, "alice");
    c.register(&owner, &username);

    let mut rules = Map::new(&env);
    rules.set(str(&env, "not_registered"), 3000u32);
    c.set_rules(&owner, &username, &rules);
}

#[test]
fn test_donate() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let username = str(&env, "alice");

    c.register(&owner, &username);
    mint(&env, &tok, &donor, 1_000);

    c.donate(&donor, &username, &tok, &1_000, &None);

    assert_eq!(c.get_pool(&username, &tok), 1_000);
    assert_eq!(c.get_total_received(&username, &tok), 1_000);
    assert_eq!(c.get_donor_to_user(&donor, &username, &tok), 1_000);
    assert_eq!(c.get_donor_total(&donor, &tok), 1_000);
    assert_eq!(c.get_grand_total(&tok), 1_000);
}

#[test]
fn test_distribute_no_rules_all_unclaimed() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let username = str(&env, "alice");

    c.register(&owner, &username);
    mint(&env, &tok, &donor, 1_000);
    c.donate(&donor, &username, &tok, &1_000, &None);

    c.distribute(&username, &tok, &0);

    assert_eq!(c.get_pool(&username, &tok), 0);
    assert_eq!(c.get_unclaimed(&username, &tok), 1_000);
}

#[test]
fn test_distribute_with_cascade() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    let donor  = Address::generate(&env);
    let user1 = str(&env, "alice");
    let user2 = str(&env, "bob");

    c.register(&owner1, &user1);
    c.register(&owner2, &user2);

    let mut rules = Map::new(&env);
    rules.set(user2.clone(), 4000u32); // 40% in BPS
    c.set_rules(&owner1, &user1, &rules);

    mint(&env, &tok, &donor, 1_000);
    c.donate(&donor, &user1, &tok, &1_000, &None);

    c.distribute(&user1, &tok, &0);

    assert_eq!(c.get_pool(&user1, &tok), 0);
    assert_eq!(c.get_unclaimed(&user1, &tok), 600);

    assert_eq!(c.get_pool(&user2, &tok), 400);
    assert_eq!(c.get_total_received(&user2, &tok), 400);
    assert_eq!(c.get_total_received_from_others(&user2, &tok), 400);
}

#[test]
fn test_claim() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let username = str(&env, "alice");

    c.register(&owner, &username);
    mint(&env, &tok, &donor, 1_000);
    c.donate(&donor, &username, &tok, &1_000, &None);
    c.distribute(&username, &tok, &0);

    let paid = c.claim(&owner, &username, &tok, &None);
    assert_eq!(paid, 1_000);

    let token_c = TokenClient::new(&env, &tok);
    assert_eq!(token_c.balance(&owner), 1_000);
    assert_eq!(c.get_unclaimed(&username, &tok), 0);
    assert_eq!(c.get_paid_to(&owner, &tok), 1_000);
}

#[test]
fn test_distribute_and_claim() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let username = str(&env, "alice");

    c.register(&owner, &username);
    mint(&env, &tok, &donor, 500);
    c.donate(&donor, &username, &tok, &500, &None);

    let paid = c.distribute_and_claim(&owner, &username, &tok, &None, &0);
    assert_eq!(paid, 500);
    assert_eq!(c.get_pool(&username, &tok), 0);
    assert_eq!(c.get_unclaimed(&username, &tok), 0);
}

#[test]
fn test_min_distribution_skips_dust() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    let donor = Address::generate(&env);
    let user1 = str(&env, "alice");
    let user2 = str(&env, "bob");

    c.register(&owner1, &user1);
    c.register(&owner2, &user2);

    // alice forwards 40% to bob
    let mut rules = Map::new(&env);
    rules.set(user2.clone(), 4000u32); // 40% in BPS
    c.set_rules(&owner1, &user1, &rules);

    // Donate 100 to alice
    mint(&env, &tok, &donor, 100);
    c.donate(&donor, &user1, &tok, &100, &None);

    // Distribute with min_distribution = 50
    // 40% of 100 = 40, which is below 50, so bob gets nothing
    c.distribute(&user1, &tok, &50);

    // Bob's pool should be 0 (share was below threshold)
    assert_eq!(c.get_pool(&user2, &tok), 0);
    // Owner keeps everything (100 instead of 60)
    assert_eq!(c.get_unclaimed(&user1, &tok), 100);
}

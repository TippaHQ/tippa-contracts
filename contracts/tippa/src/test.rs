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
fn test_register_project() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let pid = str(&env, "acme/my-lib");

    c.register_project(&owner, &pid);
    assert_eq!(c.get_owner(&pid), Some(owner));
}

#[test]
#[should_panic]
fn test_register_duplicate_fails() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let pid = str(&env, "acme/my-lib");

    c.register_project(&owner, &pid);
    c.register_project(&owner, &pid);
}

#[test]
fn test_set_rules() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let pid = str(&env, "acme/my-lib");
    let dep = str(&env, "deps/cool-lib");

    c.register_project(&owner, &pid);

    let mut rules = Map::new(&env);
    rules.set(dep.clone(), 3000u32); // 30% in BPS
    c.set_rules(&owner, &pid, &rules);

    let stored = c.get_rules(&pid);
    assert_eq!(stored.get(dep).unwrap(), 3000);
}

#[test]
#[should_panic]
fn test_rules_exceed_100_fails() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let pid = str(&env, "acme/my-lib");
    c.register_project(&owner, &pid);

    let mut rules = Map::new(&env);
    rules.set(str(&env, "a/b"), 6000u32); // 60% in BPS
    rules.set(str(&env, "c/d"), 6000u32); // 60% — total 120%, exceeds max
    c.set_rules(&owner, &pid, &rules);
}

#[test]
fn test_donate() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let pid = str(&env, "acme/my-lib");

    c.register_project(&owner, &pid);
    mint(&env, &tok, &donor, 1_000);

    c.donate(&donor, &pid, &tok, &1_000, &None);

    assert_eq!(c.get_pool(&pid, &tok), 1_000);
    assert_eq!(c.get_total_received(&pid, &tok), 1_000);
    assert_eq!(c.get_donor_to_project(&donor, &pid, &tok), 1_000);
    assert_eq!(c.get_donor_total(&donor, &tok), 1_000);
    assert_eq!(c.get_grand_total(&tok), 1_000);
}

#[test]
fn test_distribute_no_rules_all_unclaimed() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let pid = str(&env, "acme/my-lib");

    c.register_project(&owner, &pid);
    mint(&env, &tok, &donor, 1_000);
    c.donate(&donor, &pid, &tok, &1_000, &None);

    c.distribute(&pid, &tok);

    assert_eq!(c.get_pool(&pid, &tok), 0);
    assert_eq!(c.get_unclaimed(&pid, &tok), 1_000);
}

#[test]
fn test_distribute_with_cascade() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    let donor  = Address::generate(&env);
    let pid1 = str(&env, "acme/parent");
    let pid2 = str(&env, "deps/child");

    c.register_project(&owner1, &pid1);
    c.register_project(&owner2, &pid2);

    let mut rules = Map::new(&env);
    rules.set(pid2.clone(), 4000u32); // 40% in BPS
    c.set_rules(&owner1, &pid1, &rules);

    mint(&env, &tok, &donor, 1_000);
    c.donate(&donor, &pid1, &tok, &1_000, &None);

    c.distribute(&pid1, &tok);

    assert_eq!(c.get_pool(&pid1, &tok), 0);
    assert_eq!(c.get_unclaimed(&pid1, &tok), 600);

    assert_eq!(c.get_pool(&pid2, &tok), 400);
    assert_eq!(c.get_total_received(&pid2, &tok), 400);
    assert_eq!(c.get_total_received_from_projects(&pid2, &tok), 400);
}

#[test]
fn test_claim() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let pid   = str(&env, "acme/my-lib");

    c.register_project(&owner, &pid);
    mint(&env, &tok, &donor, 1_000);
    c.donate(&donor, &pid, &tok, &1_000, &None);
    c.distribute(&pid, &tok);

    let paid = c.claim(&owner, &pid, &tok, &None);
    assert_eq!(paid, 1_000);

    let token_c = TokenClient::new(&env, &tok);
    assert_eq!(token_c.balance(&owner), 1_000);
    assert_eq!(c.get_unclaimed(&pid, &tok), 0);
    assert_eq!(c.get_paid_to(&owner, &tok), 1_000);
}

#[test]
fn test_distribute_and_claim() {
    let (env, cid, tok) = setup();
    let c = client(&env, &cid);
    let owner = Address::generate(&env);
    let donor = Address::generate(&env);
    let pid   = str(&env, "acme/my-lib");

    c.register_project(&owner, &pid);
    mint(&env, &tok, &donor, 500);
    c.donate(&donor, &pid, &tok, &500, &None);

    let paid = c.distribute_and_claim(&owner, &pid, &tok, &None);
    assert_eq!(paid, 500);
    assert_eq!(c.get_pool(&pid, &tok), 0);
    assert_eq!(c.get_unclaimed(&pid, &tok), 0);
}

#[test]
fn test_set_nickname() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let user = Address::generate(&env);
    let nick = str(&env, "alice");

    c.set_nickname(&user, &nick);
    assert_eq!(c.get_nickname(&user), Some(nick.clone()));
    assert_eq!(c.get_nickname_owner(&nick), Some(user));
}

#[test]
fn test_nickname_change_releases_old() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let user = Address::generate(&env);

    c.set_nickname(&user, &str(&env, "alice"));
    c.set_nickname(&user, &str(&env, "bob"));

    assert_eq!(c.get_nickname_owner(&str(&env, "alice")), None);
    assert_eq!(c.get_nickname(&user), Some(str(&env, "bob")));
}

#[test]
#[should_panic]
fn test_nickname_collision_fails() {
    let (env, cid, _tok) = setup();
    let c = client(&env, &cid);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let nick = str(&env, "alice");

    c.set_nickname(&user1, &nick);
    c.set_nickname(&user2, &nick);
}

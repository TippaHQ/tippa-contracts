use soroban_sdk::{contract, contractimpl, token, Address, Env, Map, String};

use crate::errors::Error;
use crate::events::{
    emit_claimed, emit_distributed, emit_donated, emit_ownership_transferred, emit_registered,
    emit_rules_set,
};
use crate::storage::{
    storage_add, DataKey, DonorKey, BPS_BASE, LEDGERS_PER_YEAR, MAX_RULES, TTL_THRESHOLD,
};

#[contract]
pub struct CascadingDonations;

#[contractimpl]
impl CascadingDonations {
    pub fn register(
        env: Env,
        caller: Address,
        username: String,
    ) -> Result<(), Error> {
        caller.require_auth();

        let owner_key = DataKey::Owner(username.clone());
        if env.storage().persistent().has(&owner_key) {
            return Err(Error::UsernameAlreadyTaken);
        }

        env.storage().persistent().set(&owner_key, &caller);
        env.storage()
            .persistent()
            .extend_ttl(&owner_key, TTL_THRESHOLD, LEDGERS_PER_YEAR);

        let rules_key = DataKey::Rules(username.clone());
        env.storage()
            .persistent()
            .set(&rules_key, &Map::<String, u32>::new(&env));
        env.storage()
            .persistent()
            .extend_ttl(&rules_key, TTL_THRESHOLD, LEDGERS_PER_YEAR);

        emit_registered(&env, &username, &caller);
        Ok(())
    }

    pub fn transfer_ownership(
        env: Env,
        caller: Address,
        username: String,
        new_owner: Address,
    ) -> Result<(), Error> {
        caller.require_auth();
        Self::assert_owner(&env, &caller, &username)?;

        let owner_key = DataKey::Owner(username.clone());
        env.storage().persistent().set(&owner_key, &new_owner);
        env.storage()
            .persistent()
            .extend_ttl(&owner_key, TTL_THRESHOLD, LEDGERS_PER_YEAR);

        emit_ownership_transferred(&env, &username, &caller, &new_owner);
        Ok(())
    }

    pub fn set_rules(
        env: Env,
        caller: Address,
        username: String,
        rules: Map<String, u32>,
    ) -> Result<(), Error> {
        caller.require_auth();
        Self::assert_owner(&env, &caller, &username)?;
        Self::validate_rules(&env, &rules, &username)?;

        let rules_key = DataKey::Rules(username.clone());
        env.storage().persistent().set(&rules_key, &rules);
        env.storage()
            .persistent()
            .extend_ttl(&rules_key, TTL_THRESHOLD, LEDGERS_PER_YEAR);

        emit_rules_set(&env, &username, &rules);
        Ok(())
    }

    pub fn donate(
        env: Env,
        caller: Address,
        username: String,
        asset: Address,
        amount: i128,
        donor_override: Option<Address>,
    ) -> Result<(), Error> {
        caller.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        if !env
            .storage()
            .persistent()
            .has(&DataKey::Owner(username.clone()))
        {
            return Err(Error::UserNotFound);
        }

        let donor = donor_override.unwrap_or(caller.clone());

        token::Client::new(&env, &asset).transfer(
            &caller,
            &env.current_contract_address(),
            &amount,
        );

        storage_add(&env, &DataKey::Pool(username.clone(), asset.clone()), amount);
        storage_add(
            &env,
            &DataKey::TotalReceived(username.clone(), asset.clone()),
            amount,
        );
        storage_add(
            &env,
            &DataKey::DonorToUser(DonorKey {
                donor: donor.clone(),
                username: username.clone(),
                asset: asset.clone(),
            }),
            amount,
        );
        storage_add(&env, &DataKey::DonorTotal(donor.clone(), asset.clone()), amount);
        storage_add(&env, &DataKey::GrandTotal(asset.clone()), amount);

        emit_donated(&env, &username, &donor, &asset, amount);
        Ok(())
    }

    /// `min_distribution`: smallest amount worth forwarding (in token stroops).
    /// Shares below this threshold stay with the owner instead of cascading.
    /// Pass 0 to disable the threshold.
    pub fn distribute(env: Env, username: String, asset: Address, min_distribution: i128) -> Result<(), Error> {
        Self::distribute_internal(&env, &username, &asset, min_distribution)
    }

    pub fn claim(
        env: Env,
        caller: Address,
        username: String,
        asset: Address,
        to: Option<Address>,
    ) -> Result<i128, Error> {
        caller.require_auth();
        Self::assert_owner(&env, &caller, &username)?;
        Self::do_claim(&env, &caller, &username, &asset, to)
    }

    pub fn distribute_and_claim(
        env: Env,
        caller: Address,
        username: String,
        asset: Address,
        to: Option<Address>,
        min_distribution: i128,
    ) -> Result<i128, Error> {
        caller.require_auth();
        Self::assert_owner(&env, &caller, &username)?;

        Self::distribute_internal(&env, &username, &asset, min_distribution)?;

        let unclaimed_key = DataKey::Unclaimed(username.clone(), asset.clone());
        let unclaimed: i128 = env
            .storage()
            .persistent()
            .get(&unclaimed_key)
            .unwrap_or(0);

        if unclaimed == 0 {
            return Ok(0);
        }

        Self::do_claim(&env, &caller, &username, &asset, to)
    }

    pub fn get_pool(env: Env, username: String, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Pool(username, asset))
            .unwrap_or(0)
    }

    pub fn get_rules(env: Env, username: String) -> Map<String, u32> {
        env.storage()
            .persistent()
            .get(&DataKey::Rules(username))
            .unwrap_or(Map::new(&env))
    }

    pub fn get_owner(env: Env, username: String) -> Option<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::Owner(username))
    }

    pub fn get_total_received(env: Env, username: String, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalReceived(username, asset))
            .unwrap_or(0)
    }

    pub fn get_total_received_from_others(
        env: Env,
        username: String,
        asset: Address,
    ) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalReceivedFromOthers(username, asset))
            .unwrap_or(0)
    }

    pub fn get_total_forwarded(env: Env, username: String, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalForwarded(username, asset))
            .unwrap_or(0)
    }

    pub fn get_unclaimed(env: Env, username: String, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Unclaimed(username, asset))
            .unwrap_or(0)
    }

    pub fn get_donor_to_user(
        env: Env,
        donor: Address,
        username: String,
        asset: Address,
    ) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::DonorToUser(DonorKey {
                donor,
                username,
                asset,
            }))
            .unwrap_or(0)
    }

    pub fn get_donor_total(env: Env, donor: Address, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::DonorTotal(donor, asset))
            .unwrap_or(0)
    }

    pub fn get_grand_total(env: Env, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::GrandTotal(asset))
            .unwrap_or(0)
    }

    pub fn get_paid_to(env: Env, address: Address, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::PaidTo(address, asset))
            .unwrap_or(0)
    }

    fn distribute_internal(
        env: &Env,
        username: &String,
        asset: &Address,
        min_distribution: i128,
    ) -> Result<(), Error> {
        if !env
            .storage()
            .persistent()
            .has(&DataKey::Owner(username.clone()))
        {
            return Err(Error::UserNotFound);
        }

        let rules: Map<String, u32> = env
            .storage()
            .persistent()
            .get(&DataKey::Rules(username.clone()))
            .ok_or(Error::RulesNotSet)?;

        let pool_key = DataKey::Pool(username.clone(), asset.clone());
        let pool: i128 = env.storage().persistent().get(&pool_key).unwrap_or(0);

        if pool == 0 {
            return Err(Error::NothingToDistribute);
        }

        let mut total_shared: i128 = 0;
        let keys = rules.keys();

        for i in 0..keys.len() {
            let recipient = keys.get(i).unwrap();
            let pct = rules.get(recipient.clone()).unwrap() as i128;
            let share = pool * pct / (BPS_BASE as i128);

            if share < min_distribution {
                continue;
            }
            total_shared += share;

            storage_add(env, &DataKey::Pool(recipient.clone(), asset.clone()), share);
            storage_add(
                env,
                &DataKey::TotalReceived(recipient.clone(), asset.clone()),
                share,
            );
            storage_add(
                env,
                &DataKey::TotalReceivedFromOthers(recipient.clone(), asset.clone()),
                share,
            );
        }

        if total_shared > 0 {
            storage_add(
                env,
                &DataKey::TotalForwarded(username.clone(), asset.clone()),
                total_shared,
            );
        }

        let owner_share = pool - total_shared;
        if owner_share > 0 {
            storage_add(
                env,
                &DataKey::Unclaimed(username.clone(), asset.clone()),
                owner_share,
            );
        }

        env.storage().persistent().set(&pool_key, &0i128);

        emit_distributed(env, username, asset, pool);
        Ok(())
    }

    fn do_claim(
        env: &Env,
        caller: &Address,
        username: &String,
        asset: &Address,
        to: Option<Address>,
    ) -> Result<i128, Error> {
        let unclaimed_key = DataKey::Unclaimed(username.clone(), asset.clone());
        let unclaimed: i128 = env
            .storage()
            .persistent()
            .get(&unclaimed_key)
            .unwrap_or(0);

        if unclaimed == 0 {
            return Err(Error::NothingToDistribute);
        }

        let recipient = to.unwrap_or(caller.clone());

        token::Client::new(env, asset).transfer(
            &env.current_contract_address(),
            &recipient,
            &unclaimed,
        );

        storage_add(env, &DataKey::PaidTo(recipient.clone(), asset.clone()), unclaimed);
        env.storage().persistent().set(&unclaimed_key, &0i128);

        emit_claimed(env, username, &recipient, asset, unclaimed);
        Ok(unclaimed)
    }

    fn assert_owner(env: &Env, caller: &Address, username: &String) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Owner(username.clone()))
            .ok_or(Error::UserNotFound)?;

        if owner != *caller {
            return Err(Error::NotOwner);
        }
        Ok(())
    }

    fn validate_rules(env: &Env, rules: &Map<String, u32>, own_username: &String) -> Result<(), Error> {
        if rules.len() > MAX_RULES {
            return Err(Error::TooManyRules);
        }

        let mut total: u32 = 0;
        let keys = rules.keys();

        for i in 0..keys.len() {
            let key = keys.get(i).unwrap();

            if key == *own_username {
                return Err(Error::SelfReference);
            }

            if !env.storage().persistent().has(&DataKey::Owner(key.clone())) {
                return Err(Error::RecipientNotRegistered);
            }

            let pct = rules.get(key).unwrap();
            if pct == 0 || pct > BPS_BASE {
                return Err(Error::InvalidPercentage);
            }

            total = total.saturating_add(pct);
            if total > BPS_BASE {
                return Err(Error::RulesTotalExceedsMax);
            }
        }
        Ok(())
    }
}

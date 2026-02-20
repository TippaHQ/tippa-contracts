use soroban_sdk::{contract, contractimpl, token, Address, Env, Map, String};

use crate::errors::Error;
use crate::events::{
    emit_claimed, emit_distributed, emit_donated, emit_nickname_set,
    emit_ownership_transferred, emit_project_registered, emit_rules_set,
};
use crate::storage::{
    storage_add, DataKey, DonorProjectKey, BPS_BASE, LEDGERS_PER_YEAR, MAX_RULES, TTL_THRESHOLD,
};

#[contract]
pub struct CascadingDonations;

#[contractimpl]
impl CascadingDonations {
    pub fn register_project(
        env: Env,
        caller: Address,
        project_id: String,
    ) -> Result<(), Error> {
        caller.require_auth();

        let owner_key = DataKey::Owner(project_id.clone());
        if env.storage().persistent().has(&owner_key) {
            return Err(Error::ProjectAlreadyExists);
        }

        env.storage().persistent().set(&owner_key, &caller);
        env.storage()
            .persistent()
            .extend_ttl(&owner_key, TTL_THRESHOLD, LEDGERS_PER_YEAR);

        let rules_key = DataKey::Rules(project_id.clone());
        env.storage()
            .persistent()
            .set(&rules_key, &Map::<String, u32>::new(&env));
        env.storage()
            .persistent()
            .extend_ttl(&rules_key, TTL_THRESHOLD, LEDGERS_PER_YEAR);

        emit_project_registered(&env, &project_id, &caller);
        Ok(())
    }

    pub fn transfer_ownership(
        env: Env,
        caller: Address,
        project_id: String,
        new_owner: Address,
    ) -> Result<(), Error> {
        caller.require_auth();
        Self::assert_owner(&env, &caller, &project_id)?;

        let owner_key = DataKey::Owner(project_id.clone());
        env.storage().persistent().set(&owner_key, &new_owner);
        env.storage()
            .persistent()
            .extend_ttl(&owner_key, TTL_THRESHOLD, LEDGERS_PER_YEAR);

        emit_ownership_transferred(&env, &project_id, &caller, &new_owner);
        Ok(())
    }

    pub fn set_rules(
        env: Env,
        caller: Address,
        project_id: String,
        rules: Map<String, u32>,
    ) -> Result<(), Error> {
        caller.require_auth();
        Self::assert_owner(&env, &caller, &project_id)?;
        Self::validate_rules(&rules, &project_id)?;

        let rules_key = DataKey::Rules(project_id.clone());
        env.storage().persistent().set(&rules_key, &rules);
        env.storage()
            .persistent()
            .extend_ttl(&rules_key, TTL_THRESHOLD, LEDGERS_PER_YEAR);

        emit_rules_set(&env, &project_id, &rules);
        Ok(())
    }

    pub fn donate(
        env: Env,
        caller: Address,
        project_id: String,
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
            .has(&DataKey::Owner(project_id.clone()))
        {
            return Err(Error::ProjectNotFound);
        }

        let donor = donor_override.unwrap_or(caller.clone());

        token::Client::new(&env, &asset).transfer(
            &caller,
            &env.current_contract_address(),
            &amount,
        );

        storage_add(&env, &DataKey::Pool(project_id.clone(), asset.clone()), amount);
        storage_add(
            &env,
            &DataKey::TotalReceived(project_id.clone(), asset.clone()),
            amount,
        );
        storage_add(
            &env,
            &DataKey::DonorToProject(DonorProjectKey {
                donor: donor.clone(),
                project: project_id.clone(),
                asset: asset.clone(),
            }),
            amount,
        );
        storage_add(&env, &DataKey::DonorTotal(donor.clone(), asset.clone()), amount);
        storage_add(&env, &DataKey::GrandTotal(asset.clone()), amount);

        emit_donated(&env, &project_id, &donor, &asset, amount);
        Ok(())
    }

    pub fn distribute(env: Env, project_id: String, asset: Address) -> Result<(), Error> {
        Self::distribute_internal(&env, &project_id, &asset)
    }

    pub fn claim(
        env: Env,
        caller: Address,
        project_id: String,
        asset: Address,
        to: Option<Address>,
    ) -> Result<i128, Error> {
        caller.require_auth();
        Self::assert_owner(&env, &caller, &project_id)?;
        Self::do_claim(&env, &caller, &project_id, &asset, to)
    }

    pub fn distribute_and_claim(
        env: Env,
        caller: Address,
        project_id: String,
        asset: Address,
        to: Option<Address>,
    ) -> Result<i128, Error> {
        caller.require_auth();
        Self::assert_owner(&env, &caller, &project_id)?;

        Self::distribute_internal(&env, &project_id, &asset)?;

        let unclaimed_key = DataKey::Unclaimed(project_id.clone(), asset.clone());
        let unclaimed: i128 = env
            .storage()
            .persistent()
            .get(&unclaimed_key)
            .unwrap_or(0);

        if unclaimed == 0 {
            return Ok(0);
        }

        Self::do_claim(&env, &caller, &project_id, &asset, to)
    }

    pub fn set_nickname(env: Env, caller: Address, nickname: String) -> Result<(), Error> {
        caller.require_auth();

        let owner_key = DataKey::NicknameOwner(nickname.clone());
        if env.storage().persistent().has(&owner_key) {
            return Err(Error::NicknameAlreadyTaken);
        }

        let nick_key = DataKey::Nickname(caller.clone());
        if let Some(old) = env
            .storage()
            .persistent()
            .get::<DataKey, String>(&nick_key)
        {
            env.storage()
                .persistent()
                .remove(&DataKey::NicknameOwner(old));
        }

        env.storage().persistent().set(&nick_key, &nickname);
        env.storage()
            .persistent()
            .extend_ttl(&nick_key, TTL_THRESHOLD, LEDGERS_PER_YEAR);
        env.storage().persistent().set(&owner_key, &caller);
        env.storage()
            .persistent()
            .extend_ttl(&owner_key, TTL_THRESHOLD, LEDGERS_PER_YEAR);

        emit_nickname_set(&env, &caller, &nickname);
        Ok(())
    }

    pub fn get_pool(env: Env, project_id: String, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Pool(project_id, asset))
            .unwrap_or(0)
    }

    pub fn get_rules(env: Env, project_id: String) -> Map<String, u32> {
        env.storage()
            .persistent()
            .get(&DataKey::Rules(project_id))
            .unwrap_or(Map::new(&env))
    }

    pub fn get_owner(env: Env, project_id: String) -> Option<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::Owner(project_id))
    }

    pub fn get_total_received(env: Env, project_id: String, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalReceived(project_id, asset))
            .unwrap_or(0)
    }

    pub fn get_total_received_from_projects(
        env: Env,
        project_id: String,
        asset: Address,
    ) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalReceivedFromProjects(project_id, asset))
            .unwrap_or(0)
    }

    pub fn get_unclaimed(env: Env, project_id: String, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Unclaimed(project_id, asset))
            .unwrap_or(0)
    }

    pub fn get_donor_to_project(
        env: Env,
        donor: Address,
        project_id: String,
        asset: Address,
    ) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::DonorToProject(DonorProjectKey {
                donor,
                project: project_id,
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

    pub fn get_nickname(env: Env, address: Address) -> Option<String> {
        env.storage()
            .persistent()
            .get(&DataKey::Nickname(address))
    }

    pub fn get_nickname_owner(env: Env, nickname: String) -> Option<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::NicknameOwner(nickname))
    }

    fn distribute_internal(
        env: &Env,
        project_id: &String,
        asset: &Address,
    ) -> Result<(), Error> {
        if !env
            .storage()
            .persistent()
            .has(&DataKey::Owner(project_id.clone()))
        {
            return Err(Error::ProjectNotFound);
        }

        let rules: Map<String, u32> = env
            .storage()
            .persistent()
            .get(&DataKey::Rules(project_id.clone()))
            .ok_or(Error::RulesNotSet)?;

        let pool_key = DataKey::Pool(project_id.clone(), asset.clone());
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

            if share == 0 {
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
                &DataKey::TotalReceivedFromProjects(recipient.clone(), asset.clone()),
                share,
            );
        }

        let owner_share = pool - total_shared;
        if owner_share > 0 {
            storage_add(
                env,
                &DataKey::Unclaimed(project_id.clone(), asset.clone()),
                owner_share,
            );
        }

        env.storage().persistent().set(&pool_key, &0i128);

        emit_distributed(env, project_id, asset, pool);
        Ok(())
    }

    fn do_claim(
        env: &Env,
        caller: &Address,
        project_id: &String,
        asset: &Address,
        to: Option<Address>,
    ) -> Result<i128, Error> {
        let unclaimed_key = DataKey::Unclaimed(project_id.clone(), asset.clone());
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

        emit_claimed(env, project_id, &recipient, asset, unclaimed);
        Ok(unclaimed)
    }

    fn assert_owner(env: &Env, caller: &Address, project_id: &String) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Owner(project_id.clone()))
            .ok_or(Error::ProjectNotFound)?;

        if owner != *caller {
            return Err(Error::NotOwner);
        }
        Ok(())
    }

    fn validate_rules(rules: &Map<String, u32>, own_project: &String) -> Result<(), Error> {
        if rules.len() > MAX_RULES {
            return Err(Error::TooManyRules);
        }

        let mut total: u32 = 0;
        let keys = rules.keys();

        for i in 0..keys.len() {
            let key = keys.get(i).unwrap();

            if key == *own_project {
                return Err(Error::SelfReference);
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

<p align="center">
  <h1 align="center">Tippa</h1>
  <p align="center">
    <strong>Cascading donations on Stellar</strong>
  </p>
  <p align="center">
    Donate to any project. Watch it ripple through every dependency they care about.
  </p>
</p>

<p align="center">
  <a href="https://stellar.org"><img src="https://img.shields.io/badge/Stellar-Soroban-7B36ED?style=flat-square&logo=stellar" alt="Stellar"></a>
  <a href="https://www.rust-lang.org"><img src="https://img.shields.io/badge/Rust-1.80+-orange?style=flat-square&logo=rust" alt="Rust"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"></a>
</p>

---

## How It Works

Tippa lets anyone donate to a project using **any Stellar token**. Project owners configure **distribution rules** that automatically forward a percentage of every donation to their dependencies, inspirations, or causes they support. Those projects can set their own rules too, creating a **cascade** of funding that flows through the entire ecosystem.

```
                          donate 1000 XLM
                               |
                        [ acme/my-app ]
                         rules: 40% ->
                               |
                    +----------+----------+
                    |                     |
              600 XLM (owner)      400 XLM (pool)
                                         |
                                  [ deps/cool-lib ]
                                   rules: 20% ->
                                         |
                              +----------+----------+
                              |                     |
                        320 XLM (owner)       80 XLM (pool)
                                                    |
                                             [ org/foundation ]
```

A single donation creates impact across the entire dependency tree. No recursive on-chain calls. Each project distributes independently at their own pace.

## Key Concepts

**Projects** are registered on-chain with a unique string ID (e.g. `"acme/my-app"` or `"save-the-ocean"`). Not limited to code repos -- organizations, charities, foundations, and individuals all work.

**Rules** define how donations cascade. Each rule maps a recipient project ID to a percentage in [basis points](https://en.wikipedia.org/wiki/Basis_point) (BPS), where `10000 BPS = 100%`. A rule of `5025` means `50.25%`. Up to 10 downstream recipients. The remainder always goes to the project owner.

**Lazy cascade** means distribution is not recursive. When you call `distribute`, downstream shares are deposited into each recipient's pool. Those recipients distribute on their own schedule, keeping gas costs predictable.

**Multi-asset** support means pools track balances per token. A project can receive XLM, USDC, and any other Stellar asset simultaneously.

## Smart Contract Functions

### Project Management

#### `register_project(caller, project_id)`
Register a new project. The caller becomes the owner. The `project_id` must be globally unique. Rules default to empty (owner keeps 100%).

#### `transfer_ownership(caller, project_id, new_owner)`
Transfer project ownership to a new address. Only the current owner can call this.

#### `set_rules(caller, project_id, rules)`
Set or replace the cascade distribution rules. `rules` is a map of `{ recipient_project_id: bps_percentage }`. Constraints:
- Max 10 recipients
- Each percentage: 1 -- 10000 BPS
- Total must not exceed 10000 BPS (100%)
- Cannot reference own project
- Recipient projects must be registered first (prevents fund theft)

### Donations

#### `donate(caller, project_id, asset, amount, donor_override)`
Donate `amount` of `asset` tokens to a project. Tokens are transferred from the caller into the contract's pool. The project does not need rules set yet -- funds accumulate until distributed.

`donor_override` optionally attributes the donation to a different address for leaderboard/analytics purposes while the token transfer still originates from the caller.

### Distribution

#### `distribute(project_id, asset, min_distribution)`
**Permissionless.** Anyone can trigger distribution for any project at any time. For each downstream recipient with percentage `p`:

```
share = floor(pool * p / 10000)
```

If `share < min_distribution`, that recipient is skipped and the amount stays with the owner. This prevents dust from cascading through the chain -- for example, a $1 USDC donation with 50% rules would stop cascading after ~7 hops when shares drop below a penny.

Pass `0` to disable the threshold (all shares forwarded regardless of size).

The owner's remainder (`pool - total_shared`) moves to `unclaimed`. The pool resets to zero.

#### `claim(caller, project_id, asset, to)`
Withdraw the owner's accumulated unclaimed balance. Only the project owner can call this. `to` defaults to the caller if omitted. Returns the amount transferred.

#### `distribute_and_claim(caller, project_id, asset, to, min_distribution)`
Atomically distribute then claim in a single transaction. Convenience function for owners who want to do both at once. Same `min_distribution` threshold as `distribute`.

### Nicknames

#### `set_nickname(caller, nickname)`
Assign a unique display nickname to an address (for donor leaderboards). Each address can hold one nickname. Setting a new one releases the old one. Nicknames are globally unique.

### Read-Only Getters

| Function | Returns |
|----------|---------|
| `get_pool(project_id, asset)` | Undistributed pool balance |
| `get_rules(project_id)` | Current distribution rules map |
| `get_owner(project_id)` | Owner address (or None) |
| `get_total_received(project_id, asset)` | Lifetime total received (direct + cascaded) |
| `get_total_received_from_projects(project_id, asset)` | Portion received via cascade from other projects |
| `get_unclaimed(project_id, asset)` | Owner's claimable balance |
| `get_donor_to_project(donor, project_id, asset)` | How much a specific donor gave to a project |
| `get_donor_total(donor, asset)` | Total donated by an address across all projects |
| `get_grand_total(asset)` | Platform-wide total donated in an asset |
| `get_paid_to(address, asset)` | Total tokens ever withdrawn by an address |
| `get_nickname(address)` | Display nickname for an address |
| `get_nickname_owner(nickname)` | Address that owns a nickname |

## Events

The contract emits events for all state-changing operations:

| Event | Topics | Data |
|-------|--------|------|
| `project_registered` | `(symbol, project_id)` | `owner` |
| `ownership_transferred` | `(symbol, project_id)` | `(old_owner, new_owner)` |
| `rules_set` | `(symbol, project_id)` | `rules` |
| `donated` | `(symbol, project_id)` | `(donor, asset, amount)` |
| `distributed` | `(symbol, project_id)` | `(asset, pool_snapshot)` |
| `claimed` | `(symbol, project_id)` | `(recipient, asset, amount)` |
| `nickname_set` | `(symbol, address)` | `nickname` |

## Error Codes

| Code | Name | Meaning |
|------|------|---------|
| 1 | `ProjectNotFound` | No project registered under this ID |
| 2 | `NotOwner` | Caller is not the project owner |
| 3 | `TooManyRules` | More than 10 recipients in rules |
| 4 | `RulesTotalExceedsMax` | Sum of BPS percentages exceeds 10000 |
| 5 | `SelfReference` | A rule references the project itself |
| 6 | `InvalidPercentage` | A percentage is 0 or > 10000 BPS |
| 7 | `NothingToDistribute` | Pool and unclaimed balance are both empty |
| 8 | `NicknameAlreadyTaken` | Nickname claimed by another address |
| 9 | `InvalidAmount` | Donation amount must be > 0 |
| 10 | `ProjectAlreadyExists` | A project with this ID is already registered |
| 11 | `RulesNotSet` | Rules have not been configured yet |
| 12 | `RecipientNotRegistered` | A rule references a project that is not registered |

## Project Structure

```
contracts/tippa/src/
  lib.rs          -- Module declarations
  contract.rs     -- Contract entry points and business logic
  storage.rs      -- Storage keys, constants, helpers
  errors.rs       -- Error enum (stable u32 codes)
  events.rs       -- Event emission functions
  test.rs         -- Unit tests
```

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (1.80+)
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli) (25+)

### Build

```bash
stellar contract build
```

### Test

```bash
cargo test -p tippa
```

### Run a single test

```bash
cargo test -p tippa test_distribute_with_cascade
```

## License

[MIT](LICENSE)

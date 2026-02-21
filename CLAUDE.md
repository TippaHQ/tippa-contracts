# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Tippa is a cascading donations smart contract on Stellar/Soroban. Users register a username, set distribution rules (in basis points), and receive donations in any Stellar token. When distributed, funds cascade to downstream users per the rules; the remainder accrues to the owner.

## Commands

```bash
# Build WASM (from repo root)
stellar contract build

# Run all tests
cargo test -p tippa

# Run a single test
cargo test -p tippa test_distribute_with_cascade

# Format
cargo fmt --all

# Build + test via Makefile
make -C contracts/tippa        # build
make -C contracts/tippa test   # test
```

## Architecture

Workspace with one contract crate at `contracts/tippa/`. `lib.rs` is a thin orchestrator — all logic lives in modules:

| File | Responsibility |
|------|---------------|
| `contract.rs` | `#[contract]` struct + all public entry points (7 write, 10 getters) and private helpers |
| `storage.rs` | `DataKey` enum (10 variants), `DonorKey`, TTL constants, `storage_add` helper |
| `errors.rs` | `Error` enum with stable `repr(u32)` codes |
| `events.rs` | `emit_*` functions wrapping `env.events().publish()` |
| `test.rs` | Unit tests using `mock_all_auths()` and SAC token minting |

## Key Patterns

- **BPS rules**: Distribution percentages are in basis points (10000 = 100%). Validated in `validate_rules`, applied in `distribute_internal` with integer floor division — remainder always goes to the owner.
- **Lazy cascade**: `distribute` moves shares into downstream users' `Pool` storage. Each user distributes independently — no recursive on-chain calls.
- **Storage TTL**: Every persistent write extends TTL via `storage_add()`. Constants: `TTL_THRESHOLD = 518_400` (~30 days), `LEDGERS_PER_YEAR = 6_307_200`.
- **Auth**: Write methods take `caller: Address` and call `caller.require_auth()`. Owner-only methods additionally call `assert_owner()`.
- **Error codes are stable**: Once assigned, `repr(u32)` values must never change (they're part of the on-chain ABI).

## Contract Entry Points

**Write**: `register`, `transfer_ownership`, `set_rules`, `donate`, `distribute`, `claim`, `distribute_and_claim`

**Permissionless**: `distribute` — anyone can trigger distribution for any user.

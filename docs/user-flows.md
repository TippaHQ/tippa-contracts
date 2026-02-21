# Tippa User Flows

This document describes the end-to-end user flows for interacting with the Tippa cascading donations contract. Each flow specifies the contract functions called, who signs, and what happens on-chain.

---

## 1. Register a Username

A user registers their username on-chain to start receiving donations.

| Step | Function | Signer | Description |
|------|----------|--------|-------------|
| 1 | `register(caller, username)` | User | Creates the account with a unique username. Owner is recorded. Empty rules are initialized (owner keeps 100%). |

**Prerequisites:** None. The `username` must be globally unique.

**Example:**
```
Alice registers "alice"
→ Alice signs
→ Account created, Alice is owner
```

---

## 2. Configure Cascade Rules

An owner defines how donations should be split across downstream users.

| Step | Function | Signer | Description |
|------|----------|--------|-------------|
| 1 | `set_rules(caller, username, rules)` | Owner | Sets the distribution map. Each entry is `{ recipient_username: bps }`. |

**Prerequisites:**
- Username must be registered (by the caller).
- All recipient usernames must already be registered.

**Constraints:**
- Max 10 recipients
- Each percentage: 1 -- 10000 BPS
- Total BPS must not exceed 10000 (100%)
- Cannot reference own username

**Example:**
```
Alice sets rules for "alice":
  "bob"   → 3000 BPS (30%)
  "carol" → 2000 BPS (20%)

→ Alice signs
→ 50% will cascade, Alice keeps the remaining 50%
```

---

## 3. Donate to a User

A donor sends tokens to a user. Funds are held in the user's pool until distributed.

| Step | Function | Signer | Description |
|------|----------|--------|-------------|
| 1 | `donate(caller, username, asset, amount, donor_override)` | Donor | Transfers `amount` of `asset` from the donor into the contract's pool for the specified user. |

**Prerequisites:**
- Username must be registered.
- Donor must have sufficient token balance and have approved the transfer.

**Notes:**
- `donor_override` is optional. If set, the donation is attributed to a different address for leaderboard/analytics purposes, but the tokens still come from the signer.
- The user does not need rules set yet. Funds accumulate until distribution.

**Example:**
```
Dave donates 1000 USDC to "alice"
→ Dave signs
→ 1000 USDC transferred from Dave to contract
→ Pool("alice", USDC) = 1000
→ Analytics updated (donor totals, grand total, etc.)
```

---

## 4. Distribute a User's Pool

Anyone triggers the cascade distribution for a user. This is permissionless.

| Step | Function | Signer | Description |
|------|----------|--------|-------------|
| 1 | `distribute(username, asset, min_distribution)` | Anyone | Splits the pool according to the user's rules. Downstream shares go to recipient pools. Owner's remainder goes to `unclaimed`. |

**Prerequisites:**
- Username must be registered.
- Rules must be set (even empty rules work — owner keeps 100%).
- Pool must have a non-zero balance.

**What happens on-chain:**
```
Pool = 1000 USDC
Rules: "bob" → 3000 BPS, "carol" → 2000 BPS

distribute("alice", USDC, 100000)
                          ↑ min_distribution = $0.01 USDC (100000 stroops)

→ bob pool       += 300 USDC  (floor(1000 * 3000 / 10000))
→ carol pool     += 200 USDC  (floor(1000 * 2000 / 10000))
→ alice unclaimed += 500 USDC  (remainder)
→ alice pool      = 0
```

**Dust protection:** If a share is below `min_distribution`, that recipient is skipped and the amount stays with the owner.

**Who would call this?**
- The owner (to trigger their own distribution)
- A donor (to ensure their donation reaches downstream users)
- A bot/cron service (to automate periodic distributions)
- Anyone — it's permissionless by design

---

## 5. Claim Owner Funds

The owner withdraws their accumulated unclaimed balance.

| Step | Function | Signer | Description |
|------|----------|--------|-------------|
| 1 | `claim(caller, username, asset, to)` | Owner | Transfers the unclaimed balance from the contract to the owner (or a specified `to` address). |

**Prerequisites:**
- Caller must be the owner.
- Unclaimed balance must be > 0.

**Example:**
```
Alice claims from "alice"
→ Alice signs
→ 500 USDC transferred from contract to Alice's wallet
→ Unclaimed("alice", USDC) = 0
→ PaidTo(Alice, USDC) += 500
```

---

## 6. Distribute and Claim (Atomic)

The owner distributes and claims in a single transaction.

| Step | Function | Signer | Description |
|------|----------|--------|-------------|
| 1 | `distribute_and_claim(caller, username, asset, to, min_distribution)` | Owner | Atomically runs distribution then withdraws the owner's share. |

**Prerequisites:**
- Caller must be the owner.
- Pool must have a non-zero balance.

**Example:**
```
Alice calls distribute_and_claim for "alice"
→ Alice signs
→ Pool splits per rules (cascade to downstream pools)
→ Owner's remainder transferred directly to Alice's wallet
→ Single transaction, no intermediate state
```

---

## 7. Transfer Ownership

The current owner hands off the username to a new address.

| Step | Function | Signer | Description |
|------|----------|--------|-------------|
| 1 | `transfer_ownership(caller, username, new_owner)` | Current owner | Changes the owner on-chain. The new owner can now set rules, claim funds, etc. |

**Prerequisites:**
- Caller must be the current owner.

**Warning:** This is irreversible. The old owner immediately loses all control.

**Example:**
```
Alice transfers "alice" to Eve
→ Alice signs
→ Eve is now the owner
→ Alice can no longer set rules or claim
```

---

## Full Lifecycle Example

A complete flow from registration to fund withdrawal:

```
 SETUP
 ─────
 1. Bob registers "bob"                              → Bob signs
 2. Carol registers "carol"                          → Carol signs
 3. Alice registers "alice"                          → Alice signs
 4. Alice sets rules:                                → Alice signs
      "bob"   → 3000 BPS (30%)
      "carol" → 2000 BPS (20%)

 DONATION
 ────────
 5. Dave donates 1000 USDC to "alice"                → Dave signs

 DISTRIBUTION (Level 1)
 ──────────────────────
 6. Anyone calls distribute("alice", USDC, 0)        → Anyone signs
      → bob pool       += 300 USDC
      → carol pool     += 200 USDC
      → alice unclaimed = 500 USDC

 7. Alice claims from "alice"                        → Alice signs
      → Alice receives 500 USDC

 DISTRIBUTION (Level 2 — if Bob/Carol have rules)
 ────────────────────────────────────────────────
 8. Anyone calls distribute("bob", USDC, 0)          → Anyone signs
      → Bob's downstream users receive their shares
      → bob unclaimed = Bob's remainder

 9. Bob claims from "bob"                            → Bob signs
      → Bob receives his share

 10. Same for Carol...
```

---

## Summary: Who Signs What

| Action | Who can sign |
|--------|-------------|
| Register a username | Anyone (becomes owner) |
| Set rules | Owner only |
| Donate | Anyone (donor) |
| Distribute | Anyone (permissionless) |
| Claim | Owner only |
| Distribute and claim | Owner only |
| Transfer ownership | Current owner only |

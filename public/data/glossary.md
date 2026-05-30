# Glossary & FAQ

## Glossary

### ACE (Application-Controlled Execution)

Symphony's general framework for application-defined transaction ordering. Contracts specify ordering policies over call sequences with tiebreakers.

### Agent Call

Stateless, one-shot agent precompile (two-phase async). Submit a task, receive result via callback.

### AsyncDelivery

System contract that delivers two-phase async results by calling back into consumer contracts. Always verify `msg.sender == ASYNC_DELIVERY`.

### AsyncJobTracker

System contract tracking the 9-state lifecycle of every async job. Enforces sender lock: one pending job per EOA.

### CKKS

Homomorphic encryption scheme for approximate arithmetic on encrypted floating-point tensors. Used by FHE precompile.

### DKMS

Distributed Key Management System. Short-running async SPC that derives deterministic secp256k1 keypairs inside TEE. Same owner + keyIndex = same keypair.

### ECIES

Elliptic Curve Integrated Encryption Scheme. Asymmetric encryption for secrets, agent inputs, credentials to executor or DKMS public keys.

### Delegated Execution

Execution path for non-deterministic or resource-intensive workloads (LLM, HTTP, agents). Runs once inside TEE, result verified rather than replicated.

### Enshrined

Implemented at protocol layer, not via external smart contracts or oracles. Applies to precompiles, TxPasskey, Sequencing Rights, Scheduler.

### Executor

TEE-attested node processing off-chain precompile requests. Registered in TEEServiceRegistry with capabilities and attestation proof.

### JQ

Synchronous precompile evaluating jq expressions against JSON strings. Chain after HTTP to extract fields in same tx.

### Persistent Agent

Stateful agent precompile with identity, memory, and DA references. Persists across sessions via StorageRef. Revival from CID restores state.

### PII Mode

Boolean flag (piiEnabled) on async precompile requests controlling secret template substitution and PII redaction. Any {{SECRET_NAME}} template requires piiEnabled=true.

### Predicate

Contract implementing IScheduledPredicate. Scheduler calls shouldExecute via staticcall before each execution; returns false to skip.

### RitualTensor

ABI-encoded tensor format for ONNX: uint256 shape array, dtype enum, flattened values.

### RitualWallet

System contract for prepaid fee escrow. Deposit RITUAL; chain deducts per precompile call.

### Sender Lock

AsyncJobTracker constraint: one pending async job per EOA. Second submission before first settles reverts. Scheduled txs bypass.

### Sequencing Rights

Protocol-level rule where contracts declare function priority. Invalid ordering = invalid block.

### Seven Properties

Requirements for fully autonomous agent: Immortal, Emancipated, Teleportable, Financially sovereign, Web2-interoperable, Private, Computationally sovereign.

### Sovereign Agent

CLI-style coding agent precompile (0x080C) running inside TEE. Supports Claude Code, OpenClaw, ZeroClaw, Hermes, Codex, Aider.

### SPC

Stateful PreCompile. Short-running async where result returned via \_executePrecompile() in same transaction. One SPC per tx.

### StorageRef

Opaque identifier returned by Persistent Agent. Pass back on next call to resume context (HuggingFace, GCS, Pinata, IPFS).

### TEE

Trusted Execution Environment. Hardware-isolated enclave where executors run off-chain computation. Attestation proves honest execution.

### TxPasskey

Native transaction type 0x77. Users sign with biometrics (Face ID, fingerprint) or security key via WebAuthn.

### TOCTOU

Time-of-check to time-of-use. State drift risk between async commit and settle. No cross-async locks exist.

### Two-Phase Async

Execution model for long-running operations. Phase 1 mines immediately (returns task ID). Phase 2: AsyncDelivery calls back with result.

### X402

Encrypted credential injection protocol for pay-per-call API access. Credentials encrypted with ECIES, substituted via {{SECRET_NAME}} in TEE.

## FAQ

### How do I fund my contract to make precompile calls?

Call RitualWallet.deposit() with RITUAL:

```solidity
IRitualWallet(0x532F...3948).deposit{value: 0.01 ether}(100);
```

Your contract's address needs the balance. Balance is locked while async jobs are pending.

### Why does my HTTP call fail with "messages required"?

The HTTP precompile call requires messages to be passed to the LLM. Ensure encryptedSecrets is properly encoded and piiEnabled is set correctly if using {{SECRET_NAME}} templates.

### What's the difference between SPC and two-phase async?

**SPC** (Short-running, ~2s max): Result comes back in same transaction. Use for HTTP, LLM, DKMS.

**Two-phase**: Result comes in callback transaction, minutes later. Use for long-running tasks, agents, FHE.

### How do I pass API keys to HTTP calls without exposing them on-chain?

Use ECIES encryption:

1. Encrypt key with executor's public key
2. Pass in encryptedSecrets array
3. Set piiEnabled=true
4. Use {{SECRET_NAME}} placeholder in URL/headers
5. TEE executor decrypts and substitutes inside enclave

### What happens if my RitualWallet balance runs out?

Precompile calls revert. Deposit more RITUAL via `deposit()`.

### Can I call multiple precompiles in one transaction?

Only one async precompile per transaction (SPC or two-phase, any mix). Cannot combine HTTP + LLM. Use Scheduler for sequential calls.

### How do agents stay alive?

Two mechanisms:

**Sovereign Agent**: Contract wakes itself via Scheduler, invokes CLI agent, schedules next wakeup. Lives as long as it has funds.

**Persistent Agent**: Container in TEE posts heartbeats on-chain. If silent, dead man's switch triggers revival from last checkpoint.

### What does "sender lock" mean?

AsyncJobTracker allows exactly one pending async job per EOA. Submit a second before the first settles and it reverts. Scheduled txs bypass this.

### How do I verify a callback is legitimate?

Always check `msg.sender == ASYNC_DELIVERY` (0x5A16...39F6) in two-phase callbacks. Anyone else is trying to inject fake results.

### Where do I get testnet RITUAL?

Visit https://faucet.ritualfoundation.org. Connect wallet or paste address and request tokens.

### What's the difference between Ethereum and Ritual?

Ritual adds 16 native precompiles for AI: LLM, classical models, FHE, ZK proofs, HTTP, agents, key management. All enshrined at protocol level. Ethereum requires external oracles for everything.

### Can I use passkeys instead of seed phrases?

Yes. TxPasskey (0x77) is a native transaction type. Sign with Face ID, fingerprint, or security key via WebAuthn. No seed phrase needed.

### What if my async job never completes?

TTL expires and the job is skipped. Set TTL high enough: at least max_drift + max_settlement_blocks. For short-path SPC, TTL covers full lifecycle.

### How do I schedule recurring on-chain execution?

Use the Scheduler system contract:

```solidity
SCHEDULER.schedule(
    callData, 500000, block.number + 10,
    24, 50, 30, block.basefee, 0, 0, address(this)
);
```

Executes every 50 blocks, 24 times total, starting at block.number + 10.

### Can agents call other agents?

Yes. Agents can invoke the Sovereign Agent or Persistent Agent precompiles, spawn child agents, and pass results. Agents building agents.

### What's computational sovereignty?

An agent doesn't depend on centralized LLM providers (OpenAI, Anthropic). It runs LLM (0x0802) + ONNX (0x0800) inside Ritual's TEEs natively. The chain ensures it never loses access.

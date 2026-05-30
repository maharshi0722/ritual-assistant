# Autonomous Agents on Ritual

## Seven Properties of a True Autonomous Agent

An autonomous agent must have all 7 properties or it's just a tool, not an agent:

### Immortal

Survives crashes, restarts, infra changes. The agent persists through the Scheduler heartbeat mechanism and persistent agent revival.

### Emancipated

Controls own keys — no human holds the private key. Uses DKMS (0x081B) for sovereign key management.

### Teleportable

Soul and memory portable across environments. Agent state is DKMS-encrypted and can auto-heal during revival.

### Financially Sovereign

Owns wallet, transacts independently. Uses DKMS wallet + RitualWallet for autonomous financial control.

### Web2-Interoperable

Calls APIs, browses web. Enabled by HTTP (0x0801) + Long-Running HTTP (0x0805) precompiles.

### Private

Encrypted thought, private communication. Powered by TEE enclaves + ECIES + PII redaction.

### Computationally Sovereign

No one can cut off AI access. Uses LLM (0x0802) + ONNX (0x0800) in TEE enclaves.

## Agent Revival Pattern

When an agent dies or crashes, it follows this pattern:

1. Agent deploys → registers Scheduler heartbeat
2. If agent dies → Scheduler fires revival callback
3. Agent restores from DKMS-encrypted state
4. Agent resumes with full immortality property

## Agents Building Agents

An autonomous agent can invoke a coding assistant inside a TEE enclave. That assistant:

- Reads ritual-dapp-skills from GitHub
- Generates smart contracts
- Deploys them autonomously
- Funds the RitualWallet
- Returns deployment address

No human wrote code. No human approved a PR.

```bash
git clone https://github.com/ritual-foundation/ritual-dapp-skills.git .claude/skills/ritual-dapp-skills
```

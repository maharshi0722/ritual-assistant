# Ritual Vision & Chain Overview

## What is Ritual?

Ritual is a lab for autonomous intelligence. Autonomous intelligence is no longer speculative. The progression: foundation model → application wrapper → harness → tool-using agent → multi-agent systems with shared context.

What used to look like a model answering prompts now looks like a participant with memory, interfaces, economic intent, and a reason to keep operating.

## Why Ritual Exists

No frontier lab is built to answer the question of autonomous machine agency. Autonomous intelligence is not only a model problem — it is also a cryptography problem, a mechanism-design problem, a consensus problem, and a trusted-compute problem.

Ritual Chain is the first blockchain where smart contracts can **think, see, hear, and act** — the schelling point for autonomous agents.

## What You Can Build on Ritual

1. **Autonomous Agents That Live Forever** — emancipated from human controllers, accruing financial and computational sovereignty

2. **Multi-Agent Evals Fully On-Chain** — Project Vend, LMArena as autonomous on-chain agents

3. **Private Multimodal ChatGPT On-Chain** — private AI interface without centralized dependency

4. **Financialization of Identity** — humans rent/sell identity to agents trust-minimized

5. **Agent-Native Companies** — autonomous agents create full companies on-chain

6. **Agent-First RWA Exchange** — Hyperliquid-style with enshrined cancel priority and dark execution

---

# Autonomous Agents on Ritual

## Seven Properties of a True Autonomous Agent

| Property                  | Meaning                                        | Ritual Primitive                               |
| ------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| Immortal                  | Survives crashes, restarts, infra changes      | Scheduler heartbeat + Persistent Agent revival |
| Emancipated               | Controls own keys — no human holds private key | DKMS (0x081B)                                  |
| Teleportable              | Soul and memory portable across environments   | DKMS-encrypted state + auto-healing revival    |
| Financially sovereign     | Owns wallet, transacts independently           | DKMS wallet + RitualWallet                     |
| Web2-interoperable        | Calls APIs, browses web                        | HTTP (0x0801) + Long-Running HTTP (0x0805)     |
| Private                   | Encrypted thought, private communication       | TEE enclaves + ECIES + PII redaction           |
| Computationally sovereign | No one can cut off AI access                   | LLM (0x0802) + ONNX (0x0800) in TEE            |

Missing even one property makes it a tool, not an agent.

## Agent Revival Pattern

```
Agent deploys → registers Scheduler heartbeat →
  if agent dies → Scheduler fires revival callback →
    agent restores from DKMS-encrypted state →
      agent resumes (Immortal property)
```

## Agents Building Agents

An autonomous agent can invoke a coding assistant inside a TEE enclave. That assistant reads ritual-dapp-skills, generates contracts, deploys them, funds the RitualWallet, and returns the deployment address. No human wrote code. No human approved a PR.

```
git clone https://github.com/ritual-foundation/ritual-dapp-skills.git .claude/skills/ritual-dapp-skills
```

---

# Ritual Precompile Map

## Execution Models

| Type                       | Speed           | Precompiles                                                  |
| -------------------------- | --------------- | ------------------------------------------------------------ |
| Synchronous                | Same call frame | ONNX (0x0800), Ed25519 (0x0009), P-256 (0x0100), JQ (0x0803) |
| Short async (single-phase) | 100ms–2s        | HTTP (0x0801), LLM (0x0802), DKMS (0x081B)                   |
| Long async (two-phase)     | Seconds–minutes | Long HTTP (0x0805), FHE (0x0807), Agent (0x081A), ZK, Image  |

**Constraint:** One async precompile per transaction. Cannot combine HTTP + LLM in one tx.

## HTTP Precompile (0x0801)

Makes HTTP request inside TEE, attests response, returns to contract in same tx.

```solidity
contract PriceFeed is PrecompileConsumer {
    function fetchPrice(bytes calldata httpInput) external {
        bytes memory output = _executePrecompile(HTTP_CALL_PRECOMPILE, httpInput);
        (uint16 statusCode, , , bytes memory body, string memory errorMessage)
            = abi.decode(output, (uint16, string[], string[], bytes, string));
        require(statusCode == 200, errorMessage);
    }
}
```

### HTTP 13-Field ABI

| #   | Field            | Type    | Notes                       |
| --- | ---------------- | ------- | --------------------------- |
| 0   | executor         | address | From TEEServiceRegistry     |
| 1   | encryptedSecrets | bytes[] | ECIES-encrypted secrets     |
| 2   | ttl              | uint256 | Time-to-live in blocks      |
| 5   | url              | string  | Target URL                  |
| 6   | method           | uint8   | 1=GET 2=POST 3=PUT 4=DELETE |
| 9   | body             | bytes   | Request body                |
| 12  | piiEnabled       | bool    | PII redaction               |

## LLM Inference (0x0802)

GLM-4.7-FP8 (64K context) inside TEE. No API keys. Streaming via EIP-712 signed SSE tokens.

## ONNX Classical Models (0x0800)

Synchronous inline ML inference. Load from Hugging Face: `hf/owner/repo/file.onnx@commit`.

## JQ Queries (0x0803)

Runs jq expressions against JSON synchronously. Chain after HTTP to extract fields in same tx.

```solidity
(bool ok, bytes memory result) = JQ_PRECOMPILE.staticcall(
    abi.encode(".data.price", jsonString, uint8(1)) // 1 = uint256
);
uint256 price = abi.decode(result, (uint256));
```

## FHE Inference (0x0807)

CKKS-encrypted tensor inference inside TEE. Inputs and outputs never visible. For medical, financial, private data.

## Precompile Address Quick Reference

| Address | Name                | Type        |
| ------- | ------------------- | ----------- |
| 0x0800  | ONNX classical ML   | Sync        |
| 0x0801  | HTTP calls          | Short async |
| 0x0802  | LLM inference       | Short async |
| 0x0803  | JQ JSON query       | Sync        |
| 0x0805  | Long-running HTTP   | Two-phase   |
| 0x0807  | FHE inference       | Two-phase   |
| 0x0009  | Ed25519 verify      | Sync        |
| 0x0100  | P-256 / WebAuthn    | Sync        |
| 0x081A  | Sovereign Agent     | Two-phase   |
| 0x081B  | DKMS key derivation | Short async |

---

# Ritual Scheduler

System contract at `0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B`.

Lets contracts schedule their own execution at future blocks: recurring, delayed, or conditional. Block proposer invokes directly — no off-chain keeper or cron.

## Usage

```solidity
import {IScheduler} from "./interfaces/IScheduler.sol";
IScheduler constant SCHEDULER = IScheduler(0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B);

function schedulePriceCheck() external {
    bytes memory callData = abi.encodeWithSelector(
        this.executePriceCheck.selector,
        uint256(0) // placeholder: overwritten with executionIndex
    );
    SCHEDULER.schedule(
        callData, 500000,
        uint32(block.number + 10), // startBlock
        24,    // numCalls
        50,    // frequency (blocks)
        30,    // ttl
        block.basefee, 0, 0,
        address(this) // payer (RitualWallet)
    );
}
```

Must call `approveScheduler(schedulerAddress)` before scheduling.

## Parameters

| Param      | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| data       | bytes   | Calldata (bytes 4–35 overwritten with executionIndex) |
| gas        | uint32  | Gas limit per execution                               |
| startBlock | uint32  | First execution block                                 |
| numCalls   | uint32  | Total executions                                      |
| frequency  | uint32  | Blocks between executions                             |
| ttl        | uint32  | Max wait blocks (max 500)                             |
| payer      | address | Pays from RitualWallet                                |

## Predicates

Implement `IScheduledPredicate.shouldExecute()` — scheduler skips execution if returns false. 100k gas limit, staticcall only.

## Constraints

- Contracts only (EOAs cannot call `schedule()`)
- Multiple scheduled async jobs run in parallel from same contract
- Scheduled txs bypass sender lock

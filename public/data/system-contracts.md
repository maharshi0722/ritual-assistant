# System Contracts & Core Patterns

## RitualWallet (0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948)

Prepaid fee escrow. Deposit RITUAL to pay for precompile calls. Balance locked while async jobs pending.

### Interface

```solidity
interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
    function depositFor(address user, uint256 lockDuration) external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function lockUntil(address account) external view returns (uint256);
}
```

### Flow

1. Call `deposit{value: amount}(lockDuration)` to fund
2. Lock period prevents withdrawal (monotonic: only extends, never shortens)
3. Chain deducts fees at submission time
4. Balance locked until async job settles or lock expires
5. Withdraw after expiry

### Critical Rule

Two-phase async precompiles check **EOA balance**, not contract balance. If user interacts through proxy contract, ensure EOA has sufficient funds.

## AsyncJobTracker (0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5)

Tracks lifecycle of every async job. 9-state machine:

JobAdded → Phase1Committed → Phase1Settled → Phase2Pending → ResultDelivered → JobRemoved

Also enforces **sender lock**: one pending job per EOA. Submit second before first settles = revert. Scheduled txs bypass this.

## AsyncDelivery (0x5A16214fF555848411544b005f7Ac063742f39F6)

Where two-phase results land. Executor sends result to AsyncDelivery, which forwards to your callback.

**Critical**: verify `msg.sender == ASYNC_DELIVERY` in callback or anyone can inject fake results.

```solidity
function onPersistentAgentResult(bytes32 jobId, bytes calldata result) external {
    require(msg.sender == 0x5A16214fF555848411544b005f7Ac063742f39F6, "unauthorized");
    // process result
}
```

## TEEServiceRegistry (0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F)

Registry of TEE executors. Each executor advertises:

- Capabilities (LLM, ONNX, HTTP, FHE, etc.)
- Attestation proof
- Public key for ECIES encryption

Get executor's public key via `getExecutorPublicKey(executorId)`.

## Consumer Patterns

### Synchronous Consumer

Simplest. Call precompile, read result immediately.

```solidity
(bool ok, bytes memory result) = address(0x0100).staticcall(input);
uint256 valid = abi.decode(result, (uint256));
```

### Short-Running Async Consumer

Use `_executePrecompile()` from PrecompileConsumer. Result available in same transaction.

```solidity
import {PrecompileConsumer} from "./utils/PrecompileConsumer.sol";

contract HTTPConsumer is PrecompileConsumer {
    function fetchPrice(bytes calldata httpInput) external {
        bytes memory output = _executePrecompile(HTTP_CALL_PRECOMPILE, httpInput);
        (uint16 status, , , bytes memory body, ) = abi.decode(output, (uint16, string[], string[], bytes, string));
    }
}
```

### Two-Phase Async Consumer

Request in one tx, callback in another.

```solidity
function submitTask(bytes calldata input) external {
    _executePrecompile(AGENT_PRECOMPILE, input);
}

function onPersistentAgentResult(bytes32 jobId, bytes calldata result) external {
    require(msg.sender == ASYNC_DELIVERY);
    // process result
}
```

## Execution Lifecycle

### Short-Running Async (SPC)

1. User submits tx with SPC call
2. Block builder detects async precompile
3. Creates system TxAsyncCommitment
4. TEE executor processes request
5. Result injected into tx at settlement
6. Contract sees result via \_executePrecompile()
7. All in same tx, same block

### Two-Phase Async

1. Phase 1: Submit task, get task ID
2. Executor processes in background
3. Phase 2: AsyncDelivery calls back with result
4. Separate transaction, later block
5. Sender lock: one pending job per EOA

### TTL (Time-To-Live)

**Short-path SPC**: TTL covers full async lifecycle. Set high enough for max_drift + max_settlement_blocks.

**Long-path two-phase**: TTL covers Phase 1 only. Phase 2 has separate maxPollBlock.

### TOCTOU Risk

State can change between commit and settle. No cross-async locks. Consumer contract responsible for checking preconditions still hold in callback.

## Precompile Categories

| Type              | Speed           | Examples                         |
| ----------------- | --------------- | -------------------------------- |
| Synchronous       | Same call frame | ONNX, Ed25519, P-256, JQ         |
| Short Async (SPC) | 100ms–2s        | HTTP, LLM, DKMS                  |
| Long Async        | Seconds–minutes | Agent, Long HTTP, FHE, ZK, Image |

**Constraint**: One async precompile per transaction (SPC or two-phase, any mix). Cannot combine HTTP + LLM in one tx.

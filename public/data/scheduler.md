# Ritual Scheduler

## Overview

System contract at `0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B`.

Lets contracts schedule their own execution at future blocks. Supports recurring, delayed, or conditional execution. Block proposer invokes directly — no off-chain keeper or cron service needed.

## Usage

Import the scheduler interface:

```solidity
import {IScheduler} from "./interfaces/IScheduler.sol";
IScheduler constant SCHEDULER = IScheduler(0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B);
```

Schedule recurring price checks:

```solidity
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

| Parameter  | Type    | Description                                           |
| ---------- | ------- | ----------------------------------------------------- |
| data       | bytes   | Calldata (bytes 4–35 overwritten with executionIndex) |
| gas        | uint32  | Gas limit per execution                               |
| startBlock | uint32  | First execution block                                 |
| numCalls   | uint32  | Total executions                                      |
| frequency  | uint32  | Blocks between executions                             |
| ttl        | uint32  | Max wait blocks (maximum 500)                         |
| payer      | address | Account that pays from RitualWallet                   |

## Predicates

Implement `IScheduledPredicate.shouldExecute()` — scheduler skips execution if returns false.

**Constraints:**

- 100k gas limit
- staticcall only (no state changes)

Example:

```solidity
contract MyPredicate is IScheduledPredicate {
    function shouldExecute(bytes memory data) external view returns (bool) {
        // Only execute if price > $100
        return getPriceFromOracle() > 100e18;
    }
}
```

## Constraints

- **Contracts only** — EOAs cannot call `schedule()`
- **Parallel execution** — Multiple scheduled async jobs run in parallel from same contract
- **Sender lock bypass** — Scheduled transactions bypass sender lock
- **Max TTL** — Time-to-live parameter has maximum of 500 blocks

## Execution Flow

1. Contract calls SCHEDULER.schedule() with callData and params
2. Scheduler stores execution plan
3. At startBlock + (frequency × executionIndex), block proposer triggers execution
4. If predicate exists and returns false, execution is skipped
5. Scheduler automatically updates balance from RitualWallet

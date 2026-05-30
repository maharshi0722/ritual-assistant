# Real World: Execution Models & Integration

## HTTP Precompile (0x0801)

Makes HTTP requests inside TEE, attests response, returns to contract in same tx.

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

### Execution Path

- User submits signed tx with HTTP call
- Block builder detects 0x0801 call, flags as async
- TEE executor receives request, makes HTTP call inside enclave
- Response attested via TEE attestation
- Result injected into transaction at settlement
- Contract receives decoded output in same tx

### 13-Field ABI

| #   | Field            | Type    | Notes                       |
| --- | ---------------- | ------- | --------------------------- |
| 0   | executor         | address | From TEEServiceRegistry     |
| 1   | encryptedSecrets | bytes[] | ECIES-encrypted secrets     |
| 2   | ttl              | uint256 | Time-to-live in blocks      |
| 5   | url              | string  | Target URL                  |
| 6   | method           | uint8   | 1=GET 2=POST 3=PUT 4=DELETE |
| 9   | body             | bytes   | Request body                |
| 12  | piiEnabled       | bool    | PII redaction               |

## Long-Running HTTP (0x0805)

For tasks that exceed the 2-second budget. Submit → Poll → Deliver.

The executor makes initial request, extracts task ID via taskIdJsonPath, polls at specified intervals until statusJsonPath is truthy, then delivers final result via callback.

### 35-Field ABI

Includes initial HTTP config, polling interval, status check path, result extraction path, and delivery callback details.

## Scheduler System

Contract at `0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B`.

Contracts schedule their own execution at future blocks:

- Recurring execution
- Delayed execution
- Conditional execution via predicates

Block proposer invokes directly—no off-chain keeper required.

### Key Parameters

- **startBlock**: First execution block
- **frequency**: Blocks between executions
- **numCalls**: Total number of executions
- **ttl**: Max blocks to wait (maximum 500)
- **payer**: Address paying from RitualWallet

### Predicates

Implement `IScheduledPredicate.shouldExecute()` to skip execution conditionally. 100k gas limit, staticcall only.

## Secrets & ECIES

Encrypt API credentials and sensitive data using ECIES to the executor's public key.

Template substitution: reference encrypted secrets in request fields as `{{SECRET_NAME}}`. TEE executor decrypts and substitutes before making external requests.

### Process

1. Get executor's public key from TEEServiceRegistry
2. Encrypt secret with ECIES (nonce must be 12 bytes)
3. Pass encrypted secret in encryptedSecrets array
4. Use `{{SECRET_NAME}}` placeholder in request fields
5. Set piiEnabled=true to activate substitution

### Libraries

- JavaScript: `eciesjs`
- Python: `eciespy`

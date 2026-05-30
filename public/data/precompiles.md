# Ritual Precompile Map

## Execution Models

Precompiles are categorized by execution model:

### Synchronous (Same Call Frame)

Execute instantly in the same transaction call frame:

- ONNX (0x0800) - Classical ML models
- Ed25519 (0x0009) - Ed25519 signature verification
- P-256 (0x0100) - P-256 / WebAuthn verification
- JQ (0x0803) - JQ JSON query language

### Short Async (Single-Phase, 100ms–2s)

Execute asynchronously but return in same transaction:

- HTTP (0x0801) - HTTP request precompile
- LLM (0x0802) - Large language model inference
- DKMS (0x081B) - Distributed Key Management System

### Long Async (Two-Phase, Seconds–Minutes)

Execute asynchronously, return in different transaction:

- Long HTTP (0x0805) - Long-running HTTP requests
- FHE (0x0807) - Fully Homomorphic Encryption
- Agent (0x081A) - Sovereign Agent execution
- ZK - Zero knowledge proofs
- Image - Image processing

**Constraint:** One async precompile per transaction. You cannot combine HTTP + LLM in one tx.

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

## HTTP 13-Field ABI

| Field            | Type    | Description                 |
| ---------------- | ------- | --------------------------- |
| executor         | address | From TEEServiceRegistry     |
| encryptedSecrets | bytes[] | ECIES-encrypted secrets     |
| ttl              | uint256 | Time-to-live in blocks      |
| url              | string  | Target URL                  |
| method           | uint8   | 1=GET 2=POST 3=PUT 4=DELETE |
| body             | bytes   | Request body                |
| piiEnabled       | bool    | PII redaction enabled       |

## LLM Inference (0x0802)

GLM-4.7-FP8 with 64K context inside TEE. No API keys needed. Streaming via EIP-712 signed SSE tokens.

## ONNX Classical Models (0x0800)

Synchronous inline ML inference. Load models from Hugging Face: `hf/owner/repo/file.onnx@commit`

## JQ Queries (0x0803)

Runs jq expressions against JSON synchronously. Chain after HTTP to extract fields in same tx.

```solidity
(bool ok, bytes memory result) = JQ_PRECOMPILE.staticcall(
    abi.encode(".data.price", jsonString, uint8(1)) // 1 = uint256
);
uint256 price = abi.decode(result, (uint256));
```

## FHE Inference (0x0807)

CKKS-encrypted tensor inference inside TEE. Inputs and outputs never visible. For medical, financial, and private data.

## Precompile Address Quick Reference

| Address | Name                | Type        |
| ------- | ------------------- | ----------- |
| 0x0800  | ONNX classical ML   | Synchronous |
| 0x0801  | HTTP calls          | Short async |
| 0x0802  | LLM inference       | Short async |
| 0x0803  | JQ JSON query       | Synchronous |
| 0x0805  | Long-running HTTP   | Long async  |
| 0x0807  | FHE inference       | Long async  |
| 0x0009  | Ed25519 verify      | Synchronous |
| 0x0100  | P-256 / WebAuthn    | Synchronous |
| 0x081A  | Sovereign Agent     | Long async  |
| 0x081B  | DKMS key derivation | Short async |

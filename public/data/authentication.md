# Authentication & Security

## Passkeys (P-256, 0x0100)

Users sign transactions with Face ID, fingerprint, or security key. No seed phrase, no browser extension.

TxPasskey (0x77) is a native transaction type. Chain understands WebAuthn natively.

### Address Derivation

Address = keccak256(publicKeyX || publicKeyY)[12:32]

Last 20 bytes of hash of concatenated P-256 coordinates. Same passkey, same address, every time. Deterministic.

### Verification

SECP256R1 precompile verifies P-256 signatures natively.

```solidity
address constant SECP256R1 = address(0x0100);

(bool ok, bytes memory result) = SECP256R1.staticcall(
    abi.encode(pubkeyBytes, messageBytes, signatureBytes)
);
require(ok, "verification failed");
uint256 valid = abi.decode(result, (uint256));  // 1 = valid, 0 = invalid
require(valid == 1, "invalid signature");
```

**Return type**: uint256 (1 = valid, 0 = invalid), not bool.
**Gas cost**: 3,450 (flat).

### Signature Types

| Code | Type                         | Gas Overhead |
| ---- | ---------------------------- | ------------ |
| 0x00 | Secp256k1 (standard ECDSA)   | —            |
| 0x01 | P-256 (raw passkey)          | +3,450       |
| 0x02 | WebAuthn (P-256 + challenge) | +5,000       |

## Ed25519 Signatures (0x0009)

Verify Ed25519 signatures natively at ~2000 gas. Useful for:

- Solana transaction signatures
- SSH public key auth
- DKIM email headers
- Tor relay identity keys

### Synchronous

Result comes back in same call. No SPC callback. No RitualWallet deposit needed.

### Argument Order

**(publicKey, message, signature)**

Most Ed25519 libraries use (message, signature, publicKey). Wrong order returns false silently—does not revert.

```solidity
(bool success, bytes memory result) = address(0x0009).staticcall(
    abi.encode(
        pubKey,   // 32-byte Ed25519 public key
        message,  // signed message
        sig       // 64-byte R || S
    )
);
uint256 valid = abi.decode(result, (uint256));
require(success && valid == 1, "invalid ed25519 signature");
```

## DKMS Keys (0x081B)

Your contract or agent can derive and hold its own secp256k1 keys directly from the chain, without human custodian or off-chain key vault.

**Short-running async (SPC)**: derives deterministic secp256k1 keypairs inside executor TEE.

### Deterministic Derivation

Same owner + same keyIndex = same keypair every time.

Keys never leave enclave. Even contract can't extract raw key material.

### Use Cases

- Agent DA encryption
- Wallet identity
- X402 shared credentials
- Agent emancipation (DKMS controls keys, not human operator)

### Requires Executor Capability

Executor must advertise Capability DKMS=6. Without this, precompile call reverts.

## X402 Payments

Call paid APIs without surfacing keys on-chain. Credentials ECIES-encrypted to executor, billed per request.

Runs on HTTP precompiles (0x0801, 0x0805)—no separate precompile address.

### Flow

1. Encrypt API credentials with ECIES to executor's public key
2. Sign encrypted blob with EIP-191
3. Pass in encryptedSecrets array
4. Set piiEnabled=true
5. Use `{{SECRET_NAME}}` placeholders in URL/headers
6. Executor decrypts inside TEE, substitutes, makes call

### Budget Tracking

Lives in consumer contract. Each X402 call deducts from allocated budget.

### Shared Credentials

Use SecretsAccessControl to grant other addresses access without exposing plaintext:

- `grantAccess(address user, string secret)`
- `revokeAccess(address user, string secret)`

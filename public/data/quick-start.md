# Quick Start & Getting Started

## Chain Details

| Parameter       | Value                                 |
| --------------- | ------------------------------------- |
| Chain ID        | 1979                                  |
| Currency        | RITUAL (18 decimals, testnet)         |
| Block Time      | ~350ms                                |
| Tx Types        | EIP-1559 + 0x10, 0x11, 0x12, 0x77     |
| RPC (HTTP)      | https://rpc.ritualfoundation.org      |
| RPC (WebSocket) | wss://rpc.ritualfoundation.org        |
| Explorer        | https://explorer.ritualfoundation.org |
| Faucet          | https://faucet.ritualfoundation.org   |

## Wallet Setup

### Add to MetaMask

**Settings → Networks → Add network → Add a network manually**

| Field           | Value                                 |
| --------------- | ------------------------------------- |
| Network Name    | Ritual Chain                          |
| RPC URL         | https://rpc.ritualfoundation.org      |
| Chain ID        | 1979                                  |
| Currency Symbol | RITUAL                                |
| Block Explorer  | https://explorer.ritualfoundation.org |

Or use chain-list integration if your wallet supports adding by Chain ID.

## Get Testnet Tokens

Visit **https://faucet.ritualfoundation.org**:

1. Connect your wallet or paste your address
2. Request testnet RITUAL
3. Funds arrive in ~1 minute

## Viem Setup

```typescript
import { defineChain } from "viem";

export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: { name: "RITUAL", symbol: "RITUAL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ritualfoundation.org"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.ritualfoundation.org" },
  },
});
```

## Wagmi Config

```typescript
import { createConfig, http } from "wagmi";

export const config = createConfig({
  chains: [ritualChain],
  transports: {
    [ritualChain.id]: http(),
  },
});
```

## Foundry Setup

Create `foundry.toml`:

```toml
[profile.default]
src = "src"
out = "out"
evm_version = "shanghai"

[rpc_endpoints]
ritual = "https://rpc.ritualfoundation.org"
```

## Hardhat Setup

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    ritual: {
      url: "https://rpc.ritualfoundation.org",
      chainId: 1979,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
};
export default config;
```

## Deploy Your First Contract

### Using Foundry

```bash
# Deploy to Ritual testnet
forge create src/YourContract.sol:YourContract --network ritual --private-key <YOUR_KEY>
```

### Using Hardhat

```bash
# Deploy via Hardhat
npx hardhat run scripts/deploy.js --network ritual
```

## Precompile Addresses Reference

| Address | Precompile          | Type        |
| ------- | ------------------- | ----------- |
| 0x0800  | ONNX classical ML   | Synchronous |
| 0x0801  | HTTP calls          | Short async |
| 0x0802  | LLM inference       | Short async |
| 0x0803  | JQ JSON query       | Synchronous |
| 0x0805  | Long-running HTTP   | Two-phase   |
| 0x0807  | FHE inference       | Two-phase   |
| 0x0009  | Ed25519 verify      | Synchronous |
| 0x0100  | P-256 / WebAuthn    | Synchronous |
| 0x081A  | Sovereign Agent     | Two-phase   |
| 0x081B  | DKMS key derivation | Short async |
| 0x0820  | Persistent Agent    | Two-phase   |
| 0x080C  | Sovereign Agent CLI | Two-phase   |

## System Contracts

| Contract             | Address                                    |
| -------------------- | ------------------------------------------ |
| RitualWallet         | 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948 |
| AsyncJobTracker      | 0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5 |
| TEEServiceRegistry   | 0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F |
| Scheduler            | 0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B |
| SecretsAccessControl | 0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD |
| AsyncDelivery        | 0x5A16214fF555848411544b005f7Ac063742f39F6 |
| AgentHeartbeat       | 0xEF505E801f1Db392B5289690E2ffc20e840A3aCa |
| ModelPricingRegistry | 0x7A85F48b971ceBb75491b61abe279728F4c4384f |

## First HTTP Call

### 1. Fund RitualWallet

```solidity
IRitualWallet wallet = IRitualWallet(0x532F...3948);
wallet.deposit{value: 0.01 ether}(100);  // 0.01 RITUAL, 100-block lock
```

### 2. Create Consumer Contract

```solidity
import {PrecompileConsumer} from "./utils/PrecompileConsumer.sol";

contract MyAPIConsumer is PrecompileConsumer {
    function getPrice(bytes calldata httpInput) external {
        bytes memory output = _executePrecompile(HTTP_CALL_PRECOMPILE, httpInput);
        (uint16 status, , , bytes memory body, ) =
            abi.decode(output, (uint16, string[], string[], bytes, string));
        require(status == 200);
    }
}
```

### 3. Encode and Submit

```typescript
import { encodePacked, getAddress } from "viem";

const httpInput = abi.encode(
  [
    "address", // executor
    "bytes[]", // encryptedSecrets
    "uint256", // ttl
    "bytes[]", // secretSignatures
    "bytes", // userPublicKey
    "string", // url
    "uint8", // method (1=GET)
    "string[]", // headerKeys
    "string[]", // headerValues
    "bytes", // body
    "uint256", // dkmsKeyIndex
    "uint8", // dkmsKeyFormat
    "bool", // piiEnabled
  ],
  [
    executorAddress,
    [],
    30n, // ttl
    [],
    "0x",
    "https://api.example.com/price",
    1, // GET
    [],
    [],
    "0x",
    0n,
    0,
    false,
  ],
);
```

## Next Steps

- Explore [Precompile Map](./precompiles.md) for all available precompiles
- Read [Seven Properties](./agents.md) to understand autonomous agents
- Check [System Contracts](./system-contracts.md) for contract addresses
- See [Authentication](./authentication.md) for passkey setup

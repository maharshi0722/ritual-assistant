# Ritual Chain Integration Guide

## Overview

This application is integrated with the **Ritual Chain** (Chain ID: 1979) to anchor AI prompts on-chain using the `gritual` smart contract.

## Network Configuration

### Chain Details

- **Chain ID**: 1979
- **Currency**: RITUAL (18 decimals)
- **Block Time**: ~350ms
- **RPC HTTP**: https://rpc.ritualfoundation.org
- **RPC WebSocket**: wss://rpc.ritualfoundation.org/ws
- **Explorer**: https://explorer.ritualfoundation.org

### Smart Contract

- **Name**: gritual
- **Address**: `0xE08A14a9eC81616ad1b6b569A4aeDd5d8e667Dd2`
- **Network**: Ritual Chain (1979)

## System Contracts on Ritual Chain

| Contract           | Address                                      |
| ------------------ | -------------------------------------------- |
| RitualWallet       | `0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948` |
| AsyncJobTracker    | `0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5` |
| TEEServiceRegistry | `0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F` |
| Scheduler          | `0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B` |
| SecretsACL         | `0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD` |

## How It Works

### 1. **Wallet Connection**

- Click "Connect Wallet" button in the top-right
- MetaMask will prompt you to connect
- The app automatically detects if you're not on Ritual Chain and prompts to switch
- Once connected, your wallet address is displayed (shortened format)

### 2. **Prompt Anchoring**

When you send a chat message:

1. Your prompt is hashed using **Keccak256**
2. The hash is submitted to the `anchorPrompt()` function on-chain
3. Transaction confirmation is displayed in real-time
4. Once confirmed, your AI chat request is sent
5. Both the blockchain record and AI response are created

### 3. **Status Indicators**

- **Ritual pill**: Shows you're on Ritual Chain
- **Status indicator**:
  - 🟢 Ready (idle)
  - 🟡 Anchoring… (blockchain transaction pending)
  - 🟡 Thinking… (waiting for AI response)

### 4. **Transaction Status**

- Real-time TX hash display
- Block number confirmation
- Automatic explorer link generation
- 4-second display duration then auto-clears

## Setup Requirements

### Prerequisites

1. **MetaMask** browser extension installed
2. **RITUAL** tokens in your wallet (for gas fees)
3. Node.js and npm installed

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

## Configuration Files

### `lib/ritual-chain.js`

Core configuration for Ritual Chain with helper functions:

- `RITUAL_CHAIN` - Chain configuration object
- `switchToRitualChain()` - Auto-add and switch to Ritual Chain
- `isOnRitualChain()` - Check current connected chain
- `getExplorerLink()` - Generate block explorer links
- `formatAddress()` - Format wallet addresses

### `.env.example`

Environment configuration template with contract address and chain details

## Features

✅ Automatic Ritual Chain detection and switching  
✅ MetaMask wallet integration  
✅ Real-time blockchain transaction status  
✅ Keccak256 prompt hashing  
✅ Explorer link generation  
✅ Error handling and validation  
✅ Responsive wallet UI with connection status

## Error Handling

| Error                              | Solution                               |
| ---------------------------------- | -------------------------------------- |
| "Please install MetaMask"          | Install MetaMask browser extension     |
| "Please switch to Ritual Chain"    | Approve chain switch in MetaMask popup |
| "Transaction failed"               | Check wallet balance for gas, retry    |
| "Please connect your wallet first" | Click "Connect Wallet" button          |

## Transaction Flow

```
1. User writes message
   ↓
2. Click Send button
   ↓
3. Check wallet connected? → No → Show alert
   ↓ Yes
4. Hash prompt (Keccak256)
   ↓
5. Submit anchorPrompt() txn
   ↓
6. Display TX hash
   ↓
7. Wait for confirmation
   ↓
8. Send chat message to AI
   ↓
9. Display response
```

## Troubleshooting

### Wallet won't connect

- Ensure MetaMask is installed and unlocked
- Refresh the page
- Try restarting MetaMask

### Wrong chain error

- The app will automatically prompt to add Ritual Chain
- Approve the addition in MetaMask
- Approve the switch to Ritual Chain

### Transactions failing

- Check you have RITUAL tokens for gas
- Check network status at https://explorer.ritualfoundation.org
- Wait a moment and retry

### Slow transactions

- Ritual Chain has ~350ms block time
- Transactions typically confirm in 1-2 blocks
- Check status on explorer

## API Reference

### Contract Functions

#### `anchorPrompt(bytes32 promptHash)`

Anchors a Keccak256 hash of the prompt on-chain.

**Parameters:**

- `promptHash` - The Keccak256 hash of the prompt text

**Emits:** `PromptAnchored(id, sender, promptHash, timestamp)`

#### `verifyPrompt(uint256 id, bytes32 promptHash)`

Verifies if a stored prompt matches the provided hash.

**Parameters:**

- `id` - The proof ID
- `promptHash` - The Keccak256 hash to verify

**Returns:** `bool` - True if hashes match

## Support

For issues with:

- **Ritual Chain**: https://explorer.ritualfoundation.org
- **MetaMask**: https://support.metamask.io
- **Smart Contracts**: Review ABI in `app/page.js`

---

**Last Updated**: June 13, 2026  
**Chain ID**: 1979  
**Contract**: 0xE08A14a9eC81616ad1b6b569A4aeDd5d8e667Dd2

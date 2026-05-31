[Quick Start](https://skills.ritualfoundation.org/#quickstart) · [Skills](https://skills.ritualfoundation.org/#skills) · [Architecture](https://skills.ritualfoundation.org/#architecture) · [Chain](https://skills.ritualfoundation.org/#chain) · [GitHub](https://github.com/ritual-foundation/ritual-dapp-skills)

# Build dApps on Ritual

Start Building · Explore Skills

## 01 Install the skill system

One command. Your AI agent gains access to every Ritual precompile, contract pattern, and deployment workflow. Loaded on demand as needed.

```bash
git clone https://github.com/ritual-foundation/ritual-dapp-skills.git .claude/skills/ritual-dapp-skills
```

Supported tools:

- Claude Code
- Cursor
- Codex CLI
- Hermes
- OpenClaw

_Recommended: Claude Code + Opus 4.7 Max or Cursor + Codex 5.3 Extra High. Other combinations work, mileage may vary._

## 02 Describe what you want

Paste this into your agent. Replace the wallet address and the last line with your idea. Leave the idea out entirely and the agent will suggest one.

```text
Read the file skills/ritual/SKILL.md and follow its instructions.
Wallet: 0xYOUR_FUNDED_WALLET_ADDRESS
Build me a TEE credential marketplace for selling social media access.
```

- Private multi-modal ChatGPT on-chain
- Autonomous agent that reads news and lists prediction markets
- TEE credential marketplace for selling social media access
- RWA dark pool with Hyperliquid cancel prioritization

## 03 The agent takes over

Your agent asks 0-5 targeted questions, selects the right precompiles, and builds your dApp in phases, verifying each one before moving on.

Something broken? Just describe the symptom. The debugger activates automatically.

```bash
claude-code / ritual-dapp
```

## Works with your tools

The skills are plain markdown files. Any AI coding assistant that reads instructions can use them.

#### Claude Code

Clone into `.claude/skills/ritual-dapp-skills` in your project root. Skills auto-load when Claude Code needs them.

```bash
git clone https://github.com/ritual-foundation/ritual-dapp-skills.git .claude/skills/ritual-dapp-skills
```

#### Cursor

Clone into `.cursor/skills/` in your project root. Skills auto-load when the agent needs them.

```bash
git clone https://github.com/ritual-foundation/ritual-dapp-skills.git .cursor/skills/ritual-dapp-skills
```

#### Codex CLI

Clone into `.codex/skills/` or install via `/skills` in the CLI. SKILL.md format is natively supported.

```bash
git clone https://github.com/ritual-foundation/ritual-dapp-skills.git .codex/skills/ritual-dapp-skills
```

#### Hermes Agent

```bash
hermes skills tap add ritual-foundation/ritual-dapp-skills
```

#### OpenClaw

Clone into `~/.openclaw/skills/` or your workspace `skills/` directory. SKILL.md format is natively supported.

```bash
git clone https://github.com/ritual-foundation/ritual-dapp-skills.git ~/.openclaw/skills/ritual-dapp-skills
```

#### Copilot / ChatGPT

Paste the contents of `skills/ritual/SKILL.md` into your system prompt or custom instructions.

#### Any LLM Agent

Clone the repo and feed the relevant `SKILL.md` files as context. Each skill is self-contained.

## Skills

Click any skill to see what it teaches your agent. Each skill is a self-contained instruction set. The agent loads only what it needs.

### Meta Protocols

- Bootstrap — 10 rules
- Meta-kernel — behavioral middleware active for every session
- Verification Protocol — 12 steps, automated per-skill checks, cross-skill integration, E2E user journey
- Lazy Elicitation v3 — JIT question generation from a 12-dimension universe
- Circuit Breaker — trajectory divergence detection, knows when to stop
- Projection pre-builder — transforms raw ideas into Ritual-native specs with precompile mappings
- Inspiration live search — JIT idea generation from trending blockchain + AI themes

### Architecture & Reference

- Overview — Chain architecture, 3 execution models, 9-state async lifecycle, TEE trust model
- Precompiles ABI — 16 addresses, complete ABI reference with encoding examples
- Deploy — Chain config, Foundry/Hardhat setup, deployment scripts, system addresses
- Design System — Dark-mode-first terminal aesthetic, typography, color semantics, accessibility

### Precompile Features

- HTTP 0x0801 — External HTTP calls on-chain: APIs, price feeds, webhooks
- LLM 0x0802 — On-chain AI inference: chat, tool calling, structured output, streaming
- Agents 0x0820 / 0x080C — Multi-step AI agents: persistent memory or sovereign execution
- Long-Running HTTP 0x0805 — Minutes-to-hours async HTTP jobs with polling
- Multimodal 0x0818 / 0x0819 / 0x081A — AI image, audio, and video generation on-chain
- Scheduler 0x56e7…D58B — Block-based delayed and recurring on-chain execution
- Secrets — ECIES encryption, secret string replacement, delegated access control
- X402 Payments via 0x0801 / 0x0805 — Micropayments for paid API access
- Passkey / WebAuthn — Sign transactions with Face ID, fingerprint, or hardware keys

### Smart Contracts

- Contracts — How to write Solidity contracts that call Ritual precompiles
- RitualWallet — Fee deposits, locking, and withdrawal for async precompile calls

## How it works

You describe what you want. The agent activates its behavioral protocols, loads the right skills, builds, verifies, and debugs.

- Build me a...
- Describe your idea or report a problem
- checkpoints
- approve architecture
- approve contracts
- approve frontend
- approve deploy
- you confirm between each phase

### Agent system

- META LAYER always active, invisible to user
- bootstrap
- Track Cost
- Distrust Priors
- Elicitation
- Interleave
- Circuit Breaker
- Verification
- Search First
- Ask at Forks
- Anti-Slop
- inspiration
- projection
- if no idea → inspiration → projection → builder
- BUILD 3-6 skills per project
- builder agent, architecture → contracts → frontend backend → testing → deploy
- Skills loaded per project: http llm agents multimodal scheduler secrets x402 passkey wallet deploy longrunning design
- verify after each phase
- auto-invokes after deploy

## Debugger

- reactive pipeline debugger
- 1 triage
- 5 categories, 16 sub-types
- 2 smoke tests RPC, wallet, executor
- 3 quick-match 10 known root causes
- 4 diagnosis 6 ordered checks
- 5 fix + verify apply fix, regression-check fixes flow back

## Chain Reference

### Chain

- Chain ID: 1979
- Currency: RITUAL (18 decimals)
- Block Time: ~350ms

### Endpoints

- RPC (HTTP): rpc.ritualfoundation.org
- RPC (WebSocket): rpc.ritualfoundation.org/ws
- Explorer: explorer.ritualfoundation.org

### System Contracts

- RitualWallet — [0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948](https://explorer.ritualfoundation.org/address/0x532F0dF0896F353d8C3DD8cc134e8129DA3948)
- AsyncJobTracker — [0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5](https://explorer.ritualfoundation.org/address/0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5)
- TEEServiceRegistry — [0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F](https://explorer.ritualfoundation.org/address/0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F)
- Scheduler — [0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B](https://explorer.ritualfoundation.org/address/0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B)
- SecretsACL — [0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD](https://explorer.ritualfoundation.org/address/0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD)
- AsyncDelivery — [0x5A16214fF555848411544b005f7Ac063742f39F6](https://explorer.ritualfoundation.org/address/0x5A16214fF555848411544b005f7Ac063742f39F6)

## [Block Explorer](https://explorer.ritualfoundation.org/)

[Open ↗](https://explorer.ritualfoundation.org/)

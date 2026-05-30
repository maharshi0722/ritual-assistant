# Enshrined AI: Computation Primitives

## Classical Models (ONNX, 0x0800)

Run ML models synchronously. Precompile takes RitualTensor and Hugging Face model ID; result comes back in same call frame.

**Synchronous**: encode input, call precompile, get result immediately. No async lifecycle.

### Model Format

Models load from Hugging Face using: `hf/owner/repo/file.onnx@commit`

Use full 40-character commit hash. Branch names are rejected to keep model lineage reproducible.

### RitualTensor Format

```
uint8 dtype | uint16[] shape | int32[] values
```

### Solidity Example

```solidity
contract Classifier {
    function classify(bytes calldata tensorBytes) external view returns (bytes memory) {
        (bool ok, bytes memory result) = address(0x0800).staticcall(
            abi.encode(
                bytes("hf/owner/repo/model.onnx@abc123..."),
                tensorBytes,
                uint8(2),  // IEEE754
                uint8(0),  // scale
                uint8(2),  // output
                uint8(0),  // output scale
                uint8(1)   // half-even rounding
            )
        );
        require(ok, "ONNX inference failed");
        return result;
    }
}
```

## LLM Inference (0x0802)

Frontier LLM (zai-org/GLM-4.7-FP8, 64K context) runs inside TEE. No API keys needed.

**Short-running async (SPC)**: submit prompt, receive completion in same transaction.

**Streaming**: enable streaming flag, tokens arrive via SSE with EIP-712 signatures before finalization.

### Open-Weight Model

GLM-4.7-FP8 (64K context, MIT license) hosted directly in TEE fleet. Unlike HTTP calls to OpenAI/Anthropic, no external API required.

### Key Fields

- messages: OpenAI-compatible messages array (JSON)
- model: e.g. `zai-org/GLM-4.7-FP8`
- temperature: ×1000 (e.g. 700 = 0.7)
- convoHistory: required StorageRef tuple (platform, path, keyRef)
- stream: boolean for SSE streaming
- piiEnabled: incompatible with streaming

## FHE Inference (0x0807)

Run inference on encrypted data. Inputs and outputs stay ciphertext throughout.

**Two-phase async**: submit encrypted tensor → receive encrypted result via callback. Only key holder can decrypt.

### CKKS Encryption

Approximate arithmetic on encrypted floating-point tensors. Perfect for sensitive data: medical records, financial portfolios, private communications.

### Executor Capability

Executor must advertise Capability 10 (FHE). Pass evaluation key reference so executor can perform homomorphic operations without seeing plaintext.

## ZK Proofs (0x0806)

Request zero-knowledge proof generation. Prove creditworthiness without revealing financials. Verify identity without exposing documents.

**Two-phase async**: Phase 1 submits proof job → Phase 2 delivers proof via callback.

### Important

Uses ExecutorRequest layout, not LongRunningRequest. Swapping addresses on copied struct causes revert.

## Multimodal Processing

### Image Generation (0x0818)

Generate images from text/image prompts.

### Audio Generation (0x0819)

Generate audio from text/image prompts.

### Video Generation (0x081A)

Generate video from text/image/audio prompts.

All three share 18-field ABI. Two-phase async with result delivered via callback.

### ModalInput

```solidity
(uint8 inputType, bytes data, string uri, bytes32 contentHash, uint32 param1, uint32 param2, bool encrypted)
```

Input types: 0=TEXT, 1=IMAGE, 2=AUDIO, 3=VIDEO

### OutputConfig

Control output dimensions, encryption, guidance, steps, seed, FPS, negative prompt.

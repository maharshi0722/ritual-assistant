// ── Ritual Chain Configuration ──

export const RITUAL_CHAIN = {
  // Network Details
  chainId: 1979,
  chainName: "Ritual Chain",
  currency: "RITUAL",
  decimals: 18,
  blockTime: 350, // milliseconds

  // RPC Endpoints
  rpcHttp: "https://rpc.ritualfoundation.org",
  rpcWebSocket: "wss://rpc.ritualfoundation.org/ws",

  // Explorer
  explorerUrl: "https://explorer.ritualfoundation.org",

  // System Contracts
  contracts: {
    ritualWallet: "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948",
    asyncJobTracker: "0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5",
    teeServiceRegistry: "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F",
    scheduler: "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B",
    secretsACL: "0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD",
  },
};

// ── Helper function to get block explorer link ──
export function getExplorerLink(type, value) {
  const baseUrl = RITUAL_CHAIN.explorerUrl;

  switch (type) {
    case "address":
      return `${baseUrl}/address/${value}`;
    case "tx":
      return `${baseUrl}/tx/${value}`;
    case "block":
      return `${baseUrl}/block/${value}`;
    default:
      return baseUrl;
  }
}

// ── Function to add Ritual Chain to MetaMask ──
export async function addRitualChainToMetaMask(provider) {
  try {
    await provider.send("wallet_addEthereumChain", [
      {
        chainId: `0x${RITUAL_CHAIN.chainId.toString(16)}`,
        chainName: RITUAL_CHAIN.chainName,
        nativeCurrency: {
          name: RITUAL_CHAIN.currency,
          symbol: RITUAL_CHAIN.currency,
          decimals: RITUAL_CHAIN.decimals,
        },
        rpcUrls: [RITUAL_CHAIN.rpcHttp],
        blockExplorerUrls: [RITUAL_CHAIN.explorerUrl],
      },
    ]);
    return true;
  } catch (error) {
    if (error.code !== 4001) {
      console.error("Error adding Ritual Chain:", error);
    }
    return false;
  }
}

// ── Function to switch to Ritual Chain ──
export async function switchToRitualChain(provider) {
  try {
    await provider.send("wallet_switchEthereumChain", [
      { chainId: `0x${RITUAL_CHAIN.chainId.toString(16)}` },
    ]);
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      return await addRitualChainToMetaMask(provider);
    }
    console.error("Error switching chain:", switchError);
    return false;
  }
}

// ── Function to check if currently on Ritual Chain ──
export async function isOnRitualChain(provider) {
  try {
    const chainId = await provider.send("eth_chainId", []);
    return chainId === `0x${RITUAL_CHAIN.chainId.toString(16)}`;
  } catch (error) {
    console.error("Error checking chain:", error);
    return false;
  }
}

// ── Function to format contract address ──
export function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

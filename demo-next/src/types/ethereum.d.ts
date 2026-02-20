export {};

type EthereumProvider = {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: 'accountsChanged' | 'chainChanged', handler: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: 'accountsChanged' | 'chainChanged',
    handler: (...args: unknown[]) => void
  ) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Network = 'twitter' | 'linkedin'

type NetworkContextValue = {
  network: Network
  setNetwork: (n: Network) => void
  toggle: () => void
  isLi: boolean
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

const KEY = 'sa-network'

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<Network>('twitter')

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Network | null
      if (saved === 'twitter' || saved === 'linkedin') setNetworkState(saved)
    } catch {}
  }, [])

  const setNetwork = (n: Network) => {
    setNetworkState(n)
    try { localStorage.setItem(KEY, n) } catch {}
    // Update <html> data-attr so CSS can theme accordingly
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.network = n
    }
  }

  // Sync data-attr after hydration
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.network = network
    }
  }, [network])

  const toggle = () => setNetwork(network === 'twitter' ? 'linkedin' : 'twitter')

  return (
    <NetworkContext.Provider value={{ network, setNetwork, toggle, isLi: network === 'linkedin' }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext)
  if (!ctx) {
    // Fallback for tests / edge cases : return a no-op shape
    return {
      network: 'twitter',
      setNetwork: () => {},
      toggle: () => {},
      isLi: false,
    }
  }
  return ctx
}

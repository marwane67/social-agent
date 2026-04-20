import type { AppProps } from 'next/app'
import { NetworkProvider } from '../lib/network-context'
import '../styles/globals.css'
import '../styles/echevin.css'
import '../styles/admin.css'
import '../styles/responsive.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NetworkProvider>
      <Component {...pageProps} />
    </NetworkProvider>
  )
}

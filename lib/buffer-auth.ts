// Helper pour extraire un override token depuis la requête
// (utilisé par les API routes Buffer)

import type { NextApiRequest } from 'next'
import { setOverrideToken } from './buffer'

export function applyUserToken(req: NextApiRequest): void {
  const headerToken = req.headers['x-buffer-token']
  if (typeof headerToken === 'string' && headerToken.length > 20) {
    setOverrideToken(headerToken)
  } else {
    setOverrideToken(null)
  }
}

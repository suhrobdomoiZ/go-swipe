import { createContext, useContext } from 'react';

/**
 * Сессия после POST /auth/max.
 * { user, needOnboarding, updateSession(patch) } — задаётся в AuthGate.
 */
export const SessionContext = createContext(null);

export function useSession() {
  return useContext(SessionContext);
}

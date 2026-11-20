import { createContext, useContext } from 'react'

/** True once the guest has opened the envelope; the card's entrance waits for it. */
export const OpenedContext = createContext(true)
export const useOpened = () => useContext(OpenedContext)

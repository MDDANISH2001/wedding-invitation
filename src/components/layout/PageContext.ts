import { createContext, useContext } from 'react'
import { motionValue, type MotionValue } from 'motion/react'

export interface PageCtx {
  /** 0 when the page's top is one viewport below, 1 when it reaches the top. */
  enter: MotionValue<number>
  index: number
}

const fallback = motionValue(1)
export const PageContext = createContext<PageCtx>({ enter: fallback, index: 0 })
export const usePage = () => useContext(PageContext)

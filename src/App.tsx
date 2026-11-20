import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { useState } from 'react'
import { InvitationBook, type PageDef } from './components/layout/InvitationBook'
import { EnvelopeGate } from './components/layout/EnvelopeGate'
import { OpenedContext } from './components/layout/OpenedContext'
import { InvitationHero } from './components/sections/InvitationHero'
import { WeddingEvents } from './components/sections/WeddingEvents'
import { ClosingInvitation } from './components/sections/ClosingInvitation'
import { FxLayer } from './fx/FxLayer'

const PAGES: PageDef[] = [
  { id: 'invitation', label: 'Invitation', Component: InvitationHero },
  { id: 'programme', label: 'Programme', Component: WeddingEvents },
  { id: 'duas', label: 'Duas & RSVP', Component: ClosingInvitation },
]

export default function App() {
  const [opened, setOpened] = useState(false)

  return (
    <LazyMotion features={domAnimation} strict>
      {/* reducedMotion="user": Motion drops transform animations for guests who ask for less motion. */}
      <MotionConfig reducedMotion="user">
        <OpenedContext.Provider value={opened}>
          <InvitationBook pages={PAGES} />
          {!opened && <EnvelopeGate onLanded={() => setOpened(true)} />}
          {opened && <FxLayer />}
        </OpenedContext.Provider>
      </MotionConfig>
    </LazyMotion>
  )
}

import * as React from 'react'
import * as css from '@plumeria/core'

export const cardStyles = css.create({
  cardDashed: {
    padding: '1.5rem',
    border: '2px dashed #cbd5e0',
    borderRadius: '0.75rem'
  },
  h3: {
    margin: '0 0 0.5rem',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#2d3748',
  },
  text: {
    margin: '0',
    color: '#4a5568',
  },
})

export function InteractiveCard({ children }: { children?: React.ReactNode }) {
  return (
    <div styleName={cardStyles.cardDashed}>
      <h3 styleName={cardStyles.h3}>Interactive Server Card</h3>
      <p styleName={cardStyles.text}>
        The box above is a server-rendered shell. The content below is a client-side layout "slot".
      </p>
      <div>{children}</div>
    </div>
  )
}

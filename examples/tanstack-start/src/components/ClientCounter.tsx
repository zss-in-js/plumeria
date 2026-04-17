import * as React from 'react'
import * as css from '@plumeria/core'

export const counterStyles = css.create({
  counterBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: '#f7fafc',
    padding: '1rem',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
    marginTop: '1.5rem',
  },
  counterLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#718096',
  },
  counterValue: {
    fontSize: '2.25rem',
    fontWeight: '900',
    color: '#2d3748',
  },
  button: {
    borderRadius: '9999px',
    background: 'linear-gradient(90deg, #56c6be, #7ed3bf)',
    color: 'white',
    padding: '0.5rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(86,198,190,0.25)',
  },
})

export function ClientCounter() {
  const [count, setCount] = React.useState(0)
  return (
    <div styleName={counterStyles.counterBox}>
      <div styleName={counterStyles.counterLabel}>Client-Side State</div>
      <div styleName={counterStyles.counterValue}>{count}</div>
      <button styleName={counterStyles.button} onClick={() => setCount((c) => c + 1)}>
        Increment Counter
      </button>
    </div>
  )
}

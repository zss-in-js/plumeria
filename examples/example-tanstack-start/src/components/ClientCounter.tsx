import * as React from 'react'
import * as css from '@plumeria/core'

export const counterStyles = css.create({
  counterBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    alignItems: 'center',
    padding: '1rem',
    marginTop: '1.5rem',
    backgroundColor: '#f7fafc',
    borderRadius: '0.5rem',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
  },
  counterLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  counterValue: {
    fontSize: '2.25rem',
    fontWeight: '900',
    color: '#2d3748',
  },
  button: {
    padding: '0.5rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'white',
    cursor: 'pointer',
    background: 'linear-gradient(90deg, #56c6be, #7ed3bf)',
    border: 'none',
    borderRadius: '9999px',
    boxShadow: '0 4px 6px rgba(86,198,190,0.25)'
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

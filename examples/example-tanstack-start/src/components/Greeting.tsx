import * as css from '@plumeria/core'

const styles = css.create({
  card: {
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
  time: {
    marginTop: '1rem',
    fontSize: '0.75rem',
    color: '#a0aec0',
  },
})

export function Greeting({ name }: { name: string }) {
  return (
    <div styleName={styles.card}>
      <h3 styleName={styles.h3}>Hello from React Server Component!</h3>
      <p styleName={styles.text}>
        This message was rendered by <strong>{name}</strong> on the server.
      </p>
      <div styleName={styles.time}>
        Time: {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}

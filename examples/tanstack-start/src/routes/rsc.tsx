import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  renderServerComponent,
  CompositeComponent,
  createCompositeComponent,
} from '@tanstack/react-start/rsc'
import { Greeting } from '../components/Greeting'
import { InteractiveCard } from '../components/InteractiveCard'
import { ClientCounter } from '../components/ClientCounter'

const getRSCDemo = createServerFn({ method: 'GET' }).handler(async () => {
  const Renderable = await renderServerComponent(<Greeting name="TanStack Start" />)
  return { Renderable }
})

/**
 * Composite RSC Example
 */
const getCompositeDemo = createServerFn({ method: 'GET' }).handler(async () => {
  const src = await createCompositeComponent(
    (props: { children?: React.ReactNode }) => (
      <InteractiveCard>
        {props.children}
      </InteractiveCard>
    ),
  )
  return { src }
})

export const Route = createFileRoute('/rsc')({
  loader: async () => {
    const [rsc, composite] = await Promise.all([
      getRSCDemo(),
      getCompositeDemo(),
    ])
    return {
      Greeting: rsc.Renderable,
      CardSource: composite.src,
    }
  },
  component: RSCPage,
})

function RSCPage() {
  const { Greeting, CardSource } = Route.useLoaderData()

  return (
    <div style={{ padding: '3rem', maxWidth: '42rem', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#1a202c', margin: '0 0 1rem' }}>RSC Test Page</h1>
        <p style={{ fontSize: '1.125rem', color: '#4a5568', margin: '0' }}>
          Testing React Server Components with Plumeria in TanStack Start.
        </p>
      </header>

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#718096', marginBottom: '1rem' }}>1. Basic renderServerComponent</h2>
        {Greeting}
      </div>

      <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '3rem 0' }} />

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#718096', marginBottom: '1rem' }}>2. createCompositeComponent (Slots)</h2>
        <CompositeComponent src={CardSource}>
          <ClientCounter />
        </CompositeComponent>
      </div>

      <footer style={{ marginTop: '4rem', padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#718096', backgroundColor: '#f7fafc', borderRadius: '0.5rem' }}>
        Check the browser network tab to see the RSC payload!
      </footer>
    </div>
  )
}

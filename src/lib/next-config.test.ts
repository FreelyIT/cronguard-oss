import { test } from 'node:test'
import assert from 'node:assert/strict'
// next.config.mjs is untyped JavaScript; this is the object Next loads.
import nextConfig from '../../next.config.mjs'

type Header = { key: string; value: string }
type HeaderRule = { source: string; headers: Header[] }

async function headersFor(source: string): Promise<Header[]> {
  // Untyped JavaScript config, see the import above.
  const rules = await (nextConfig as { headers?: () => Promise<HeaderRule[]> }).headers?.()
  return rules?.find((rule) => rule.source === source)?.headers ?? []
}

function valueOf(headers: Header[], key: string): string | undefined {
  return headers.find((header) => header.key === key)?.value
}

test('next.config forbids MIME sniffing on every path', async () => {
  const headers = await headersFor('/:path*')

  assert.equal(valueOf(headers, 'X-Content-Type-Options'), 'nosniff')
})

test('next.config forbids framing on every path', async () => {
  const headers = await headersFor('/:path*')

  assert.equal(valueOf(headers, 'X-Frame-Options'), 'DENY')
})

test('next.config sends a referrer and permissions policy on every path', async () => {
  const headers = await headersFor('/:path*')

  assert.equal(valueOf(headers, 'Referrer-Policy'), 'strict-origin-when-cross-origin')
  assert.equal(valueOf(headers, 'Permissions-Policy'), 'camera=(), microphone=(), geolocation=()')
})

test('next.config turns the legacy XSS auditor off, as OWASP advises', async () => {
  const headers = await headersFor('/:path*')

  assert.equal(valueOf(headers, 'X-XSS-Protection'), '0')
})

test('next.config CSP only allows the app itself as a source', async () => {
  const headers = await headersFor('/:path*')

  const csp = valueOf(headers, 'Content-Security-Policy') ?? ''

  assert.match(csp, /default-src 'self'/)
  assert.match(csp, /object-src 'none'/)
  assert.match(csp, /frame-ancestors 'none'/)
  assert.doesNotMatch(csp, /https?:\/\//, 'self-hosted build must not allow third-party hosts')
})

test('next.config sends no HSTS, which belongs on the TLS-terminating proxy', async () => {
  const headers = await headersFor('/:path*')

  assert.equal(valueOf(headers, 'Strict-Transport-Security'), undefined)
})

test('next.config disables caching of API responses', async () => {
  const headers = await headersFor('/api/:path*')

  assert.equal(valueOf(headers, 'Cache-Control'), 'no-store, no-cache, must-revalidate')
})

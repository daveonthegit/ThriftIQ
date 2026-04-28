'use client'

import { CSSProperties, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  ACCENTS, Accent, FONT_BODY, FONT_DISPLAY_BY_THEME, FONT_MONO,
  INITIAL_INVENTORY, InventoryItem, Item, RECENT, THEMES, Theme, TRENDING,
  calcProfit, findItem, stats,
} from './data'
import { Icons, Swatch } from './icons'

type Route = 'search' | 'item' | 'inventory' | 'history' | 'profit'

const THEME: Theme = 'streetwear'
const ACCENT: Accent = 'acid'
const BUY_THRESHOLD = 50

const T = THEMES[THEME]
const A = ACCENTS[ACCENT]
const display = FONT_DISPLAY_BY_THEME[THEME]

type SearchRecord = {
  id: string
  query: string
  title: string
  median: number
  confidence: string
  verdict: 'BUY' | 'SKIP' | 'WATCH'
  searchedAt: string
}

// ─── Atoms ──────────────────────────────────────────────────────────────────
function WBtn({
  children, onClick, variant = 'primary', full, style = {}, disabled, size = 'md', type,
}: {
  children: ReactNode; onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  full?: boolean; style?: CSSProperties; disabled?: boolean;
  size?: 'sm' | 'md' | 'lg'; type?: 'button' | 'submit'
}) {
  const sizes = { sm: { h: 32, px: 12, fs: 12 }, md: { h: 40, px: 16, fs: 13 }, lg: { h: 48, px: 22, fs: 14 } } as const
  const sz = sizes[size]
  const variants = {
    primary: { background: A.hex, color: A.ink, border: 'none' },
    secondary: { background: T.surface2, color: T.text, border: `1px solid ${T.border}` },
    ghost: { background: 'transparent', color: T.text, border: `1px solid ${T.borderStrong}` },
  } as const
  return (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled} style={{
      ...variants[variant], height: sz.h, padding: `0 ${sz.px}px`,
      width: full ? '100%' : undefined,
      borderRadius: 10, fontFamily: FONT_BODY, fontSize: sz.fs, fontWeight: 700,
      letterSpacing: 0.02, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      transition: 'transform .1s, filter .15s', ...style,
    }}>{children}</button>
  )
}

function WCard({ children, style = {}, pad = 20 }: { children: ReactNode; style?: CSSProperties; pad?: number }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: pad, ...style,
    }}>{children}</div>
  )
}

function WPill({ children, kind = 'mute' }: {
  children: ReactNode; kind?: 'mute' | 'accent' | 'skip' | 'warn' | 'outline'
}) {
  const map = {
    mute: { bg: T.surface2, fg: T.text, border: undefined },
    accent: { bg: A.hex, fg: A.ink, border: undefined },
    skip: { bg: T.skip, fg: '#fff', border: undefined },
    warn: { bg: T.warn, fg: '#000', border: undefined },
    outline: { bg: 'transparent', fg: T.textMute, border: `1px solid ${T.borderStrong}` },
  } as const
  const s = map[kind]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 999,
      background: s.bg, color: s.fg, border: s.border,
      fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
      letterSpacing: 0.1, textTransform: 'uppercase',
    }}>{children}</span>
  )
}

// ─── Sign-in ────────────────────────────────────────────────────────────────
function WebSignIn({ onAuth }: { onAuth: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const auth = (m: string) => { setLoading(m); setTimeout(onAuth, 700) }

  const accentRGB = (() => {
    const h = A.hex.replace('#', '')
    const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h
    return `${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)}`
  })()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, color: T.text }}>
      <div style={{
        flex: 1.2, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 56, minHeight: '100vh', background: T.bg,
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center 35%',
          filter: 'contrast(1.05) saturate(0.85)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `linear-gradient(180deg, rgba(${accentRGB},0.18) 0%, rgba(0,0,0,0.30) 40%, rgba(0,0,0,0.65) 75%, ${T.bg} 100%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, opacity: 0.3,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.55) 1px, transparent 1.5px)',
          backgroundSize: '5px 5px', mixBlendMode: 'multiply',
        }} />
        <div style={{
          position: 'absolute', top: 56, right: 56, zIndex: 1,
          padding: '5px 12px', background: A.hex, color: A.ink,
          fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
          letterSpacing: 0.18, textTransform: 'uppercase',
          transform: 'rotate(3deg)', boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
        }}>resale</div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11,
            letterSpacing: 0.2, textTransform: 'uppercase', color: T.textMute,
          }}>ThriftIQ ◇ v2 prototype</div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: display, fontSize: 132, lineHeight: 0.88,
            letterSpacing: -0.04, fontWeight: 500,
          }}>
            Thrift<span style={{ fontStyle: 'italic', color: A.hex }}>IQ</span>
          </div>
          <div style={{
            fontFamily: '"Bebas Neue"', fontSize: 56, lineHeight: 0.95,
            letterSpacing: 0.02, marginTop: 16, color: T.text,
          }}>
            Source <span style={{ color: A.hex }}>smarter.</span>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '40px 64px', maxWidth: 540,
      }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 11, color: A.hex,
          letterSpacing: 0.18, textTransform: 'uppercase',
        }}>{mode === 'signin' ? 'Welcome back' : 'Get started'}</div>
        <div style={{
          fontFamily: display, fontSize: 44, lineHeight: 1.05,
          fontWeight: 500, marginTop: 8, letterSpacing: -0.01,
        }}>
          {mode === 'signin' ? (
            <>Sign in to <span style={{ fontStyle: 'italic', color: A.hex }}>ThriftIQ</span></>
          ) : (
            <>Create your <span style={{ fontStyle: 'italic', color: A.hex }}>account</span></>
          )}
        </div>

        <div style={{
          display: 'flex', gap: 4, padding: 4, marginTop: 32,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
        }}>
          {(['signin', 'signup'] as const).map(k => (
            <button key={k} onClick={() => setMode(k)} style={{
              flex: 1, height: 36, borderRadius: 8, border: 'none',
              background: mode === k ? T.surface2 : 'transparent',
              color: mode === k ? T.text : T.textMute,
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{k === 'signin' ? 'Sign in' : 'Create account'}</button>
          ))}
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="you@studio.com" style={{
            height: 50, padding: '0 16px', borderRadius: 12,
            background: T.surface, border: `1px solid ${T.border}`,
            color: T.text, fontFamily: FONT_BODY, fontSize: 14, outline: 'none',
          }} />
          <input placeholder="Password" type="password" style={{
            height: 50, padding: '0 16px', borderRadius: 12,
            background: T.surface, border: `1px solid ${T.border}`,
            color: T.text, fontFamily: FONT_BODY, fontSize: 14, outline: 'none',
          }} />
        </div>

        <div style={{ marginTop: 14 }}>
          <WBtn full size="lg" onClick={() => auth('email')}>
            {loading === 'email'
              ? mode === 'signin' ? 'Signing in…' : 'Creating account…'
              : mode === 'signin' ? 'Sign in' : 'Create account'}
            {!loading && Icons.arrow}
          </WBtn>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10, color: T.textFaint,
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <WBtn variant="secondary" full size="lg" onClick={() => auth('google')} style={{ flex: 1 }}>
            {loading === 'google' ? '…' : <>{Icons.google} <span>Google</span></>}
          </WBtn>
          <WBtn variant="secondary" full size="lg" onClick={() => auth('apple')} style={{ flex: 1 }}>
            {loading === 'apple' ? '…' : <>{Icons.apple} <span>Apple</span></>}
          </WBtn>
        </div>

        <div style={{ marginTop: 28, fontSize: 12, color: T.textFaint }}>
          {mode === 'signin' ? (
            <>New to ThriftIQ?{' '}
              <button onClick={() => setMode('signup')} style={linkBtnStyle}>Create an account</button>
            </>
          ) : (
            <>Already a member?{' '}
              <button onClick={() => setMode('signin')} style={linkBtnStyle}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const linkBtnStyle: CSSProperties = {
  background: 'transparent', border: 'none', color: T.text,
  fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 12,
  textDecoration: 'underline', textUnderlineOffset: 3,
}

// ─── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ screen, onNav }: { screen: Route; onNav: (r: Route) => void }) {
  const items: { id: Route; label: string; icon: ReactNode }[] = [
    { id: 'search', label: 'Source', icon: Icons.search },
    { id: 'inventory', label: 'Inventory', icon: Icons.bag },
    { id: 'history', label: 'History', icon: Icons.history },
    { id: 'profit', label: 'Profit', icon: Icons.profit },
  ]
  return (
    <aside style={{
      width: 232, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      background: T.surface, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', padding: '20px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 22px' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: A.hex,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.ink,
          fontFamily: FONT_MONO, fontWeight: 800, fontSize: 14,
        }}>T</div>
        <div style={{
          fontFamily: display, fontSize: 22, fontWeight: 600,
          letterSpacing: -0.01, color: T.text,
        }}>ThriftIQ</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => {
          const active = screen === it.id
          return (
            <button key={it.id} onClick={() => onNav(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10,
              background: active ? T.surface2 : 'transparent',
              color: active ? T.text : T.textMute,
              border: 'none', cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
              textAlign: 'left', position: 'relative',
            }}>
              <span style={{ display: 'flex', color: active ? A.hex : T.textMute }}>{it.icon}</span>
              {it.label}
              {active && <span style={{
                position: 'absolute', left: 0, top: 8, bottom: 8, width: 2,
                background: A.hex, borderRadius: 999,
              }} />}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{
          padding: 14, borderRadius: 12, background: T.surface2,
          border: `1px solid ${T.border}`, marginBottom: 12,
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 0.14,
            textTransform: 'uppercase', color: T.textFaint,
          }}>Free tier</div>
          <div style={{ fontSize: 12, color: T.text, marginTop: 4, lineHeight: 1.4 }}>
            7 / 10 searches today
          </div>
          <div style={{
            height: 3, background: T.border, borderRadius: 999,
            marginTop: 8, overflow: 'hidden',
          }}>
            <div style={{ height: '100%', width: '70%', background: A.hex, borderRadius: 999 }} />
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 8, borderRadius: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 999,
            background: `linear-gradient(135deg, ${A.hex}, ${T.text})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.bg, fontFamily: FONT_MONO, fontWeight: 800, fontSize: 12,
          }}>R</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>resale.king</div>
            <div style={{ fontSize: 10, color: T.textFaint, fontFamily: FONT_MONO }}>Pro · 14d trial</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ─── Source / Search ────────────────────────────────────────────────────────
function WebSource({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState('')
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '48px 56px 80px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.18,
          textTransform: 'uppercase', color: A.hex,
        }}>Source</div>
        <div style={{
          fontFamily: display, fontSize: 72, lineHeight: 0.95,
          letterSpacing: -0.02, color: T.text, marginTop: 14, fontWeight: 400,
        }}>
          What did you<br />
          <span style={{ fontStyle: 'italic', color: A.hex }}>find</span> today?
        </div>

        <form onSubmit={e => { e.preventDefault(); if (q.trim()) onSearch(q) }}
          style={{ marginTop: 36, display: 'flex', gap: 10 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 12,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: '0 18px', height: 64,
          }}>
            <span style={{ color: T.textMute, display: 'flex' }}>{Icons.search}</span>
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search a brand, item, or SKU…  e.g. Carhartt Detroit J97"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: T.text, fontFamily: FONT_BODY, fontSize: 17, height: '100%',
              }} />
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, color: T.textFaint,
              letterSpacing: 0.1, padding: '3px 7px',
              border: `1px solid ${T.border}`, borderRadius: 6,
            }}>⌘K</span>
          </div>
          <WBtn type="submit" size="lg" disabled={!q.trim()}>Run comps {Icons.arrow}</WBtn>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 40 }}>
          <div>
            <div style={sectionLabel}>Trending</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TRENDING.map(t => (
                <button key={t} onClick={() => onSearch(t)} style={{
                  background: T.surface, border: `1px solid ${T.border}`,
                  color: T.text, padding: '10px 14px', borderRadius: 999,
                  fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={sectionLabel}>Recent</div>
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 14, overflow: 'hidden',
            }}>
              {RECENT.map((r, i) => (
                <button key={r} onClick={() => onSearch(r)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '12px 14px', background: 'transparent',
                  border: 'none', borderTop: i ? `1px solid ${T.border}` : 'none',
                  color: T.text, fontFamily: FONT_BODY, fontSize: 13,
                  textAlign: 'left', cursor: 'pointer',
                }}>
                  <span style={{ color: T.textFaint, display: 'flex' }}>{Icons.search}</span>
                  <span style={{ flex: 1 }}>{r}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <div style={sectionLabel}>How it works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { n: '01', t: 'Search', d: 'Real eBay sold listings, last 90 days. Outliers trimmed at 1.5× IQR.' },
              { n: '02', t: 'Calculate', d: 'Enter your buy price. We model fees, shipping, and your target margin.' },
              { n: '03', t: 'BUY or SKIP', d: 'Get a clear verdict in under two seconds. Save winners to inventory.' },
            ].map(s => (
              <WCard key={s.n}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: A.hex, letterSpacing: 0.14 }}>{s.n}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginTop: 6 }}>{s.t}</div>
                <div style={{ fontSize: 13, color: T.textMute, marginTop: 6, lineHeight: 1.5 }}>{s.d}</div>
              </WCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const sectionLabel: CSSProperties = {
  fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.16,
  textTransform: 'uppercase', color: T.textFaint, marginBottom: 14,
}

// ─── Item detail ────────────────────────────────────────────────────────────
function WebItem({
  query, item, onSave, onListing, onBack,
}: {
  query: string; item: Item;
  onSave: (p: { item: Item; cost: number; est: number }) => void;
  onListing: (item: Item, sellPrice: number) => void;
  onBack: () => void;
}) {
  const s = useMemo(() => stats(item.comps), [item])
  const [cost, setCost] = useState(20)
  const [shipping, setShipping] = useState(12)
  const [sellPrice, setSellPrice] = useState(Math.round(s.median))
  const [phase, setPhase] = useState<'loading' | 'done'>('loading')

  useEffect(() => {
    setPhase('loading')
    setSellPrice(Math.round(s.median))
    const t = setTimeout(() => setPhase('done'), 700)
    return () => clearTimeout(t)
  }, [query, s.median])

  const calc = calcProfit({ sellPrice, cost, shipping })
  const verdict =
    s.confidence === 'Low' ? 'LOW_CONF' :
    calc.margin >= BUY_THRESHOLD ? 'BUY' : 'SKIP'
  const verdictColor = verdict === 'BUY' ? A.hex : verdict === 'SKIP' ? T.skip : T.warn
  const verdictInk = verdict === 'BUY' ? A.ink : '#fff'
  const verdictLabel = verdict === 'BUY' ? 'BUY' : verdict === 'SKIP' ? 'SKIP' : 'LOW CONF'

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px 40px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none', color: T.textMute,
          fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.1,
          textTransform: 'uppercase', cursor: 'pointer', padding: 0,
        }}>{Icons.back} Source</button>
        <span style={{ color: T.textFaint }}>/</span>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 11, color: T.text,
          letterSpacing: 0.1, textTransform: 'uppercase',
        }}>{query}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
        <Swatch a={item.swatch} b={item.swatch2} size={88} radius={16} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: display, fontSize: 38, lineHeight: 1.05,
            fontWeight: 500, color: T.text, letterSpacing: -0.01,
          }}>{item.title}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <WPill kind="outline">{item.sub}</WPill>
            <WPill>{s.n} sold · 90d</WPill>
            <WPill kind={s.confidence === 'High' ? 'accent' : s.confidence === 'Medium' ? 'mute' : 'warn'}>
              {s.confidence} confidence
            </WPill>
          </div>
        </div>
      </div>

      {phase === 'loading' ? <Skeleton /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <WCard pad={22}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <BigStat label="Median" value={`$${Math.round(s.median)}`} hi />
                <BigStat label="Mean" value={`$${Math.round(s.mean)}`} />
                <BigStat label="Range" value={`$${s.min}–$${s.max}`} />
                <BigStat label="IQR" value={`$${Math.round(s.iqr)}`} />
              </div>
              <div style={{ height: 1, background: T.border, margin: '20px 0' }} />
              <CompChart item={item} />
            </WCard>

            <WCard pad={0}>
              <div style={{
                padding: '14px 18px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                borderBottom: `1px solid ${T.border}`,
              }}>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.1,
                  textTransform: 'uppercase', color: T.text, fontWeight: 700,
                }}>Recent sold · {item.comps.length}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textFaint }}>
                  via eBay · cached 4m ago
                </div>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 90px 90px 100px 90px',
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.1,
                textTransform: 'uppercase', color: T.textFaint,
                padding: '10px 18px', borderBottom: `1px solid ${T.border}`,
              }}>
                <div>Listing</div><div>Size</div><div>Condition</div><div>Sold</div>
                <div style={{ textAlign: 'right' }}>Price</div>
              </div>
              {item.comps.slice(0, 10).map((c, i) => {
                const dist = Math.abs(c.price - s.median) / s.median
                const tone = dist > 0.3 ? T.textFaint : T.text
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr 90px 90px 100px 90px',
                    padding: '12px 18px', alignItems: 'center',
                    borderBottom: i < 9 ? `1px solid ${T.border}` : 'none',
                    fontFamily: FONT_BODY, fontSize: 13, color: tone,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Swatch a={item.swatch} b={item.swatch2} size={28} radius={6} />
                      <span>{item.title.split(' ').slice(0, 4).join(' ')}…</span>
                      {c.soldFast && <WPill kind="accent">fast</WPill>}
                    </div>
                    <div style={{ fontFamily: FONT_MONO }}>{c.size}</div>
                    <div>{c.condition}</div>
                    <div style={{ fontFamily: FONT_MONO, color: T.textMute }}>{c.daysAgo}d ago</div>
                    <div style={{
                      textAlign: 'right', fontFamily: FONT_MONO, fontWeight: 700,
                      color: T.text, fontVariantNumeric: 'tabular-nums',
                    }}>${c.price}</div>
                  </div>
                )
              })}
            </WCard>
          </div>

          <div style={{
            position: 'sticky', top: 0, alignSelf: 'flex-start',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{
              background: verdictColor, color: verdictInk,
              borderRadius: 16, padding: 22, position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{
                    fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.18,
                    textTransform: 'uppercase', opacity: 0.7,
                  }}>Recommendation</div>
                  <div style={{
                    fontFamily: display, fontSize: 64, lineHeight: 0.9,
                    fontWeight: 700, marginTop: 4, letterSpacing: -0.02,
                  }}>{verdictLabel}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: FONT_MONO, fontSize: 10, opacity: 0.7,
                    textTransform: 'uppercase', letterSpacing: 0.16,
                  }}>Margin</div>
                  <div style={{
                    fontFamily: FONT_MONO, fontSize: 26, fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{calc.margin >= 0 ? '+' : ''}{Math.round(calc.margin)}%</div>
                </div>
              </div>
              <div style={{ fontSize: 12, marginTop: 12, opacity: 0.78, lineHeight: 1.45 }}>
                {verdict === 'BUY' && `Margin ${Math.round(calc.margin)}% ≥ ${BUY_THRESHOLD}% threshold. Confidence: ${s.confidence}.`}
                {verdict === 'SKIP' && `Margin ${Math.round(calc.margin)}% < ${BUY_THRESHOLD}% threshold. Pass.`}
                {verdict === 'LOW_CONF' && `IQR/median = ${(s.iqr / s.median * 100).toFixed(0)}% — comps too varied to call.`}
              </div>
            </div>

            <WCard>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.1,
                textTransform: 'uppercase', fontWeight: 700, color: T.text, marginBottom: 14,
              }}>Inputs</div>
              <NumberRow label="Buy price" value={cost} onChange={setCost} />
              <NumberRow label="Shipping" value={shipping} onChange={setShipping} />
              <NumberRow label="List at" value={sellPrice} onChange={setSellPrice}
                hint={`median $${Math.round(s.median)}`} hl />
            </WCard>

            <WCard>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline', marginBottom: 6,
              }}>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.1,
                  textTransform: 'uppercase', fontWeight: 700, color: T.text,
                }}>Net</span>
                <span style={{
                  fontFamily: display, fontSize: 36, fontWeight: 700,
                  color: A.hex, fontVariantNumeric: 'tabular-nums',
                }}>${calc.profit.toFixed(2)}</span>
              </div>
              <Line label={`Sale ($${sellPrice})`} value={`$${sellPrice.toFixed(2)}`} />
              <Line label="eBay fee 13.25%" value={`−$${calc.fee.toFixed(2)}`} dim />
              <Line label="Shipping" value={`−$${shipping.toFixed(2)}`} dim />
              <Line label="Buy price" value={`−$${cost.toFixed(2)}`} dim last />
            </WCard>

            <div style={{ display: 'flex', gap: 10 }}>
              <WBtn variant="secondary" full size="lg"
                onClick={() => onListing(item, sellPrice)} style={{ flex: 1 }}>
                {Icons.spark} Listing
              </WBtn>
              <WBtn full size="lg"
                onClick={() => onSave({ item, cost, est: Math.round(s.median) })}
                style={{ flex: 1.4 }}>
                {Icons.plus} Save
              </WBtn>
            </div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: T.textFaint,
              textAlign: 'center', letterSpacing: 0.1,
            }}>⌘B to BUY · ⌘L for listing</div>
          </div>
        </div>
      )}
    </div>
  )
}

function BigStat({ label, value, hi }: { label: string; value: string; hi?: boolean }) {
  return (
    <div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.14,
        textTransform: 'uppercase', color: T.textFaint,
      }}>{label}</div>
      <div style={{
        fontFamily: display, fontSize: 30, fontWeight: 700,
        color: hi ? A.hex : T.text, marginTop: 4,
        fontVariantNumeric: 'tabular-nums', letterSpacing: -0.01,
      }}>{value}</div>
    </div>
  )
}

function NumberRow({ label, value, onChange, hint, hl }: {
  label: string; value: number; onChange: (n: number) => void; hint?: string; hl?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: `1px solid ${T.border}`,
    }}>
      <div>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: T.textFaint,
          marginTop: 2, letterSpacing: 0.06,
        }}>{hint}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => onChange(Math.max(0, value - 1))} style={stepBtn}>−</button>
        <div style={{
          minWidth: 80, textAlign: 'center',
          padding: '4px 12px', borderRadius: 8,
          background: hl ? A.hex : T.surface2,
          color: hl ? A.ink : T.text,
          fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}>${value}</div>
        <button onClick={() => onChange(value + 1)} style={stepBtn}>+</button>
      </div>
    </div>
  )
}

const stepBtn: CSSProperties = {
  width: 26, height: 26, borderRadius: 6,
  background: T.surface2, border: `1px solid ${T.border}`,
  color: T.text, cursor: 'pointer', fontSize: 14,
}

function Line({ label, value, dim, last }: { label: string; value: string; dim?: boolean; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: last ? 'none' : `1px solid ${T.border}`,
    }}>
      <span style={{ fontSize: 12, color: dim ? T.textMute : T.text }}>{label}</span>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
        color: T.text, fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  )
}

function CompChart({ item }: { item: Item }) {
  const prices = item.comps.map(c => c.price)
  const min = Math.min(...prices), max = Math.max(...prices)
  const buckets = 24
  const bw = (max - min) / buckets || 1
  const hist = Array(buckets).fill(0)
  prices.forEach(p => {
    const b = Math.min(buckets - 1, Math.floor((p - min) / bw))
    hist[b]++
  })
  const peak = Math.max(...hist)
  const s = stats(item.comps)
  const medBucket = Math.min(buckets - 1, Math.floor((s.median - min) / bw))
  const q1Bucket = Math.min(buckets - 1, Math.floor((s.q1 - min) / bw))
  const q3Bucket = Math.min(buckets - 1, Math.floor((s.q3 - min) / bw))

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 8,
        fontFamily: FONT_MONO, fontSize: 10, color: T.textFaint,
        letterSpacing: 0.08, textTransform: 'uppercase',
      }}>
        <span>Price distribution</span>
        <span>n = {item.comps.length}</span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 3, height: 84,
        position: 'relative', paddingBottom: 18,
      }}>
        {hist.map((h, i) => {
          const inIQR = i >= q1Bucket && i <= q3Bucket
          return (
            <div key={i} style={{
              flex: 1,
              height: `${(h / peak) * 100}%`, minHeight: h > 0 ? 3 : 0,
              background: i === medBucket ? A.hex : inIQR ? T.text : T.borderStrong,
              opacity: i === medBucket ? 1 : inIQR ? 0.7 : 0.4,
              borderRadius: 2, transition: 'all .2s',
            }} />
          )
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: FONT_MONO, fontSize: 10, color: T.textFaint, letterSpacing: 0.05,
      }}>
        <span>${min}</span>
        <span style={{ color: T.textMute }}>q1 ${s.q1}</span>
        <span style={{ color: A.hex, fontWeight: 700 }}>med ${Math.round(s.median)}</span>
        <span style={{ color: T.textMute }}>q3 ${s.q3}</span>
        <span>${max}</span>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
      {[0, 1].map(c => (
        <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[0, 1, 2].map(r => (
            <div key={r} style={{
              height: 140 - r * 30, borderRadius: 14,
              background: T.surface, border: `1px solid ${T.border}`,
              opacity: 0.6, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(90deg, transparent, ${T.surface2}, transparent)`,
                animation: 'thriftiq-shimmer 1.4s linear infinite',
              }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Inventory ──────────────────────────────────────────────────────────────
function WebInventory({
  items, onSearch, onStatusChange,
}: {
  items: InventoryItem[]
  onSearch: () => void
  onStatusChange: (id: string, status: InventoryItem['status']) => void
}) {
  const [filter, setFilter] = useState<'all' | InventoryItem['status']>('all')
  const totalCost = items.reduce((s, x) => s + x.cost, 0)
  const totalEst = items.reduce((s, x) => s + x.est, 0)
  const realized = items.filter(x => x.status === 'sold').reduce((s, x) => s + (x.est - x.cost) * 0.85, 0)
  const pending = items.filter(x => x.status !== 'sold').reduce((s, x) => s + (x.est - x.cost) * 0.85, 0)

  const tabs = ['all', 'sourced', 'listed', 'sold'] as const
  const filtered = filter === 'all' ? items : items.filter(x => x.status === filter)

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px 40px 60px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', marginBottom: 26,
      }}>
        <div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.18,
            textTransform: 'uppercase', color: A.hex,
          }}>Inventory</div>
          <div style={{
            fontFamily: display, fontSize: 48, lineHeight: 1.0,
            fontWeight: 600, marginTop: 6, color: T.text, letterSpacing: -0.01,
          }}>
            {items.length} items ·{' '}
            <span style={{ fontStyle: 'italic', color: A.hex }}>${totalEst.toLocaleString()}</span>
          </div>
        </div>
        <WBtn onClick={onSearch} size="lg">{Icons.plus} New source</WBtn>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14, marginBottom: 26,
      }}>
        <KPI label="Inventory value" value={`$${totalEst.toLocaleString()}`} sub={`${items.length} items`} hi />
        <KPI label="Total spend" value={`$${totalCost}`} sub="cost basis" />
        <KPI label="Pending profit" value={`$${pending.toFixed(0)}`}
          sub={`${items.filter(x => x.status !== 'sold').length} active`} />
        <KPI label="Realized profit" value={`$${realized.toFixed(0)}`} sub="last 90d" />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 14,
      }}>
        <div style={{
          display: 'flex', gap: 6, padding: 4,
          background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`,
        }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              height: 30, padding: '0 14px', borderRadius: 7, border: 'none',
              background: filter === t ? T.surface2 : 'transparent',
              color: filter === t ? T.text : T.textMute,
              fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', textTransform: 'capitalize',
            }}>
              {t}{t !== 'all' ? ` (${items.filter(x => x.status === t).length})` : ` (${items.length})`}
            </button>
          ))}
        </div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 11, color: T.textFaint, letterSpacing: 0.08,
        }}>Sorted: most recent</div>
      </div>

      <WCard pad={0}>
        <div style={invHeaderStyle}>
          <div></div>
          <div>Item</div>
          <div style={{ textAlign: 'right' }}>Cost</div>
          <div style={{ textAlign: 'right' }}>Est. value</div>
          <div>Status</div>
          <div style={{ textAlign: 'right' }}>Margin</div>
          <div style={{ textAlign: 'right' }}>P/L</div>
        </div>
        {filtered.map((it, i) => {
          const pl = it.est - it.cost
          const margin = Math.round(pl / it.cost * 100)
          return (
            <div key={it.id} style={{
              display: 'grid', gridTemplateColumns: '40px 2fr 90px 90px 110px 90px 90px',
              padding: '14px 18px', alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none',
              transition: 'background .12s',
            }}>
              <Swatch a={it.swatch} b={it.swatch2} size={32} radius={7} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{it.title}</div>
                <div style={{
                  fontSize: 11, color: T.textFaint, marginTop: 3, fontFamily: FONT_MONO,
                }}>{it.date}</div>
              </div>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 13,
                fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: T.textMute,
              }}>${it.cost}</div>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700,
                fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: T.text,
              }}>${it.est}</div>
              <div>
                <select
                  value={it.status}
                  onChange={e => onStatusChange(it.id, e.target.value as InventoryItem['status'])}
                  aria-label={`Update status for ${it.title}`}
                  style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '3px 8px', borderRadius: 999,
                  background: it.status === 'listed' ? A.hex : T.surface2,
                  color: it.status === 'listed' ? A.ink : T.text,
                  border: it.status === 'sold' ? `1px solid ${A.hex}` : 'none',
                  fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700,
                  letterSpacing: 0.12, textTransform: 'uppercase',
                  cursor: 'pointer', outline: 'none',
                }}>
                  <option value="sourced">sourced</option>
                  <option value="listed">listed</option>
                  <option value="sold">sold</option>
                </select>
              </div>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 12,
                fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                color: margin > 100 ? A.hex : T.textMute, fontWeight: 600,
              }}>{margin}%</div>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700,
                fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                color: pl > 0 ? A.hex : T.skip,
              }}>+${pl}</div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: T.textMute, fontSize: 13,
          }}>Nothing in this status yet.</div>
        )}
      </WCard>
    </div>
  )
}

const invHeaderStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: '40px 2fr 90px 90px 110px 90px 90px',
  padding: '12px 18px', alignItems: 'center',
  fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.1,
  textTransform: 'uppercase', color: T.textFaint,
  borderBottom: `1px solid ${T.border}`,
}

function KPI({ label, value, sub, hi }: { label: string; value: string; sub: string; hi?: boolean }) {
  return (
    <div style={{
      background: hi ? A.hex : T.surface,
      color: hi ? A.ink : T.text,
      border: `1px solid ${hi ? A.hex : T.border}`,
      borderRadius: 14, padding: 18,
    }}>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.14,
        textTransform: 'uppercase', opacity: hi ? 0.7 : 0.55,
      }}>{label}</div>
      <div style={{
        fontFamily: display, fontSize: 32, fontWeight: 700,
        marginTop: 6, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.01,
      }}>{value}</div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 10, marginTop: 6,
        opacity: hi ? 0.7 : 0.5, letterSpacing: 0.08,
      }}>{sub}</div>
    </div>
  )
}

// ─── Listing modal ──────────────────────────────────────────────────────────
function variantFor(item: Item, price: number) {
  return {
    title: `VTG ${item.title.toUpperCase()} · Heavy Workwear · Faded · Streetwear`.slice(0, 80),
    desc:
`Authentic ${item.title}.

Condition: solid pre-owned. Light wear, no holes or stains. Honest fading on the high-wear points — exactly the look people pay for.

Heavy fabric, classic cut, runs true to size. Tagged size visible in pics.

Pulled from a private collection. Priced at $${price} based on recent sold comps. Smoke-free home, ships within 24h.

Any questions, ask before buying. No returns on vintage.`,
    tags: ['#vintage', '#streetwear', '#workwear', '#90s', '#carhartt', '#mensstyle', '#thrifted', '#unisex', '#archive', '#yzy'],
  }
}

function WebListing({
  item, sellPrice, onClose,
}: { item: Item; sellPrice: number; onClose: () => void }) {
  const [phase, setPhase] = useState<'streaming' | 'done'>('streaming')
  const [output, setOutput] = useState<{ title: string; desc: string; tags: string[] }>({
    title: '', desc: '', tags: [],
  })
  const [copied, setCopied] = useState<string | null>(null)

  const generate = () => {
    setPhase('streaming')
    setOutput({ title: '', desc: '', tags: [] })
    const v = variantFor(item, sellPrice)
    let i = 0
    const stream = () => {
      i += 3
      setOutput({
        title: v.title.slice(0, Math.min(i, v.title.length)),
        desc: v.desc.slice(0, Math.min(Math.max(0, i - 8), v.desc.length)),
        tags: i > v.title.length ? v.tags.slice(0, Math.floor((i - v.title.length) / 4)) : [],
      })
      if (i < v.title.length + v.desc.length + 4) setTimeout(stream, 14)
      else { setOutput({ title: v.title, desc: v.desc, tags: v.tags }); setPhase('done') }
    }
    setTimeout(stream, 200)
  }

  useEffect(() => { generate() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const copy = (label: string, text: string) => {
    try { void navigator.clipboard?.writeText(text) } catch {}
    setCopied(label)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 40,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 720, maxHeight: 'calc(100vh - 80px)',
        background: T.bg, border: `1px solid ${T.borderStrong}`,
        borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '18px 22px', borderBottom: `1px solid ${T.border}`,
        }}>
          <Swatch a={item.swatch} b={item.swatch2} size={42} radius={10} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{item.title}</div>
            <div style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>
              eBay · suggested ${sellPrice} · anchored to comp median
            </div>
          </div>
          <WPill kind="accent">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {Icons.spark} Claude
            </span>
          </WPill>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: T.textMute,
            cursor: 'pointer', padding: 4, marginLeft: 6,
          }}>{Icons.close}</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '22px 22px 26px' }}>
          <Block label="Title" sub={`${output.title.length}/80 chars`}
            onCopy={() => copy('title', output.title)} copied={copied === 'title'}>
            <div style={{
              fontFamily: display, fontSize: 24, lineHeight: 1.25,
              fontWeight: 600, color: T.text,
            }}>
              {output.title}
              {phase === 'streaming' && <Caret />}
            </div>
          </Block>

          <Block label="Description"
            onCopy={() => copy('desc', output.desc)} copied={copied === 'desc'}>
            <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: T.text }}>
              {output.desc}
              {phase === 'streaming' && output.desc.length > 0 && <Caret />}
            </div>
          </Block>

          <Block label="Tags"
            onCopy={() => copy('tags', output.tags.join(' '))} copied={copied === 'tags'}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {output.tags.map(t => (
                <span key={t} style={{
                  padding: '5px 10px', borderRadius: 999,
                  background: 'transparent', border: `1px solid ${T.borderStrong}`,
                  fontFamily: FONT_MONO, fontSize: 11, color: T.textMute,
                }}>{t}</span>
              ))}
            </div>
          </Block>
        </div>

        <div style={{
          display: 'flex', gap: 10, padding: '14px 22px',
          borderTop: `1px solid ${T.border}`,
        }}>
          <WBtn variant="ghost" onClick={generate} disabled={phase === 'streaming'}>Regenerate</WBtn>
          <div style={{ flex: 1 }} />
          <WBtn variant="secondary" onClick={onClose}>Close</WBtn>
          <WBtn onClick={() => copy('all', `${output.title}\n\n${output.desc}\n\n${output.tags.join(' ')}`)}>
            {copied === 'all' ? <>{Icons.check} Copied</> : <>{Icons.copy} Copy all</>}
          </WBtn>
        </div>
      </div>
    </div>
  )
}

function Caret() {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: '1em', verticalAlign: 'text-bottom',
      background: A.hex, marginLeft: 2, animation: 'thriftiq-caret 0.9s steps(2) infinite',
    }} />
  )
}

function Block({
  label, sub, onCopy, copied, children,
}: { label: string; sub?: string; onCopy: () => void; copied: boolean; children: ReactNode }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 18, padding: 16, marginBottom: 12,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.16,
            textTransform: 'uppercase', color: T.textFaint,
          }}>{label}</span>
          {sub && <span style={{
            fontFamily: FONT_MONO, fontSize: 10, color: T.textFaint,
          }}>{sub}</span>}
        </div>
        <button onClick={onCopy} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: copied ? A.hex : 'transparent',
          color: copied ? A.ink : T.textMute,
          border: `1px solid ${copied ? A.hex : T.border}`,
          borderRadius: 999, padding: '4px 10px',
          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
          letterSpacing: 0.06, textTransform: 'uppercase', cursor: 'pointer',
        }}>{copied ? <>{Icons.check} copied</> : <>{Icons.copy} copy</>}</button>
      </div>
      {children}
    </div>
  )
}

// ─── History ────────────────────────────────────────────────────────────────
function WebHistory({
  searches, onOpen, onSearch,
}: {
  searches: SearchRecord[]
  onOpen: (query: string) => void
  onSearch: () => void
}) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px 40px 60px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', marginBottom: 26,
      }}>
        <div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.18,
            textTransform: 'uppercase', color: A.hex,
          }}>History</div>
          <div style={{
            fontFamily: display, fontSize: 48, lineHeight: 1,
            fontWeight: 600, marginTop: 6, color: T.text,
          }}>Recent sourcing runs</div>
        </div>
        <WBtn onClick={onSearch} size="lg">{Icons.plus} New search</WBtn>
      </div>

      <WCard pad={0}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.8fr 1.5fr 90px 120px 110px',
          padding: '12px 18px', alignItems: 'center',
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 0.1,
          textTransform: 'uppercase', color: T.textFaint,
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div>Query</div><div>Match</div><div style={{ textAlign: 'right' }}>Median</div><div>Verdict</div><div>When</div>
        </div>
        {searches.map((run, i) => (
          <button key={run.id} onClick={() => onOpen(run.query)} style={{
            width: '100%', display: 'grid',
            gridTemplateColumns: '1.8fr 1.5fr 90px 120px 110px',
            padding: '14px 18px', alignItems: 'center',
            border: 'none',
            borderBottom: i < searches.length - 1 ? `1px solid ${T.border}` : 'none',
            background: 'transparent', color: T.text, cursor: 'pointer',
            textAlign: 'left',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{run.query}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textFaint, marginTop: 3 }}>
                {run.confidence} confidence
              </div>
            </div>
            <div style={{ fontSize: 13, color: T.textMute }}>{run.title}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, textAlign: 'right', fontWeight: 700 }}>
              ${run.median}
            </div>
            <div>
              <WPill kind={run.verdict === 'BUY' ? 'accent' : run.verdict === 'SKIP' ? 'skip' : 'warn'}>
                {run.verdict}
              </WPill>
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.textFaint }}>{run.searchedAt}</div>
          </button>
        ))}
        {searches.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: T.textMute }}>
            Run a sourcing search and it will appear here.
          </div>
        )}
      </WCard>
    </div>
  )
}

// ─── Profit ─────────────────────────────────────────────────────────────────
function WebProfit({ items, onInventory }: { items: InventoryItem[]; onInventory: () => void }) {
  const totalCost = items.reduce((sum, item) => sum + item.cost, 0)
  const totalValue = items.reduce((sum, item) => sum + item.est, 0)
  const grossProfit = totalValue - totalCost
  const activeItems = items.filter(item => item.status !== 'sold')
  const soldItems = items.filter(item => item.status === 'sold')
  const realized = soldItems.reduce((sum, item) => sum + (item.est - item.cost) * 0.85, 0)
  const pending = activeItems.reduce((sum, item) => sum + (item.est - item.cost) * 0.85, 0)
  const roi = totalCost > 0 ? Math.round((grossProfit / totalCost) * 100) : 0
  const topItems = [...items].sort((a, b) => (b.est - b.cost) - (a.est - a.cost)).slice(0, 5)

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px 40px 60px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', marginBottom: 26,
      }}>
        <div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.18,
            textTransform: 'uppercase', color: A.hex,
          }}>Profit</div>
          <div style={{
            fontFamily: display, fontSize: 48, lineHeight: 1,
            fontWeight: 600, marginTop: 6, color: T.text,
          }}>Resale performance</div>
        </div>
        <WBtn onClick={onInventory} size="lg">Manage inventory {Icons.arrow}</WBtn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 26 }}>
        <KPI label="Projected value" value={`$${totalValue.toLocaleString()}`} sub={`${items.length} items`} hi />
        <KPI label="Cost basis" value={`$${totalCost.toLocaleString()}`} sub="all inventory" />
        <KPI label="Projected ROI" value={`${roi}%`} sub="before final costs" />
        <KPI label="Realized net" value={`$${realized.toFixed(0)}`} sub={`${soldItems.length} sold`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
        <WCard>
          <div style={sectionLabel}>Profit pipeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Realized', value: realized, color: A.hex },
              { label: 'Pending', value: pending, color: T.text },
              { label: 'Cost basis', value: totalCost, color: T.textFaint },
            ].map(row => {
              const max = Math.max(realized, pending, totalCost, 1)
              return (
                <div key={row.label}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: FONT_MONO, fontSize: 11, color: T.textMute, marginBottom: 6,
                  }}>
                    <span>{row.label}</span><span>${row.value.toFixed(0)}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: T.surface2, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(4, (row.value / max) * 100)}%`,
                      height: '100%', background: row.color, borderRadius: 999,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </WCard>

        <WCard pad={0}>
          <div style={{
            padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.1,
            textTransform: 'uppercase', color: T.text, fontWeight: 700,
          }}>Top projected flips</div>
          {topItems.map((item, i) => {
            const profit = item.est - item.cost
            return (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '38px 1fr 90px',
                gap: 12, alignItems: 'center', padding: '14px 18px',
                borderBottom: i < topItems.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <Swatch a={item.swatch} b={item.swatch2} size={34} radius={7} />
                <div>
                  <div style={{ fontSize: 14, color: T.text, fontWeight: 700 }}>{item.title}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textFaint, marginTop: 3 }}>
                    ${item.cost} cost · ${item.est} est · {item.status}
                  </div>
                </div>
                <div style={{
                  textAlign: 'right', color: profit > 0 ? A.hex : T.skip,
                  fontFamily: FONT_MONO, fontSize: 15, fontWeight: 800,
                }}>+${profit}</div>
              </div>
            )
          })}
        </WCard>
      </div>
    </div>
  )
}

// ─── Root ───────────────────────────────────────────────────────────────────
export function ThriftIQWeb() {
  const [authed, setAuthed] = useState(false)
  const [route, setRoute] = useState<Route>('search')
  const [activeItem, setActiveItem] = useState<Item | null>(null)
  const [activeQuery, setActiveQuery] = useState('')
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY)
  const [searches, setSearches] = useState<SearchRecord[]>([])
  const [listingFor, setListingFor] = useState<{ item: Item; sellPrice: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const savedAuth = window.localStorage.getItem('thriftiq.authed')
    const savedInventory = window.localStorage.getItem('thriftiq.inventory')
    const savedSearches = window.localStorage.getItem('thriftiq.searches')

    if (savedAuth === 'true') setAuthed(true)
    if (savedInventory) setInventory(JSON.parse(savedInventory) as InventoryItem[])
    if (savedSearches) setSearches(JSON.parse(savedSearches) as SearchRecord[])
  }, [])

  useEffect(() => {
    window.localStorage.setItem('thriftiq.inventory', JSON.stringify(inventory))
  }, [inventory])

  useEffect(() => {
    window.localStorage.setItem('thriftiq.searches', JSON.stringify(searches))
  }, [searches])

  useEffect(() => {
    window.localStorage.setItem('thriftiq.authed', authed ? 'true' : 'false')
  }, [authed])

  if (!authed) return <WebSignIn onAuth={() => setAuthed(true)} />

  const flashToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }

  const handleSearch = (q: string) => {
    const found = findItem(q)
    const s = stats(found.comps)
    const projected = calcProfit({
      sellPrice: Math.round(s.median),
      cost: Math.max(1, Math.round(s.median * 0.2)),
      shipping: 12,
    })
    const verdict: SearchRecord['verdict'] =
      s.confidence === 'Low' ? 'WATCH' : projected.margin >= BUY_THRESHOLD ? 'BUY' : 'SKIP'

    setActiveQuery(q)
    setActiveItem(found)
    setSearches(prev => [{
      id: 'search-' + Date.now(),
      query: q,
      title: found.title,
      median: Math.round(s.median),
      confidence: s.confidence,
      verdict,
      searchedAt: 'just now',
    }, ...prev].slice(0, 20))
    setRoute('item')
  }
  const handleSave = ({ item, cost, est }: { item: Item; cost: number; est: number }) => {
    setInventory(prev => [{
      id: 'inv-' + Date.now(),
      title: item.title, cost, est, status: 'sourced',
      swatch: item.swatch, swatch2: item.swatch2, date: 'just now',
    }, ...prev])
    flashToast(`Saved · $${cost} → $${est}`)
  }
  const handleStatusChange = (id: string, status: InventoryItem['status']) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, status } : item))
    flashToast(`Updated status · ${status}`)
  }

  let content: ReactNode
  if (route === 'search') content = <WebSource onSearch={handleSearch} />
  else if (route === 'item' && activeItem) content = <WebItem
    query={activeQuery} item={activeItem}
    onSave={handleSave}
    onListing={(item, sp) => setListingFor({ item, sellPrice: sp })}
    onBack={() => setRoute('search')} />
  else if (route === 'inventory') content = (
    <WebInventory
      items={inventory}
      onSearch={() => setRoute('search')}
      onStatusChange={handleStatusChange}
    />
  )
  else if (route === 'history') content = (
    <WebHistory
      searches={searches}
      onOpen={handleSearch}
      onSearch={() => setRoute('search')}
    />
  )
  else content = <WebProfit items={inventory} onInventory={() => setRoute('inventory')} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, color: T.text }}>
      <Sidebar screen={route} onNav={setRoute} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {content}
      </main>

      {listingFor && <WebListing
        item={listingFor.item} sellPrice={listingFor.sellPrice}
        onClose={() => setListingFor(null)} />}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          padding: '12px 20px', borderRadius: 12,
          background: A.hex, color: A.ink,
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 8, zIndex: 300,
        }}>{Icons.check} {toast}</div>
      )}
    </div>
  )
}

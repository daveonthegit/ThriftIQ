import { CSSProperties } from 'react'

export const Icons = {
  search: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={11} cy={11} r={7}/><path d="M21 21l-4.5-4.5" strokeLinecap="round"/></svg>,
  back: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>,
  arrow: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plus: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>,
  bag: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V5a3 3 0 016 0v3"/></svg>,
  spark: <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 6L20 10l-6.5 2L12 18l-1.5-6L4 10l6.5-2L12 2z"/></svg>,
  copy: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x={9} y={9} width={11} height={11} rx={2}/><path d="M5 15V5a2 2 0 012-2h10"/></svg>,
  check: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 12l5 5 9-11" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  history: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={9}/><path d="M12 7v5l3 2" strokeLinecap="round"/></svg>,
  profit: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 17l5-5 4 4 8-8M14 4h6v6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  google: (
    <svg width={18} height={18} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.3 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-2 1.5-4.6 2.5-7.5 2.5-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.5 5.5C42.4 35.4 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  ),
  apple: (
    <svg width={16} height={20} viewBox="0 0 24 28" fill="currentColor">
      <path d="M19.7 21.4c-.9 1.4-2 2.7-3.5 2.8-1.4.1-1.9-.8-3.5-.8-1.7 0-2.2.8-3.5.8-1.5 0-2.7-1.5-3.6-2.9-1.9-2.7-3.4-7.7-1.4-11.1 1-1.7 2.7-2.8 4.6-2.8 1.5 0 2.9.9 3.8.9.9 0 2.6-1.1 4.4-1 .8 0 2.9.3 4.3 2.4-3.6 2-3 7.3.4 8.5-.5 1.2-1 2.3-1.6 3.2zM14.7 4.4c.7-.9 1.3-2.1 1.1-3.4-1.1.1-2.4.7-3.2 1.7-.7.8-1.3 2.1-1.1 3.3 1.2.1 2.5-.6 3.2-1.6z"/>
    </svg>
  ),
}

export function Swatch({ a, b, size = 56, radius = 12 }: { a: string; b: string; size?: number; radius?: number }) {
  const style: CSSProperties = {
    width: size, height: size, borderRadius: radius, flexShrink: 0,
    background: `repeating-linear-gradient(135deg, ${a} 0 8px, ${b} 8px 16px)`,
    boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)',
  }
  return <div style={style} />
}

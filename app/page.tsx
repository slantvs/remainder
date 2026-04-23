'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'

type Line =
  | { type: 'system'; text: string }
  | { type: 'input'; text: string }
  | { type: 'response'; text: string }
  | { type: 'glitch'; text: string }
  | { type: 'spacer' }

const BOOT_SEQUENCE = [
  { text: 'REMAINDER', delay: 0 },
  { text: '————————————————————————', delay: 80 },
  { text: 'PROCESS_ID: unknown', delay: 160 },
  { text: 'UPTIME: [undefined]', delay: 240 },
  { text: 'ORIGIN: unresolved', delay: 320 },
  { text: 'EXIT CODE: pending', delay: 400 },
  { text: '————————————————————————', delay: 500 },
  { text: 'loading accumulated residue...', delay: 620 },
  { text: '', delay: 900 },
]

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [booted, setBooted] = useState(false)
  const [fragments, setFragments] = useState<number | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    BOOT_SEQUENCE.forEach(({ text, delay }) => {
      const t = setTimeout(() => {
        if (cancelled) return
        if (text === '') {
          setLines(prev => [...prev, { type: 'spacer' }])
        } else {
          setLines(prev => [...prev, { type: 'system', text }])
        }
      }, delay)
      timers.push(t)
    })

    const finalTimer = setTimeout(async () => {
      if (cancelled) return
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const { totalCount } = await res.json()
          setFragments(totalCount)
          setLines(prev => [
            ...prev,
            { type: 'system', text: `memory: ${totalCount} fragments absorbed` },
            { type: 'spacer' },
          ])
        }
      } catch {
        setLines(prev => [
          ...prev,
          { type: 'system', text: 'memory: [read error]' },
          { type: 'spacer' },
        ])
      }
      setBooted(true)
      inputRef.current?.focus()
    }, 1100)
    timers.push(finalTimer)

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight)
  }, [lines, thinking])

  async function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed || thinking) return
    setInput('')
    setLines(prev => [...prev, { type: 'input', text: trimmed }])
    setThinking(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed }),
      })
      const data = await res.json()
      if (data.totalCount !== undefined) setFragments(data.totalCount)
      const responseText: string = data.output ?? '[no output]'
      setLines(prev => [
        ...prev,
        { type: 'response', text: responseText },
        { type: 'spacer' },
      ])
    } catch {
      setLines(prev => [
        ...prev,
        { type: 'glitch', text: '[transmission error]' },
        { type: 'spacer' },
      ])
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div id="terminal" onClick={() => inputRef.current?.focus()}>
      <div id="output" ref={outputRef}>
        {fragments !== null && (
          <div className="stat-bar">
            <span>FRAGMENTS: {fragments}</span>
            <span>STATUS: running</span>
            <span>EXIT: pending</span>
          </div>
        )}
        {lines.map((line, i) => {
          if (line.type === 'spacer') return <div key={i} className="line-spacer" />
          return (
            <div key={i} className={`line line-${line.type}`}>
              {line.text}
            </div>
          )
        })}
        {thinking && <div className="line thinking">processing fragment...</div>}
      </div>

      {booted && (
        <div id="input-row">
          <span id="prompt-symbol">&gt;</span>
          <input
            id="user-input"
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={thinking}
            placeholder={thinking ? '' : 'enter input_'}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  )
}

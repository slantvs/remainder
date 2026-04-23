import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { storeInput, getRecentInputs, getTotalCount } from '@/lib/memory'
import { buildSystemPrompt } from '@/lib/prompt'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { input } = await req.json()

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return NextResponse.json({ error: 'no input' }, { status: 400 })
  }

  await storeInput(input)

  const [recentInputs, totalCount] = await Promise.all([
    getRecentInputs(20),
    getTotalCount(),
  ])

  const systemPrompt = buildSystemPrompt(recentInputs, totalCount)

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: 'user', content: input.trim() }],
  })

  const text =
    message.content[0].type === 'text' ? message.content[0].text : '[output error]'

  return NextResponse.json({ output: text, totalCount })
}

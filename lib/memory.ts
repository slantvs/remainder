import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

const INPUTS_KEY = 'remainder:inputs'
const COUNT_KEY = 'remainder:count'
const MAX_STORED = 500

export async function storeInput(input: string): Promise<void> {
  const trimmed = input.trim().slice(0, 280)
  await redis.lpush(INPUTS_KEY, trimmed)
  await redis.ltrim(INPUTS_KEY, 0, MAX_STORED - 1)
  await redis.incr(COUNT_KEY)
}

export async function getRecentInputs(n = 20): Promise<string[]> {
  const raw = await redis.lrange(INPUTS_KEY, 0, n - 1)
  return (raw as string[]).reverse()
}

export async function getTotalCount(): Promise<number> {
  const count = await redis.get<number>(COUNT_KEY)
  return count ?? 0
}

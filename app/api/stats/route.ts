import { NextResponse } from 'next/server'
import { getTotalCount } from '@/lib/memory'

export async function GET() {
  const totalCount = await getTotalCount()
  return NextResponse.json({ totalCount })
}

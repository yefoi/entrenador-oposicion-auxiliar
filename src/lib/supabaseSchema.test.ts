import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Supabase schema contract', () => {
  it('exige RLS y una RPC con auth.uid()', () => {
    const schema = readFileSync(
      resolve(process.cwd(), 'supabase/schema.sql'),
      'utf8',
    )
    expect(schema).toContain('force row level security')
    expect(schema).toContain('auth.uid() = user_id')
    expect(schema).toContain('sync_trainer_state')
    expect(schema).toContain('security definer')
    expect(schema).not.toContain('service_role')
  })
})

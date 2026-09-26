import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const sourceFiles = (dir: string): string[] => {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sourceFiles(full))
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

const ICONS = join(process.cwd(), 'src/components/Icons.tsx')
const FORBIDDEN = ['spark', 'sparkle', 'star', 'magic', 'wand', 'shiny']

describe('icon set', () => {
  it('has no sparkle or star glyphs', () => {
    const icons = readFileSync(ICONS, 'utf8')
    for (const name of FORBIDDEN) {
      expect(icons).not.toContain(`'${name}'`)
    }
    expect(icons).not.toMatch(/\u2728|\u2729|\u2b50|\u2605|\u2606/)
    expect(icons).not.toMatch(/1\.4-5\.6|m12 3 1\.4/)
  })

  it('never requests a removed icon', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(join(process.cwd(), 'src'))) {
      if (file.endsWith('Icons.test.ts')) continue
      const text = readFileSync(file, 'utf8')
      for (const name of FORBIDDEN) {
        if (new RegExp(`(name|icon)="${name}"`).test(text)) {
          offenders.push(`${file} -> ${name}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('declares every icon it defines', () => {
    const icons = readFileSync(ICONS, 'utf8')
    const union = /export type IconName =([\s\S]*?)\n\}/.exec(icons)?.[1] ?? ''
    const record = /const paths: Record<IconName, ReactNode> = \{([\s\S]*?)\n\}/.exec(
      icons,
    )?.[1]
    const declared = [...union.matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
    const defined = [...(record ?? '').matchAll(/^ {2}([a-z-]+):/gm)].map(
      (m) => m[1],
    )
    expect(defined.length).toBeGreaterThan(0)
    for (const name of defined) {
      expect(declared).toContain(name)
    }
    expect(declared.length).toBe(defined.length)
  })
})

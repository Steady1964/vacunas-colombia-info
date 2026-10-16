import { describe, expect, it } from 'vitest'
import { estimate } from './data'
describe('vacunación civil',()=>{it('calcula 6 semanas con días exactos',()=>expect(estimate('2026-01-01',42,'shortened').toISOString().slice(0,10)).toBe('2026-02-12'));it('calcula dos meses calendario en tradicional',()=>expect(estimate('2026-01-31',42,'traditional').toISOString().slice(0,10)).toBe('2026-03-31'))})

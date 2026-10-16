import { describe, expect, it } from 'vitest'
import { operationError } from './presentation'

describe('mensajes seguros para operaciones locales', () => {
  it('no muestra información familiar de una excepción inesperada', () => {
    const privateDetail = 'Apodo privado; lote 123; nacimiento 2026-01-31'
    const message = operationError(new Error(privateDetail))
    expect(message).not.toContain(privateDetail)
  })


  it('informa conflictos sin exponer su contenido', () => {
    const message = operationError(new Error('conflicting-import: contenido privado'))
    expect(message).not.toContain('contenido privado')
  })
})

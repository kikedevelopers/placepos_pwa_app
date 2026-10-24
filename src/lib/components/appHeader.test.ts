import { describe, expect, it } from 'vitest'
import { greetingFor, initialsOf, roleLabel } from './appHeader'

describe('greetingFor', () => {
    it.each([
        [0, 'Buenos días'],
        [11, 'Buenos días'],
        [12, 'Buenas tardes'],
        [18, 'Buenas tardes'],
        [19, 'Buenas noches'],
        [23, 'Buenas noches']
    ])('%i h → %s', (hour, expected) => {
        expect(greetingFor(hour)).toBe(expected)
    })
})

describe('initialsOf', () => {
    it.each([
        ['Enrique Pacheco', 'EP'],
        ['  luisa   fernanda  guayara ', 'LF'],
        ['Kike', 'K'],
        ['', 'U'],
        ['   ', 'U']
    ])('%p → %s', (name, expected) => {
        expect(initialsOf(name)).toBe(expected)
    })
})

describe('roleLabel', () => {
    it('nombra cada rol; uno desconocido es "Usuario"', () => {
        expect(roleLabel('owner')).toBe('Propietario')
        expect(roleLabel('superadmin')).toBe('Administrador')
        expect(roleLabel('manager')).toBe('Gerente')
        expect(roleLabel('employee')).toBe('Empleado')
        expect(roleLabel('otro')).toBe('Usuario')
    })
})

import { json2csv, toSnakeCase } from '../helpers.utils.js'

describe('toSnakeCase', () => {
  it('should return the correct snake case string', () => {
    expect(toSnakeCase('fooBar')).toBe('foo_bar')
    expect(toSnakeCase('fooBarBaz')).toBe('foo_bar_baz')
    expect(toSnakeCase('foo')).toBe('foo')
  })
})

describe('json2csv', () => {
  it('should return the correct csv', () => {
    const data = [
      { foo: 'bar', baz: 'qux' },
      { foo: 'bar2', baz: 'qux2' },
    ]
    expect(json2csv(data)).toBe('foo,baz\nbar,qux\nbar2,qux2')
  })

  it('should return the correct csv with nested objects', () => {
    const data = [
      { foo: 'bar', baz: { qux: 'quux' } },
      { foo: 'bar2', baz: { qux: 'quux2' } },
    ]
    expect(json2csv(data)).toBe('foo,qux\nbar,quux\nbar2,quux2')
  })
})

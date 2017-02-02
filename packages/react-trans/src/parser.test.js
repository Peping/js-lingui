import parse from './parser'


describe('ICU message format parser', function() {
  it('should return text as it is', function() {
    expect(parse('Text')).toEqual(['Text'])
  })

  it('should parse variable', function() {
    expect(parse('{var}')).toEqual([{
      type: 'variable',
      name: 'var'
    }])

    expect(parse('{var, number}')).toEqual([{
      type: 'number',
      name: 'var'
    }])

    expect(parse('{var, number, percent}')).toEqual([{
      type: 'number',
      name: 'var',
      style: 'percent'
    }])
  })

  it('should parse plural type', function() {
    expect(parse('{var, plural, one {Book} other {Books}}')).toEqual([{
      type: 'plural',
      name: 'var',
      choices: [
        { key: 'one', value: ['Book']},
        { key: 'other', value: ['Books']}
      ]
    }])

    expect(parse('{var, plural, offset:1 one {Book} other {Books}}')).toEqual([{
      type: 'plural',
      name: 'var',
      offset: 1,
      choices: [
        { key: 'one', value: ['Book']},
        { key: 'other', value: ['Books']}
      ]
    }])

    expect(parse('{var, plural, one {# Book} other {{var, number} Books}}')).toEqual([{
      type: 'plural',
      name: 'var',
      choices: [
        { key: 'one', value: [{ type: ''}, 'Book']},
        { key: 'other', value: [{ type: 'number', name: 'var'}, ' Books']}
      ]
    }])
  })
})

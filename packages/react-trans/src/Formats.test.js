import React from 'react'
import { shallow, mount } from 'enzyme'
import { NumberFormat, DateFormat } from '.'

describe('Formats', function() {
  const languageContext = (code) => ({ context: { i18n: {
    language: code,
    formats: {
      number: {
        percent_short: {
          style: 'percent'
        }
      },
      date: {
        short: {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit'
        }
      }
    }
  }}})

  it('should should update formatter in cache on format change', function() {
    const node = mount(
      <NumberFormat value={1000} format={{
          style: 'decimal'
        }} />,
      languageContext('en')
    )

    expect(node.text()).toEqual("1,000")

    node.setProps({ format: { style: 'percent' } })
    expect(node.text()).toEqual("100,000%")
  })

  describe('Number', function() {
    it('should have propper displayName', function() {
      expect(shallow(<NumberFormat />).text()).toEqual("<NumberFormat />")
    })

    it('should use predefined format', function() {
      expect(shallow(
        <NumberFormat value={0.1} format="percent_short" />,
        languageContext('en')
      ).dive().text()).toEqual("10%")
    })

    it('should use custom format', function() {
      expect(shallow(
        <NumberFormat value={10} format={{
          style: 'currency',
          currency: 'USD',
          currencyDisplay: 'symbol'
        }} />,
        languageContext('en')
      ).dive().text()).toEqual("$10.00")
    })

  })

  describe('Date', function() {
    it('should have propper displayName', function() {
      expect(shallow(<DateFormat />).text()).toEqual("<DateFormat />")
    })

    it('should use predefined format', function() {
      expect(shallow(
        <DateFormat value={new Date("02/02/2017")} format="short" />,
        languageContext('en')
      ).dive().text()).toEqual("02/02/17")
    })

    it('should use custom format', function() {
      expect(shallow(
        <DateFormat value={new Date("02/02/2017")} format={{
          era: 'long'
        }} />,
        languageContext('en')
      ).dive().text()).toEqual("2 2, 2017 Anno Domini")
    })
  })
})

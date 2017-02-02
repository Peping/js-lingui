import React from 'react'
import InjectI18n from './InjectI18n'

type NumberFormatType = {
  localeMatcher: 'best fit' | 'lookup',

  style: 'decimal' | 'currency' | 'percent',

  currency: string,
  currencyDisplay: 'symbol' | 'code' | 'name',

  useGrouping: boolean,

  minimumIntegerDigits: number,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
  minimumSignificantDigits: number,
  maximumSignificantDigits: number
}

type DateFormatType = {
  localeMatcher: 'best fit' | 'lookup',
  formatMatcher: 'basic' | 'best fit',

  timeZone: string,
  hour12  : boolean,

  weekday     : 'narrow' | 'short' | 'long',
  era         : 'narrow' | 'short' | 'long',
  year        : 'numeric' | '2-digit',
  month       : 'numeric' | '2-digit' | 'narrow' | 'short' | 'long',
  day         : 'numeric' | '2-digit',
  hour        : 'numeric' | '2-digit',
  minute      : 'numeric' | '2-digit',
  second      : 'numeric' | '2-digit',
  timeZoneName: 'short' | 'long',
}

type FormatProps<T> = {
  value: number,
  format: string | T
}

function createFormat<T>(
  domain: string,
  formatter: (langauge: string, options: T) => Function
) {

  const getFormatter = (props: FormatProps<T>) => () => {
    const { format, i18n: { language, formats }} = props
    const options = typeof format === 'string' ? formats[domain][format] : format
    return {
      format: formatter(language, options)
    }
  }

  class Format extends React.Component {
    props: FormatProps<T>

    constructor(props) {
      super(props)
      this.state = getFormatter(this.props)()
    }


    componentWillReceiveProps(nextProps) {
      // State is initially set in constructor, so state.format should never
      // be empty.
      // istanbul ignore else
      if (
        this.props.language !== nextProps.language ||
        this.props.format !== nextProps.format
      ) {
        this.setState(getFormatter(nextProps))
      }
    }

    render() {
      return <span>{this.state.format(this.props.value)}</span>
    }
  }

  Format.displayName = domain[0].toUpperCase() + domain.substring(1) + 'Format' // capitalize :/
  return InjectI18n(Format)
}

const NumberFormat = createFormat(
  'number',
  (language, options: NumberFormatType) => new Intl.NumberFormat(language, options).format)

const DateFormat = createFormat(
  'date',
  (language, options: DateFormatType) => new Intl.DateTimeFormat(language, options).format)

export { NumberFormat, DateFormat }

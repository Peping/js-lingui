import "babel-polyfill"


function cleanChildren(node) {
  node.children = []
  node.openingElement.selfClosing = true
}

const mergeProps = (props, nextProps) => ({
  text: props.text + nextProps.text,
  params: Object.assign({}, props.params, nextProps.params),
  components: props.components.concat(nextProps.components),
  formats: Object.assign({}, props.formats, nextProps.formats)
})

const initialProps = (props = {}) => ({
  text: "",
  params: {},
  components: [],
  formats: {}
})

const elementGeneratorFactory = () => {
  let index = 0
  return () => index++
}

/**
 * Suggests a name for custom formats
 * @param attrs: Array of format parameters
 * @param names: Array of existing format names
 */
const formatNameGeneratorFactory = () => {
  const names = []

  const save = (name) => { names.push(name); return name }

  return (attrs) =>  {
    const style = attrs
      .filter(attr => attr.key.name === 'style')
      .map(attr => attr.value.value)[0]

    const name = style ? `style_${style}` : `format`
    if (!names.includes(name)) return save(name)

    for (let i = 1; i < 9999; i++) {
      const iName = [name, i].join('_')
      if (!names.includes(iName)) return save(iName)
    }

    // can't find a name!
  }
}



// Plugin function
export default function({ types: t }) {
  let elementGenerator, formatNameGenerator

  function isIdAttribute(node) {
    return t.isJSXAttribute(node) && t.isJSXIdentifier(node.name, {name: 'id'})
  }

  const elementName = name => node =>
    t.isJSXElement(node) && t.isJSXIdentifier(node.openingElement.name, { name })

  const isTransElement = elementName('Trans')
  const isChooseElement = (node) => (
    elementName('Plural')(node) ||
    elementName('Select')(node) ||
    elementName('SelectOrdinal')(node)
  )
  const isFormatElement = (node) => (
    elementName('DateFormat')(node) ||
    elementName('NumberFormat')(node)
  )

  function processElement(node, props, root = false) {
    const element = node.openingElement

    // Trans
    if (isTransElement(node)) {
      for (const child of node.children) {
        props = processChildren(child, props)
      }

    // Plural, Select, SelectOrdinal
    } else if (isChooseElement(node)) {
      // TODO: Disallow children
      // TODO: Complain about missing pluralVariable
      // TODO: Type-check offset (must be number)

      const choicesType = element.name.name.toLowerCase()
      const choices = {}
      let variable, offset = ''

      for (const attr of element.attributes) {
        const {name: {name}} = attr

        if (name === 'value') {
          const exp = attr.value.expression
          variable = exp.name
          props.params[variable] = t.objectProperty(exp, exp)

        } else if (choicesType !== 'select' && name === 'offset') {
          offset = ` offset:${attr.value.value}`

        } else {
          props = processChildren(attr.value, Object.assign({}, props, {text: ''}))
          choices[name.replace('_', '=')] = props.text
        }
      }

      const categories = Object.keys(choices).reduce((acc, key) => {
        return acc + ` ${key} {${choices[key]}}`
      }, '')

      props.text = `{${variable}, ${choicesType},${offset}${categories}}`
      element.attributes = element.attributes.filter(attr => attr.name.name === 'props')
      element.name = t.JSXIdentifier('Trans')

    } else if (isFormatElement(node)) {
      const params = element.attributes.reduce((acc, item) => {
        acc[item.name.name] = item.value
        return acc
      }, {})

      const variable = params.value.expression.name
      const formatType = element.name.name.replace(/Format$/, '').toLowerCase()

      const args = [variable, formatType]
      if (t.isStringLiteral(params.format)) {
        args.push(params.format.value)

      } else if (t.isJSXExpressionContainer(params.format)) {
        const exp = params.format.expression

        // Find a unique name for custom format...
        const formatName = formatNameGenerator(exp.properties)

        // ...and push it to global formats prop
        props.formats[formatName] = t.objectProperty(
          t.identifier(formatName), exp
        )

        args.push(formatName)
      }

      // args = [variable, type, format] => e.g: {interest, number, percent}
      props.text += `{${args.join(', ')}}`
      element.attributes = []
      element.name = t.JSXIdentifier('Trans')

    // Other elements
    } else {
      if (root) return

      const index = elementGenerator()
      const selfClosing = node.openingElement.selfClosing

      props.text += !selfClosing ? `<${index}>` : `<${index}/>`

      for (const child of node.children) {
        props = processChildren(child, props)
      }

      if (!selfClosing) props.text += `</${index}>`

      cleanChildren(node)
      props.components.unshift(node)
    }

    return props
  }

  function processChildren(node, props) {
    let nextProps = initialProps()

    if (t.isJSXExpressionContainer(node)) {
      const exp = node.expression

      if (t.isIdentifier(exp)) {
        nextProps.text += `{${exp.name}}`
        nextProps.params[exp.name] = t.objectProperty(exp, exp)

      } else if (t.isTemplateLiteral(exp)) {
        let parts = []

        exp.quasis.forEach((item, index) => {
          parts.push(item)

          if (!item.tail) parts.push(exp.expressions[index])
        })

        parts.forEach((item) => {
          if (t.isTemplateElement(item)) {
            nextProps.text += item.value.raw
          } else {
            nextProps.text += `{${item.name}}`
            nextProps.params[item.name] = t.objectProperty(item, item)
          }
        })

      } else if (t.isJSXElement(exp)) {
        nextProps = processElement(exp, nextProps)

      } else {
        nextProps.text += exp.value
      }

    } else if (t.isJSXElement(node)) {
      nextProps = processElement(node, nextProps)

    } else if (t.isJSXSpreadChild(node)) {
      // TODO: I don't have a clue what's the usecase

    } else {
      nextProps.text += node.value
    }

    // normalize spaces
    nextProps.text = nextProps.text.replace(/\n\s+/g, "\n")

    return mergeProps(props, nextProps)
  }

  return {
    visitor: {
      JSXElement({ node }) {
        elementGenerator = elementGeneratorFactory()
        formatNameGenerator = formatNameGeneratorFactory()

        // 1. Collect all parameters and inline elements and generate message ID

        const props = processElement(node, initialProps(), /* root= */true)

        if (!props) return

        // 2. Replace children and add collected data

        cleanChildren(node)
        props.text = props.text.trim()
        const attrs = node.openingElement.attributes

        // If `id` prop already exists and generated ID is different,
        // add it as a `default` prop
        const idAttr = attrs.filter(isIdAttribute)[0]
        if (idAttr && idAttr.value.value !== props.text) {
          attrs.push(
            t.JSXAttribute(t.JSXIdentifier("defaults"), t.StringLiteral(props.text))
          )
        } else if (!idAttr) {
          attrs.push(
            t.JSXAttribute(t.JSXIdentifier("id"), t.StringLiteral(props.text))
          )
        }

        // Parameters for variable substitution
        const paramsList = Object.values(props.params)
        if (paramsList.length) {
          attrs.push(
            t.JSXAttribute(
              t.JSXIdentifier("params"),
              t.JSXExpressionContainer(t.objectExpression(paramsList)))
          )
        }
        // Parameters for variable substitution
        const formatsList = Object.values(props.formats)
        if (formatsList.length) {
          attrs.push(
            t.JSXAttribute(
              t.JSXIdentifier("formats"),
              t.JSXExpressionContainer(t.objectExpression(formatsList)))
          )
        }

        // Inline elements
        if (props.components.length) {
          attrs.push(
            t.JSXAttribute(
              t.JSXIdentifier("components"),
              t.JSXExpressionContainer(t.arrayExpression(props.components))
            )
          )
        }
      }  // JSXElement
    }  // visitor
  }
}

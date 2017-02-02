/*
MessageFormat Grammar
=====================

http://icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html

message = messageText (argument messageText)*
argument = noneArg | simpleArg | complexArg
complexArg = choiceArg | pluralArg | selectArg | selectordinalArg

noneArg = '{' argNameOrNumber '}'
simpleArg = '{' argNameOrNumber ',' argType [',' argStyle] '}'
choiceArg = '{' argNameOrNumber ',' "choice" ',' choiceStyle '}'
pluralArg = '{' argNameOrNumber ',' "plural" ',' pluralStyle '}'
selectArg = '{' argNameOrNumber ',' "select" ',' selectStyle '}'
selectordinalArg = '{' argNameOrNumber ',' "selectordinal" ',' pluralStyle '}'

choiceStyle: see ChoiceFormat
pluralStyle: see PluralFormat
selectStyle: see SelectFormat

argNameOrNumber = argName | argNumber
argName = [^[[:Pattern_Syntax:][:Pattern_White_Space:]]]+
argNumber = '0' | ('1'..'9' ('0'..'9')*)

argType = "number" | "date" | "time" | "spellout" | "ordinal" | "duration"
argStyle = "short" | "medium" | "long" | "full" | "integer" | "currency" | "percent" | argStyleText
*/


function splitAt(text, regexp) {
  if (!text) return []

  const index = text.search(regexp)
  if (index === -1) return [text, '']
  console.log([text.slice(0, index), text.slice(index + 1)])
  return [text.slice(0, index), text.slice(index + 1)]
}

function pluralParser(text) {
  const plural = {
    choices: []
  }

  const match = text.match(/offset:([^\s]+)\s+(.*)$/)
  if (match) {
    plural.offset = parseInt(match[1])
    text = match[2]
  }

  while (text) {
    const choice = splitAt(text, /{/)
    if (choice[0]) {
      const [tokens, next] = messageParser(choice[1])
      plural.choices.push({ key: choice[0], value: tokens})
      text = next
    } else {
      text = choice[1]
    }
  }

  console.log(plural)
  return plural
}

function argumentParser(text) {
  const argument = {
    type: 'variable'
  }

  if (text) {
    const name = splitAt(text, /[},]/)
    if (name[0]) argument.name = name[0]
    text = name[1].trim()
  }

  if(text) {
    const type = splitAt(text, /[},]/)
    argument.type = type[0]
    text = type[1].trim()
  }

  if (text) {
    const params = splitAt(text, /[}]/)
    if (params[0]) {
      if (argument.type === 'plural') {
        const { offset, choices } = pluralParser(params[0].trim())
        if (choices) argument.choices = choices
        if (offset) argument.offset = offset
      } else {
        argument.style = params[0]
      }
    }
    text = params[1].trim()
  }

  return [
    [argument],
    text
  ]
}

function messageParser(text) {
  const tokens = []

  while (text) {
    const [msg, args] = splitAt(text, /{/)
    if (msg) tokens.push(msg)

    if (args) {
      const [argTokens, next] = argumentParser(args)

      ;[].push.apply(tokens, argTokens)

      text = next
    } else {
      text = args
    }
  }

  return tokens
}

function parse(text) {
  return messageParser(text)[0]
}

export default parse

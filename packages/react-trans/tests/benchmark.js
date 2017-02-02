const Benchmark = require('benchmark')
const MessageFormatParser = require('messageformat-parser').parse
const parse = require('../src/parser').default

const message = '{name, number, percent}'

const suite = new Benchmark.Suite
suite
.add('MessageFormat', function() {
  MessageFormatParser(message)
})
.add('Parser', function() {
  parse(message)
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target))
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'))
})
// run async
.run({ 'async': true })

var FastStream = require('./index.js')
//var assert = require('assert');
var diff = require('deep-diff')

var logDebug = false

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// - encode provided messages
// - decode encoded binary buffer
// - compare excepted and encoded message
// - print out differences if exists
//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
function testCodec(messages) {
  var buffer = []

  // encode messages ony by one
  var encoder = new FastStream.Encoder('test.xml')
  for (var i = 0; i < messages.length; ++i) {
    if (logDebug) console.log('Input message:', messages[i].msg)
    buffer = buffer.concat(encoder.encode(messages[i].name, messages[i].msg))
  }

  // decode buffer
  var decoder = new FastStream.Decoder('test.xml')
  var i = 0
  decoder.decode(buffer, function(msg, name) {

    if (logDebug) console.log('Output message:', msg)

    var differences = diff(messages[i].msg, msg)
    if (differences != null) {
      //console.log(differences)
      for (var d = 0; d < differences.length; ++d) {
        switch (differences[d].kind) {
          case 'N': // indicates a newly added property/element
            console.log('Error: Additional property found:', messages[i].name, '.', differences[d].path.join('.'))
            break
          case 'D': // indicates a property/element was deleted
            console.log('Error: Property ', messages[i].name, '.', differences[d].path.join('.'), 'missing')
            break
          case 'E': // indicates a property/element was changed
            if ( (differences[d].path.length) > 1 && (differences[d].path[differences[d].path.length - 1] === parseInt(differences[d].path[differences[d].path.length - 1], 10)) ) {
              console.log('Error: Property value', messages[i].name, '.', differences[d].slice(0, differences[d].path.length - 1).join('.'), '[', differences[d].path[differences[d].path.length - 1], ']', 'differs:', differences[d].lhs, '<>', differences[d].rhs)
            } else {
              console.log('Error: Property value', messages[i].name, '.', differences[d].path.join('.'), 'differs:', differences[d].lhs, '<>', differences[d].rhs)
            }
            break
          case 'A': // indicates a change occurred within an array
            console.log('Error: Array content ', messages[i].name, '.', differences[d].path.join('.'), 'differs:', differences[d].lhs, '<>', differences[d].rhs)
            break
        }
      }
      throw new Error('Decoded message does not match epected message')
    }
    console.log('Info: ', messages[i].name, 'passed test')
    ++i

    //assert.deepEqual(messages[i].msg, msg, differences)
    /*
    if (JSON.stringify(messages[i++].msg) !== JSON.stringify(msg)) {
      console.log('Output message:', msg)
      console.log('Expected message:', messages[i-1].msg)
      throw new Error('Decoded message does not match input message')
    }*/
  })
}

console.log('Start testing fast-protocol encode/decode')

testCodec([
  {
    name: "StringTestMessage",
    msg: {
      StringArray: [
        {MandatoryStringDelta: "Hello"},
        {MandatoryStringDelta: "Hello World"},
        {MandatoryStringDelta: "Hello World"},
        {MandatoryStringDelta: "World"},
        {MandatoryStringDelta: "Hello World"},
        {MandatoryStringDelta: "Hello World!"},
        {MandatoryStringDelta: "!Hello World"}
      ]
    }
  }
])


// test RDPacketHeader
testCodec([
  {
    name: "RDPacketHeader",
    msg: { SenderCompID: 1,
      PacketSeqNum: [ 0, 8, 58, 9 ],
      SendingTime: [ 21, 105, 89, 139, 55, 77, 80, 125 ] }
  },
  {
    name: "RDPacketHeader",
    msg: { SenderCompID: 2,
      PacketSeqNum: [ 0, 8, 58, 10 ],
      SendingTime: [ 21, 105, 89, 139, 55, 77, 80, 126 ] }
  }
])


testCodec([
  {
    name: "DeltaStringOperatorMessage",
    msg: {MandatoryStringDelta: "Hello"}
  },
  {
    name: "DeltaStringOperatorMessage",
    msg: {MandatoryStringDelta: "Hello World"}
  },
  {
    name: "DeltaStringOperatorMessage",
    msg: {MandatoryStringDelta: "World"}
  }
])


// test TestMessage
testCodec([
  {
    name: "TestMessage",  // #1
    msg: {
      MandatoryUInt32: 123,
      MandatoryUInt32Increment: 234,
      MandatoryUInt32Copy: 456,
      MandatoryUInt32Default: 567,
      MandatoryUInt32Delta: 678,
      MandatoryString: 'HELLO',
      MandatoryStringCopy: 'XXX',
      MandatoryStringDefault: 'HELLO',
      MandatoryStringDelta: '123456',
      OptionalUInt32: 100,
      OptionalUInt32Increment: 200,
      OptionalUInt32Copy: 300,
      OptionalUInt32Default: 400,
      OptionalUInt32Delta: 500,
      OptionalString: "BUZZ",
      OptionalStringCopy: "FOO",
      OptionalStringDefault: 'YYY',
      MandatoryGroup: {
        GrpMandatoryUInt32: 321,
        GrpMandatoryUInt32Increment: 654
      },
      OptionalGroup: {
        GrpMandatoryUInt32: 432,
      }
    }
  },
  {
    name: "TestMessage",  // #2
    msg: {
      MandatoryUInt32: 123,
      MandatoryUInt32Increment: 235,
      MandatoryUInt32Copy: 456,
      MandatoryUInt32Default: 567,
      MandatoryUInt32Delta: 678,
      MandatoryString: 'HELLO',
      MandatoryStringCopy: 'XXX',
      MandatoryStringDefault: 'HELLO',
      MandatoryStringDelta: '123789',
      OptionalUInt32: 100,
      OptionalUInt32Increment: 201,
      OptionalUInt32Copy: 300,
      OptionalUInt32Default: 400,
      OptionalUInt32Delta: 500,
      OptionalString: "BUZZ",
      OptionalStringCopy: "FOO",
      OptionalStringDefault: 'YYY',
      MandatoryGroup: {
        GrpMandatoryUInt32: 321,
        GrpMandatoryUInt32Increment: 655
      },
      OptionalGroup: undefined
    }
  },
])

// test DecimalMessage
testCodec([
  {
    name: "DecimalMessage",
    msg: {
      MandatoryDecimal: {m: 1, e: 0},
      MandatoryDecimalCopy: {m: 3, e: -2},
      OptionalDecimal: {m: 2, e: -1},
    }
  }
])

// test SequenceMessage
testCodec([
  {
    name: "SequenceMessage",
    msg: {
      MandatorySequence: [
        {SeqMandatoryUInt32: 12,
        SeqMandatoryUInt32Increment: 23},
        {SeqMandatoryUInt32: 14,
        SeqMandatoryUInt32Increment: 24},
        {SeqMandatoryUInt32: 16,
        SeqMandatoryUInt32Increment: 25}
      ],
      OptionalSequence: [
        {SeqMandatoryUInt32: 18},
        {SeqMandatoryUInt32: 20}
      ],
      OptionalSequenceConstLength: [
        {SeqMandatoryUInt32: 33},
        {SeqMandatoryUInt32: 43}
      ]
    }
  }
])

console.log('Test done.')

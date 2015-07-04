const nock = require('nock')
const expect = require('chai').expect
const consul = require('..')

suite('consul', function () {
  var optionsStub = null

  beforeEach(function () {
    optionsStub = {
      store: {},
      set: function (key, val) {
        this.store[key] = val
      }
    }
  })

  test('define params', function () {
    var md = consul({ service: 'test', servers: [] })
    md({}, {}, function () {})
    //expect(optionsStub.store.servers).to.be.an('array')
    //expect(optionsStub.store.service).to.be.empty
  })

  test('passes', function () {

  })
})

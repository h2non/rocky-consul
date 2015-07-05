const nock = require('nock')
const expect = require('chai').expect
const consul = require('..')

const noop = function () {}

suite('consul', function () {
  var consulResponse = [
    {
      "Node": "nyc3-worker-1",
      "Address": "127.0.0.1",
      "ServiceID": "web",
      "ServiceName": "web",
      "ServiceAddress": "",
      "ServicePort": 80
    }
  ]

  test('valid', function (done) {
    nock('http://consul')
      .get('/v1/catalog/service/web?')
      .reply(200, consulResponse)

    var md = consul({
      service: 'web',
      servers: ['http://consul']
    })

    var req = { rocky: { options: {} } }
    var res = { end: noop }

    md(req, res, assert)

    function assert(err) {
      expect(err).to.be.undefined
      expect(req.rocky.options.balance).to.be.deep.equal(['http://127.0.0.1:80'])
      done()
    }
  })

  test('invalid params', function (done) {
    function missingService() {
      consul({ servers: [] })
    }

    function missingServers() {
      consul({ servers: 'web' })
    }

    expect(missingService).to.throw(TypeError)
    expect(missingServers).to.throw(TypeError)
    done()
  })

  test('invalid response', function (done) {
    nock('http://consul')
      .get('/v1/catalog/service/web?')
      .reply(404)

    var req = {}
    var res = { end: assertEnd, writeHead: assertHead }

    var md = consul({
      service: 'web',
      servers: ['http://consul']
    })

    md(req, res)

    function assertHead(code, headers) {
      expect(code).to.be.equal(502)
      expect(headers).to.be.deep.equal({'Content-Type': 'application/json'})
    }

    function assertEnd(data) {
      expect(data).to.be.match(/Proxy error: cannot retrieve/)
      done()
    }
  })

  test('timeout', function (done) {
    nock('http://consul')
      .get('/v1/catalog/service/web?')
      .delay(2000)
      .reply(404)

    var req = {}
    var res = { end: assertEnd, writeHead: assertHead }

    var md = consul({
      timeout: 100,
      service: 'web',
      servers: ['http://consul']
    })

    md(req, res)

    function assertHead(code, headers) {
      expect(code).to.be.equal(502)
      expect(headers).to.be.deep.equal({'Content-Type': 'application/json'})
    }

    function assertEnd(data) {
      expect(data).to.be.match(/Proxy error: cannot retrieve/)
      done()
    }
  })

  test('headers', function (done) {
    nock('http://consul')
      .get('/v1/catalog/service/web?')
      .matchHeader('User-Agent', 'rocky')
      .reply(200, consulResponse)

    var req = { rocky: { options: {} } }
    var res = {}

    var md = consul({
      headers: {
        'User-Agent': 'rocky'
      },
      service: 'web',
      servers: ['http://consul']
    })

    md(req, res, assert)

    function assert(err) {
      expect(err).to.be.undefined
      expect(req.rocky.options.balance).to.be.deep.equal(['http://127.0.0.1:80'])
      done()
    }
  })

  test('default servers', function (done) {
    nock('http://consul')
      .get('/v1/catalog/service/web?')
      .reply(200, consulResponse)

    var req = { rocky: { options: {} } }
    var res = {}

    var md = consul({
      service: 'web',
      servers: ['http://consul'],
      defaultServers: ['http://default'],
      interval: 100
    })

    md(req, res, assert)

    function assert(err) {
      expect(err).to.be.undefined
      expect(req.rocky.options.balance).to.be.deep.equal(['http://default'])

      setTimeout(assertInterval, 150)
    }

    function assertInterval() {
      md(req, res, function () {
        expect(req.rocky.options.balance).to.be.deep.equal(['http://127.0.0.1:80'])
        done()
      })
    }
  })

  test('events', function (done) {
    nock('http://consul')
      .get('/v1/catalog/service/web?')
      .reply(200, consulResponse)

    var req = { rocky: { options: {} } }
    var res = {}

    var md = consul({
      service: 'web',
      servers: ['http://consul'],
      onRequest: onRequest,
      onUpdate: onUpdate,
      onResponse: onResponse
    })

    md(req, res, assert)

    function onUpdate(err, servers) {
      expect(err).to.be.null
      expect(servers).to.be.an('array')
      expect(servers).to.have.length(1)
      expect(servers[0]).to.be.equal('http://127.0.0.1:80')
    }

    function onResponse(err, data, res) {
      expect(err).to.be.null
      expect(data).to.be.a('string')
      expect(data).to.match(/Node/)
      expect(data).to.match(/Address/)
      expect(res.statusCode).to.be.equal(200)
      expect(res.headers).to.have.property('content-type').to.match(/application\/json/)
    }

    function onRequest(httpOpts) {
      expect(httpOpts).to.be.an('object')
      expect(httpOpts.url).to.be.equal('http://consul/v1/catalog/service/web')
    }

    function assert(err) {
      expect(err).to.be.undefined
      expect(req.rocky.options.balance).to.be.deep.equal(['http://127.0.0.1:80'])
      done()
    }
  })
})

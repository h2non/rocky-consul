const request = require('got')
const parseUrl = require('url').parse

const consulBasePath = '/v1/catalog/service/'
const requiredParams = ['servers', 'service']

module.exports = Consul

function Consul(opts) {
  this.opts = opts
  this.urls = opts.defaultServers || []

  requiredParams.forEach(function (param) {
    if (!opts[param]) throw new TypeError('Missing required param: ' + param)
  })

  this.updating = false
  this.startInterval()
}

Consul.prototype.servers = function (cb) {
  if (this.urls.length) {
    return cb(null, this.urls)
  }
  this.update(cb)
}

Consul.prototype.update = function (cb) {
  var url = permute(this.opts.servers)
  cb = cb || function () {}

  this.updating = true
  this.request(url, function (err, servers) {
    this.updating = false

    if (err || !Array.isArray(servers)) {
      return cb(err)
    }

    var urls = mapServers(servers, this.opts)
    if (!urls || !urls.length) {
      return cb(null, this.urls)
    }

    this.urls = urls
    if (this.opts.onUpdate) {
      this.opts.onUpdate(err, urls)
    }

    cb(null, urls)
  }.bind(this))
}

Consul.prototype.startInterval = function () {
  this.interval = setInterval(function () {
    if (!this.updating) this.update()
  }.bind(this), this.opts.interval)
}

Consul.prototype.stopInterval = function () {
  if (this.interval) {
    clearInterval(this.interval)
  }
  this.interval = null
}

Consul.prototype.request = function (url, done) {
  var opts = this.opts
  var timeout = +opts.timeout || 5000
  var path = consulBasePath + opts.service
  var targetUrl = url + path

  var query = {}
  if (opts.tag) {
    query.tag = opts.tag
  }
  if (opts.datacenter) {
    query.datacenter = opts.datacenter
  }

  var httpOpts = {
    url: targetUrl,
    query: query,
    timeout: timeout,
    auth: opts.auth,
    headers: opts.headers
  }

  if (this.opts.onRequest) {
    this.opts.onRequest(httpOpts)
  }

  var handler = responseHandler(done).bind(this)
  request(httpOpts.url, httpOpts, handler)
}

function responseHandler(done) {
  return function (err, data, res) {
    if (this.opts.onResponse) {
      this.opts.onResponse(err, data, res)
    }

    if (err || res.statusCode >= 400 || !data) {
      return done(err || 'Invalid response')
    }

    done(null, JSON.parse(data))
  }
}

function mapServers(list, opts) {
  var protocol = opts.protocol || 'http'
  var port = protocol === 'https' ? 443 : 80

  return list
  .filter(function (s) {
    return s && s.Address
  })
  .map(function (s) {
    return protocol + '://' + s.ServiceAddress + ':' + (+s.ServicePort || port)
  })
}

function permute(arr) {
  var item = arr.shift()
  arr.push(item)
  return item
}

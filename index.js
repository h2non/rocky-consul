const request = require('got')
const parseUrl = require('url').parse
const assign = require('object-assign')

const consulBasePath = '/v1/catalog/service/'
const requiredParams = ['servers', 'service']
const interval = 60 * 2 * 1000

module.exports = exports = function (params) {
  var opts = assign({ interval: interval }, params)
  var consul = new Consul(opts)

  function middleware(req, res, next) {
    consul.servers(function (err, urls) {
      if (err || !urls || !urls.length) {
        return proxyError(res)
      }

      // Expose the server URLs to balance
      req.rocky.options.balance = urls
      next()
    })
  }

  // Explose the Consul client instance
  middleware.consul = consul

  return middleware
}

exports.Consul = Consul

function Consul(opts) {
  this.opts = opts
  this.urls = opts.defaultServers || []

  requiredParams.forEach(function (param) {
    if (!opts[param]) {
      throw new TypeError('Missing required param: ' + param)
    }
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

    if (this.opts.onUpdate) {
      this.opts.onUpdate(err, servers)
    }

    if (err || !Array.isArray(servers)) {
      return cb(err)
    }

    var urls = mapServers(servers, this.opts)
    if (urls && urls.length) {
      this.urls = urls
    }

    cb(null, this.urls)
  }.bind(this))
}

Consul.prototype.startInterval = function () {
  this.interval = setInterval(function () {
    if (this.updating) { return }
    this.update()
  }.bind(this), this.opts.interval)
}

Consul.prototype.stopInterval = function () {
  if (this.interval) {
    clearInterval(this.interval)
  }
  this.interval = null
}

Consul.prototype.request = function (url, cb) {
  var opts = this.opts
  var timeout = +opts.timeout || 5000
  var path = consulBasePath + opts.service
  var targetUrl = url + path

  var query = {}
  if (opts.datacenter) {
    query = opts.datacenter
  }
  if (opts.tag) {
    query.tag = opts.tag
  }

  var httpOpts = {
    query: query,
    timeout: timeout,
    auth: opts.auth,
    headers: opts.headers
  }

  request(targetUrl, httpOpts, function handler(err, data, res) {
    if (this.opts.onResponse) {
      this.opts.onResponse(err, data, res)
    }

    if (err || res.statusCode >= 400 || !data) {
      return cb(err || 'Invalid response')
    }
    cb(null, JSON.parse(data))
  }.bind(this))
}

function proxyError(res) {
  var message = 'Proxy error: cannot retrieve servers'
  res.writeHead(502, {'Content-Type': 'application/json'})
  res.end(JSON.stringify({ message: message }))
}

function mapServers(list, opts) {
  var protocol = opts.protocol || 'http'
  var port = protocol === 'https' ? 443 : 80

  return list
  .filter(function (s) {
    return s && s.Address
  })
  .map(function (s) {
    if (s.ServiceAddress) {
      return s.ServiceAddress
    }
    return protocol + '://' + s.Address + ':' + (+s.ServicePort || port)
  })
}

function permute(arr) {
  var item = arr.shift()
  arr.push(item)
  return item
}

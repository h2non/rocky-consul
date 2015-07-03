const http = require('http')
const https = require('https')
const parseUrl = require('url').parse
const assign = require('object-assign')

const consulBasePath = '/v1/catalog/service/'
const requiredParams = ['servers', 'service']
const interval = 60 * 1000

exports = module.exports = function (params) {
  var opts = assign({ interval: interval }, params)
  var consul = new Consul(opts)

  return function (req, res, next) {
    var servers = opts.servers
    if (!servers.length) return next()

    consul.servers(function (err, urls) {
      if (err) return next(err)

      req.rocky.options.balance = urls
      next()
    })
  }
}

exports.Consul = Consul

function Consul(opts) {
  this.opts = opts
  this.urls = []
  this.updated = Date.now()

  requiredParams.forEach(function (param) {
    if (!opts[param]) {
      throw new TypeError('Missing required param: ' + param)
    }
  })
}

Consul.prototype.servers = function (cb) {
  if (this.isOutdated() === false) {
    return cb(null, this.urls)
  }
  this.refresh(cb)
}

Consul.prototype.isOutdated = function () {
  return this.urls.length === 0
    && this.opts.interval > (Date.now() - this.updated)
}

Consul.prototype.refresh = function (cb) {
  var self = this
  var url = permute(this.opts.servers)

  this.request(url, onRefresh)

  function onRefresh(err, servers) {
    if (err) return cb(err)

    var urls = mapServers(servers, self.opts)
    if (urls && urls.length) {
      self.urls = urls
      self.updated = Date.now()
    }

    cb(null, self.urls)
  }
}

Consul.prototype.request = function (url, cb) {
  var opts = this.opts
  var parts = parseUrl(url)
  var path = consulBasePath + this.opts.service

  var params = ['tag', 'datacenter'].map(function (param) {
    var value = opts[param]
    return value ? param + '=' + value : ''
  }).join('&')
  path += '?' + params

  var client = ~url.indexOf('https://') ? https : http
  client.request({
    method: 'GET',
    hostname: parts.hostname,
    port: parts.port,
    auth: parts.auth,
    path: path
  }, handler)
  .on('error', cb)
  .end()

  function handler(res) {
    if (res.statusCode >= 400) {
      return cb(new Error('Invalid response status'))
    }

    var body = ''
    res.setEncoding('utf8')
    res.on('data', function (chunk) {
      body += chunk
    })
    res.on('end', function () {
      cb(null, JSON.parse(body))
    })
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

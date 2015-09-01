const assign = require('object-assign')
const Consul = require('./lib/consul')

const interval = 60 * 2 * 1000 // 2 minutes

module.exports = exports = function (params) {
  var defaults = { interval: interval }
  var opts = assign(defaults, params)
  var consul = new Consul(opts)

  function middleware(req, res, next) {
    consul.servers(function (err, urls) {
      if (err || !urls || !urls.length) {
        return proxyError(res)
      }

      // Expose to rocky the URLs to balance
      req.rocky.options.balance = urls

      // Continue with next middleware
      next()
    })
  }

  // Expose the Consul client instance
  middleware.consul = consul

  return middleware
}

function proxyError(res) {
  if (res.headersSent) return
  var message = 'Proxy error: cannot retrieve servers from Consul'
  res.writeHead(502, {'Content-Type': 'application/json'})
  res.end(JSON.stringify({ message: message }))
}

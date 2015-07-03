var rocky = require('rocky')
var consul = require('./')

var proxy = rocky()

// Plug in the middleware
proxy.use(consul({
  // Servers refresh interval
  interval: 5000,
  // App service name (required)
  service: 'web',
  // Use a custom datacenter (optional)
  datacenter: 'ams2',
  // Use a custom service tag (optional)
  //tag: '1.0',
  // Consul servers pool
  servers: [
    'http://demo.consul.io',
    'http://demo.consul.io'
  ]
}))

proxy.get('/*')

proxy.listen(3000)

console.log('Rocky server listening on port: ' + 3000)

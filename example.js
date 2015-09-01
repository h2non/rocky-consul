var rocky = require('rocky')
var consul = require('./')

var proxy = rocky()

// Plug in the middleware
proxy.use(consul({
  // Servers refresh interval
  interval: 10000,
  // App service name (required)
  service: 'web',
  // Use a custom datacenter (optional)
  datacenter: 'ams2',
  // Consul servers pool
  servers: [
    'http://demo.consul.io',
    'http://demo.consul.io'
  ]
}))

// Plugin another middleware at route level only
var route = proxy.get('/download')

route.use(consul({
  // Servers refresh interval
  interval: 10000,
  // App service name (required)
  service: 'web',
  // Use a custom datacenter (optional)
  datacenter: 'ams2',
  // Consul servers pool
  servers: [
    'http://demo.consul.io',
    'http://demo.consul.io'
  ]
}))

// Handle all the traffic
proxy.get('/*')

proxy.listen(3000)

console.log('Rocky server listening on port: ' + 3000)

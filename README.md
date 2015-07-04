# rocky-consul [![Build Status](https://api.travis-ci.org/h2non/rocky-consul.svg?branch=master&style=flat)](https://travis-ci.org/h2non/rocky-consul) [![NPM](https://img.shields.io/npm/v/rocky-consul.svg)](https://www.npmjs.org/package/rocky-consul)

[rocky](https://github.com/h2non/rocky) middleware for service discovery and balancing using [Consul](https://consul.io).

Via this middleware you can easily setup a reverse HTTP proxy powered by rocky with dynamic balancing using Consul for service discovery.

<table>
<tr>
<td><b>Name</b></td><td>consul</td>
</tr>
<tr>
<td><b>Rocky</b></td><td>+0.2</td>
</tr>
<tr>
<td><b>Scope</b></td><td>global, route</td>
</tr>
<tr>
<td><b>Type</b></td><td>forward / balance</td>
</tr>
</table>

## Installation

```
npm install rocky-consul --save
```

## Usage

```js
var rocky = require('rocky')
var consul = require('rocky-consul')

var proxy = rocky()
```

Plug in as global middleware
```js
proxy.use(consul({
  // Servers refresh interval (default to 60000)
  interval: 60 * 5 * 1000,
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
proxy.all('/*')

proxy.listen(3000)
console.log('Rocky server started')
```

Plug in as route level middleware
```js
proxy
  .get('/download/:id')
  .use(consul({
    // Servers refresh interval (default to 60000)
    interval: 60 * 5 * 1000,
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

// Handle the rest of the traffic without using Consul
proxy.all('/*')
  .forward('http://my.server')
  .replay('http://old.server')

proxy.listen(3000)
console.log('Rocky server started')
```

## API

### consul(options) `=>` Function(req, res, next)

Return a middleware `function` with the Consul client as static property `function.consul`.

#### Options

- **service** `string` - Consul service. Required
- **servers** `array<string>` - List of Consul servers URLs. Required
- **datacenter** `string` - Custom datacenter to use. If not defined the default one will be used
- **tag** `string` - Use a specific tag for the service
- **defaultServers** `array<string>` - Optional list of default servers.
- **protocol** `string` - Transport URI protocol. Default to `http`
- **timeout** `number` - Consul server timeout in miliseconds. Default to `5000` = 5 seconds
- **interval** `number` - Consul servers update interval in miliseconds. Default to `120000` = 2 minutes
- **headers** `object` - Map of key-value headers to send to Consul
- **auth** `string` - Basic authentication for Consul. E.g: `user:p@s$`

### Consul(options)

Internally used micro Consul client interface.

#### consul#servers(cb)

Returns the Consul servers for the given service.
Passed arguments to the callback are: `cb(err, servers)`.

#### consul#update(cb)

Perform the servers update asking to Consul
Passed arguments to the callback are: `cb(err, servers)`.

#### consul#startInternval()

Start the servers update interval as recurrent job for the given miliseconds defined at `options.interval`.
You should not call this method unless you already called `stopInterval()`.

#### consul#stopInternval()

Stop server update interval process.

## License

MIT - Tomas Aparicio

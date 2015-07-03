# rocky-consul

[rocky](https://github.com/h2non/rocky) middleware for service discovery and balancing using [Consul](https://consul.io).

**Work in progress**

<table>
<tr>
<td><b>Name</b></td><td>consul</td>
</tr>
<tr>
<td><b>Rocky</b></td><td>+0.1</td>
</tr>
<tr>
<td><b>Type</b></td><td>generic</td>
</tr>
</table>

## Usage

```js
var rocky = require('rocky')
var consul = require('rocky-consul')

var proxy = rocky()

// Plug in the middleware
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

// Handle all the trafficf4
proxy.all('/*')

proxy.listen(3000)
console.log('Rocky server listening on port: ' + 3000)
```

### Options

- **service** `string` - Consul service. Required
- **servers** `array<string>` - List of Consul servers URLs. Required
- **datacenter** `string` - Custom datacenter to use. If not defined the default one will be used
- **tag** `string` - Use a specific tag for the service
- **defaultServers** `array<string>` - Optional list of default servers.
- **protocol** `string` - Transport URI protocol. Default to `http`
- **timeout** `number` - Consul server timeout in miliseconds. Default to `5000` = 5 seconds
- **interval** `number` - Consul servers update interval in miliseconds. Default to `60000` = 1 minute
- **headers** `object` - Map of key-value headers to send to Consul
- **auth** `string` - Basic authentication for Consul. E.g: `user:p@s$`

## License

MIT - Tomas Aparicio

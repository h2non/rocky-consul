# rocky-consul

[rocky](https://github.com/h2non/rocky) middleware for [Consul](https://consul.io).

**Work in progress**

<table>
<tr>
<td><b>Name</b></td><td>consul</td>
</tr>
<tr>
<td><b>Rocky</b></td><td>+0.1</td>
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
  // Use a custom service tag (optional)
  tag: '1.0',
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
- **protocol** `string` - Transport URI protocol. Default to `http`
- **interval** `number` - Consul servers update interval in miliseconds. Default to `60000` = 1 minute

## License

MIT - Tomas Aparicio

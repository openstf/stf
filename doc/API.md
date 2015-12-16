## Overview

This document describes important RESTful APIs of STF. These APIs may open the door to new creative uses of STF. You can use these APIs for running UI tests on real devices. Integrating STF with CI tools such as Jenkins etc. Building device farm for data extraction for smartphone app data mining. You can even use these apis for creating bitcoin mining farm. Possibilities are infinite!

*PS: Please, don't forget to give us our share, if you successfully mine some bitcoins ;)*.

Let's talk about APIs now. Internally STF uses [Swagger](http://swagger.io/) interface for its API implementation. For those who don't know about Swagger, Swagger provides specifications for RESTful apis. By using it you can generate documentations and client SDKs in various language automatically for Swagger-enabled apps. This gives you power to use STF APIs in any language of your favorite. You can read more about Swagger at [here](http://swagger.io/getting-started/).

### Swagger Documentations

You can check swagger documentations for STF APIs from [here](https://vbanthia.github.io/angular-swagger-ui). From this document you can check latest APIs, their definitions, usage etc.

## APIs
- [Authentication](#authentication)
- [Devices](#devices)
- [User](#user)

### Authentication
STF uses oauth2 for RESTful APIs authentication. In order to use APIs, you will first need to generate an access token. Access tokens can be easily generated from STF UI. Just go to the **Settings** tab and generate new access token from keys section. Don't forget to save this token somewhere, you will not be able to see it again.

Put access token in the header of every request

Curl Sample
```bash
curl -H "Authorization: bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user
```

NodeJS Sample
```js

var Swagger = require('swagger-client');

var SWAGGER_URL = 'https://stf.example.org/api/v1/swagger.json';
var AUTH_TOKEN  = 'xx-xxxx-xx';

// Without Promise
var client = new Swagger({
  url: SWAGGER_URL
, authorizations: {
    accessTokenAuth: new Swagger.ApiKeyAuthorization('Authorization', 'bearer ' + AUTH_TOKEN, 'header')
  }
, success: function() {
    client.user.getUser(function(user) {
      console.log(user.obj)
    })
 }
});

// Using Promise
var clientWithPromise = new Swagger({
  url: SWAGGER_URL
, usePromise: true
, authorizations: {
    accessTokenAuth: new Swagger.ApiKeyAuthorization('Authorization', 'bearer ' + AUTH_TOKEN, 'header')
  }
})

clientWithPromise.then(function(api) {
  api.user.getUser()
    .then(function(res) {
      console.log(res.obj)
    })
})
```

### Devices
#### /devices

**List all STF devices including disconnected or offline ones**

```bash
GET /api/v1/devices
```

Curl Sample

```bash
curl -H "Authorization: bearer OAUTH-TOKEN" https://stf.example.org/api/v1/devices
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  api.devices.getDevices()
    .then(function(res) {
      console.log(res.obj.devices.length)
    })
})

// OR
clientWithPromise.then(function(api) {
  api.devices.getDevices({fields: 'serial,using,ready'})
    .then(function(res) {
      console.log(res.obj.devices)
    })
})
```

#### /devices/{serial}

**Provide information to specific device**

```bash
GET /api/v1/devices/{serial}
```

Curl Sample

```bash
curl -H "Authorization: bearer OAUTH-TOKEN" https://stf.example.org/api/v1/devices/xxxxxxxxx
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  api.devices.getDeviceBySerial({serial: 'EP7351U3WQ'})
    .then(function(res) {
      console.log(res.obj.device)
    })
})

// OR
clientWithPromise.then(function(api) {
  api.devices.getDeviceBySerial({serial: 'EP7351U3WQ', fields: 'serial,using,ready'})
    .then(function(res) {
      console.log(res.obj.device)
    })
})
```

### User
#### /user

**Provides current authenticated user information**

```bash
GET /api/v1/user
```

Curl Sample

```bash
curl -H "Authorization: bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  api.user.getUser()
    .then(function(res) {
      console.log(res.obj)
    })
})
```

#### /user/devices

**Provide devices owned by user**

```bash
GET /api/v1/user/devices
```

Curl Sample

```bash
curl -H "Authorization: bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user/devices
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  api.user.getUserDevices()
    .then(function(res) {
      console.log(res.obj.devices.length)
    })
})

// OR
clientWithPromise.then(function(api) {
  api.user.getUserDevices({fields: 'serial,using,ready'})
    .then(function(res) {
      console.log(res.obj.devices)
    })
})
```

**Add new device for user**

```bash
POST /api/v1/user/devices
```

Curl Sample

```bash
curl -X POST --header "Content-Type:application/json" --data '{"serial":"EP7351U3WQ"}' -H "Authorization: bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user/devices
```

NodeJS Sample

```js
var device = {serial: 'CB5125LBYM', timeout: 900000 }

clientWithPromise.then(function(api) {
  return api.user.addUserDevice({device: device})
    .then(function(res) {
      console.log(res.obj)
    })
})
.catch(function(err) {
  console.log(err)
})
```

**Delete a device from user**

```bash
DELETE /api/v1/user/devices/{serial}
```

Curl Sample

```bash
curl -X DELETE -H "Authorization: bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user/devices/{serial}
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  return api.user.deleteUserDeviceBySerial({serial: 'CB5125LBYM'})
    .then(function(res) {
      console.log(res.obj)
    })
})
.catch(function(err) {
  console.log(err)
})
```

#### /user/devices/{serial}/remoteConnect

**Remote Connect**

```bash
POST /api/v1/user/devices/{serial}/remoteConnect
```

Curl Sample

```bash
curl -X POST --header "Content-Type:application/json" -H "Authorization: bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user/devices/{serial}/remoteConnect
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  return api.user.remoteConnectUserDeviceBySerial({serial: 'CB5125LBYM'})
    .then(function(res) {
      console.log(res.obj.remoteConnectUrl)
    })
})
.catch(function(err) {
  console.log(err)
})
```

**Remote Disconnect**

```bash
DELETE /api/v1/user/devices/{serial}/remoteConnect
```

Curl Sample

```bash
curl -X DELETE -H "Authorization: bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user/devices/{serial}/remoteConnect
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  return api.user.remoteDisconnectUserDeviceBySerial({serial: 'CB5125LBYM'})
    .then(function(res) {
      console.log(res.obj)
    })
})
.catch(function(err) {
  console.log(err)
})
```

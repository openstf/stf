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

## Sample Usages
- [ConnectDevice](#connect-device)
- [DisconnectDevice](#disconnect-device)

### Authentication
STF uses oauth2 for RESTful APIs authentication. In order to use APIs, you will first need to generate an access token. Access tokens can be easily generated from STF UI. Just go to the **Settings** tab and generate new access token from keys section. Don't forget to save this token somewhere, you will not be able to see it again.

Put access token in the header of every request

Curl Sample
```bash
curl -H "Authorization: Bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user
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
    accessTokenAuth: new Swagger.ApiKeyAuthorization('Authorization', 'Bearer ' + AUTH_TOKEN, 'header')
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
    accessTokenAuth: new Swagger.ApiKeyAuthorization('Authorization', 'Bearer ' + AUTH_TOKEN, 'header')
  }
})

clientWithPromise.then(function(api) {
  api.user.getUser()
    .then(function(res) {
      console.log(res.obj.user.email)
      // vishal@example.com
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
curl -H "Authorization: Bearer OAUTH-TOKEN" https://stf.example.org/api/v1/devices
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  api.devices.getDevices()
    .then(function(res) {
      console.log(res.obj.devices.length)
      // 50
    })
})

// OR
clientWithPromise.then(function(api) {
  api.devices.getDevices({fields: 'serial,using,ready'})
    .then(function(res) {
      console.log(res.obj.devices)
      // [ { serial: 'xxxx', using: false, ready: true },
      //   { serial: 'yyyy', using: false, ready: true }]
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
curl -H "Authorization: Bearer OAUTH-TOKEN" https://stf.example.org/api/v1/devices/xxxxxxxxx
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  api.devices.getDeviceBySerial({serial: 'xxxx'})
    .then(function(res) {
      console.log(res.obj.device.serial)
      // xxxx
    })
})

// OR
clientWithPromise.then(function(api) {
  api.devices.getDeviceBySerial({serial: 'xxxx', fields: 'serial,using,ready'})
    .then(function(res) {
      console.log(res.obj.device)
      // { serial: 'xxxx', using: false, ready: true }
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
curl -H "Authorization: Bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  api.user.getUser()
    .then(function(res) {
      console.log(res.obj.user.email)
      // vishal@example.com
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
curl -H "Authorization: Bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user/devices
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  api.user.getUserDevices()
    .then(function(res) {
      console.log(res.obj.devices.length)
      // 1
    })
})

// OR
clientWithPromise.then(function(api) {
  api.user.getUserDevices({fields: 'serial,using,ready'})
    .then(function(res) {
      console.log(res.obj.devices)
      // [ { serial: 'xxxx', using: true, ready: true } ]
    })
})
```

**Add new device for user**

```bash
POST /api/v1/user/devices
```

Curl Sample

```bash
curl -X POST --header "Content-Type:application/json" --data '{"serial":"EP7351U3WQ"}' -H "Authorization: Bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user/devices
```

NodeJS Sample

```js
var device = {serial: 'yyyy', timeout: 900000 }

clientWithPromise.then(function(api) {
  return api.user.addUserDevice({device: device})
    .then(function(res) {
      console.log(res.obj)
      // { success: true, description: 'Device successfully added' }
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
curl -X DELETE -H "Authorization: Bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user/devices/{serial}
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  return api.user.deleteUserDeviceBySerial({serial: 'yyyy'})
    .then(function(res) {
      console.log(res.obj)
      // { success: true, description: 'Device successfully removed' }
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
curl -X POST --header "Content-Type:application/json" -H "Authorization: Bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user/devices/{serial}/remoteConnect
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  return api.user.remoteConnectUserDeviceBySerial({serial: 'CB5125LBYM'})
    .then(function(res) {
      console.log(res.obj.remoteConnectUrl)
      // $PROVIDER_IP:16829
    })
})
.catch(function(err) {
  console.log(err)
  // {"success":false,
  //  "description":"Device is not owned by you or is not available"}' }
})
```

**Remote Disconnect**

```bash
DELETE /api/v1/user/devices/{serial}/remoteConnect
```

Curl Sample

```bash
curl -X DELETE -H "Authorization: Bearer OAUTH-TOKEN" https://stf.example.org/api/v1/user/devices/{serial}/remoteConnect
```

NodeJS Sample

```js
clientWithPromise.then(function(api) {
  return api.user.remoteDisconnectUserDeviceBySerial({serial: 'CB5125LBYM'})
    .then(function(res) {
      console.log(res.obj)
      // { success: true,
    //     description: 'Device remote disconnected successfully' }
    })
})
.catch(function(err) {
  console.log(err)
  // {"success":false,"description":"Device is not owned by you or is not available"}
})
```

## Sample Usages
### Connect Device

```js
// stf-connect.js

var Swagger = require('swagger-client');

var SWAGGER_URL = 'https://stf.example.org/api/v1/swagger.json';
var AUTH_TOKEN  = 'xx-xxxx-xx';

// Using Promise
var client = new Swagger({
  url: SWAGGER_URL
, usePromise: true
, authorizations: {
    accessTokenAuth: new Swagger.ApiKeyAuthorization('Authorization', 'Bearer ' + AUTH_TOKEN, 'header')
  }
})

var serial = process.argv.slice(2)[0]

client.then(function(api) {
  return api.devices.getDeviceBySerial({
    serial: serial
  , fields: 'serial,present,ready,using,owner'
  }).then(function(res) {
      // check if device can be added or not
      var device = res.obj.device
      if (!device.present || !device.ready || device.using || device.owner) {
        console.log('Device is not available')
        return
      }

      // add device to user
      return api.user.addUserDevice({
        device: {
          serial: device.serial
        , timeout: 900000
        }
      }).then(function(res) {
        if (!res.obj.success) {
          console.log('Could not add device')
          return
        }

        // get remote connect url
        return api.user.remoteConnectUserDeviceBySerial({
          serial: device.serial
        }).then(function(res) {
          console.log(res.obj.remoteConnectUrl)
        })
      })
  })
})
```
```bash
node stf-connect.js xxxx
# $PROVIDR_IP:16829
```

### Disconnect Device

```js
var Swagger = require('swagger-client');

var SWAGGER_URL = 'https://stf.example.org/api/v1/swagger.json';
var AUTH_TOKEN  = 'xx-xxxx-xx';

var client = new Swagger({
  url: SWAGGER_URL
, usePromise: true
, authorizations: {
    accessTokenAuth: new Swagger.ApiKeyAuthorization('Authorization', 'Bearer ' + AUTH_TOKEN, 'header')
  }
})

var serial = process.argv.slice(2)[0]

client.then(function(api) {  
  return api.user.getUserDevices({
    serial: serial
  , fields: 'serial,present,ready,using,owner'
  }).then(function(res) {
      // check if user has that device or not
      var devices = res.obj.devices
      var hasDevice = false

      devices.forEach(function(device) {
        if(device.serial === serial) {
          hasDevice = true;
        }
      })

      if (!hasDevice) {
        console.log('You do not own that device')
        return
      }

      return api.user.deleteUserDeviceBySerial({
        serial: serial
      }).then(function(res) {
        if (!res.obj.success) {
          console.log('Could not disconnect')
          return
        }
        console.log('Device disconnected successfully!')
      })
  })
})
```

```bash
node stf-disconnect.js xxxx
# Device disconnected successfully!
```

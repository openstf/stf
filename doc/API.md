# STF API

## Overview

STF API is a RESTful API which allows you to reserve and release any STF device. Internally STF uses [Swagger](http://swagger.io/) interface for its API implementation. For those who don't know about Swagger, Swagger provides specifications for RESTful apis. By using it you can generate documentation and client SDKs in various language automatically for Swagger-enabled apps. This gives you power to use STF APIs in any language of your favorite. You can read more about Swagger [here](http://swagger.io/getting-started/).

## Swagger documentation

Swagger documentation for the API is available [here](https://vbanthia.github.io/angular-swagger-ui).

## APIs

- [Authentication](#authentication)
- [Devices](#devices)
- [User](#user)

A few [examples](#examples) are also provided. We also have a more advanced example showing [how to use the API with Appium](https://github.com/openstf/stf-appium-example).

### Authentication

STF uses OAuth 2.0 for authentication. In order to use the API, you will first need to generate an access token. Access tokens can be easily generated from the STF UI. Just go to the **Settings** tab and generate a new access token in **Keys** section. Don't forget to save this token somewhere, you will not be able to see it again.

The access token must be included in every request.

Using cURL:

```bash
curl -H "Authorization: Bearer YOUR-TOKEN-HERE" https://stf.example.org/api/v1/user
```

Using Node.js:

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

### Pretty printing output

Please use [jq](https://stedolan.github.io/jq/manual/) for pretty printing. It's very easy to use:

```sh
curl -H "Authorization: Bearer YOUR-TOKEN-HERE" https://stf.example.org/api/v1/devices | jq .
```

It also provides much more complex patterns for retrieving and/or filtering data.

### Devices

#### GET /devices

List **all** STF devices (including disconnected or otherwise inaccessible devices).

```bash
GET /api/v1/devices
```

Using cURL:

```bash
curl -H "Authorization: Bearer YOUR-TOKEN-HERE" https://stf.example.org/api/v1/devices
```

Using Node.js:

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

#### GET /devices/{serial}

Returns information about a specific device.

```bash
GET /api/v1/devices/{serial}
```

Using cURL:

```bash
curl -H "Authorization: Bearer YOUR-TOKEN-HERE" https://stf.example.org/api/v1/devices/xxxxxxxxx
```

Using Node.js:

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

#### GET /user

Returns information about yourself (the authenticated user).

```bash
GET /api/v1/user
```

Using cURL:

```bash
curl -H "Authorization: Bearer YOUR-TOKEN-HERE" https://stf.example.org/api/v1/user
```

Using Node.js:

```js
clientWithPromise.then(function(api) {
  api.user.getUser()
    .then(function(res) {
      console.log(res.obj.user.email)
      // vishal@example.com
    })
})
```

#### GET /user/devices

Returns a list of devices currently being used by the authenticated user.

```bash
GET /api/v1/user/devices
```

Using cURL:

```bash
curl -H "Authorization: Bearer YOUR-TOKEN-HERE" https://stf.example.org/api/v1/user/devices
```

Using Node.js:

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

#### POST /user/devices

Attempts to add a device under the authenticated user's control. This is analogous to pressing "Use" in the UI.

```bash
POST /api/v1/user/devices
```

Using cURL:

```bash
curl -X POST --header "Content-Type: application/json" --data '{"serial":"EP7351U3WQ"}' -H "Authorization: Bearer YOUR-TOKEN-HERE" https://stf.example.org/api/v1/user/devices
```

Using Node.js:

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

#### DELETE /user/devices/{serial}

Removes a device from the authenticated user's device list. This is analogous to pressing "Stop using" in the UI.

```bash
DELETE /api/v1/user/devices/{serial}
```

Using cURL:

```bash
curl -X DELETE -H "Authorization: Bearer YOUR-TOKEN-HERE" https://stf.example.org/api/v1/user/devices/{serial}
```

Using Node.js:

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

#### POST /user/devices/{serial}/remoteConnect

Allows you to retrieve the remote debug URL (i.e. an `adb connect`able address) for a device the authenticated user controls.

_Note that if you haven't added your ADB key to STF yet, the device may be in unauthorized state after connecting to it for the first time. We recommend you make sure your ADB key has already been set up properly before you start using this API. You can add your ADB key from the settings page, or by connecting to a device you're actively using in the UI and responding to the dialog that appears._

```bash
POST /api/v1/user/devices/{serial}/remoteConnect
```

Using cURL:

```bash
curl -X POST --header "Content-Type: application/json" -H "Authorization: Bearer YOUR-TOKEN-HERE" https://stf.example.org/api/v1/user/devices/{serial}/remoteConnect
```

Using Node.js:

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

#### DELETE /api/v1/user/devices/{serial}/remoteConnect

Disconnect a remote debugging session.

```bash
DELETE /api/v1/user/devices/{serial}/remoteConnect
```

Using cURL:

```bash
curl -X DELETE -H "Authorization: Bearer YOUR-TOKEN-HERE" https://stf.example.org/api/v1/user/devices/{serial}/remoteConnect
```

Using Node.js:

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

## Examples

### Connect to a device and retrieve its remote debug URL

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

### Disconnect a device once you no longer need it

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

# Deployment

So you've got STF running via `stf local` and now you'd like to deploy it to real servers. While there are of course various ways to set everything up, this document will focus on a [systemd](http://www.freedesktop.org/wiki/Software/systemd/) + [Docker](https://www.docker.com/) deployment. Even if you've got a different setup, you should be able to use the configuration files as a rough guide. You can also check some [Setup Examples](https://github.com/openstf/setup-examples) which uses [Vagrant](https://www.vagrantup.com/) and [Virtual Box](https://www.virtualbox.org/) to create a virtual setup. But before going there, it is highly recommended that you read this document thoroughly.

STF consists of multiple independent processes communicating via [ZeroMQ](http://zeromq.org/) and [Protocol Buffers](https://github.com/google/protobuf). We call each process a "unit" to match systemd terminology.

The core topology is as follows.

![Rough core topology](topo-v1.png?raw=true)

Each unit and its function will be explained later in the document.

## Assumptions

For this example deployment, the following assumptions will be made. You will need to adjust them as you see fit. Note that this deployment was designed to be relatively easy to set up without external tools, and may not be optimal. They're also configured so that you can run everything on a single host if required.

* You have [systemd](http://www.freedesktop.org/wiki/Software/systemd/) running on each host
* You have [Docker](https://www.docker.com/) running on each host
* Each host has an `/etc/environment` (a la [CoreOS](https://coreos.com/)) file with `COREOS_PRIVATE_IPV4=MACHINE_IP_HERE`. This is used to load the machine IP address in configuration files.
  - You can create the file yourself or alternatively replace `${COREOS_PRIVATE_IPV4}` manually as required.
* You're deploying [openstf/stf:latest](https://registry.hub.docker.com/u/openstf/stf/). There's also a fixed tag for each release if you're feeling less adventurous.
* You want to access the app at https://stf.example.org/. Change to the actual URL you want to use.
* You have RethinkDB running on `rethinkdb.stf.example.org`. Change to the actual address/IP where required.
  - You may also use SRV records by giving the url in `srv+tcp://rethinkdb-28015.skydns.stf.example.org` format.
* You have two static IPs available for the main communication bridges (or "triproxies"), or are able to figure out an alternate method. In this example we'll use `devside.stf.example.org` and `appside.stf.example.org` as easy to remember addresses.
  - You can also use SRV records as mentioned above.

## Roles

Since we're dealing with actual physical devices, some units need to be deployed to specific servers to make sure that they actually connect with the devices. We currently use [fleet](https://github.com/coreos/fleet), but in this example deployment we'll just assume that you already know how you wish to deploy and distribute the systemd units.

### Provider role

The provider role requires the following units, which must be together on a single or more hosts.

* [adbd.service](#adbservice)
* [stf-provider@.service](#stf-providerservice)

### App role

The app role can contain any of the following units. You may distribute them as you wish, as long as the [assumptions above](#assumptions) hold. Some units may have more requirements, they will be listed where applicable.

* [rethinkdb-proxy-28015.service](#rethinkdb-proxy-28015service)
* [stf-app@.service](#stf-appservice)
* [stf-auth@.service](#stf-authservice)
* [stf-log-rethinkdb.service](#stf-log-rethinkdbservice)
* [stf-migrate.service](#stf-migrateservice)
* [stf-notify-hipchat.service](#stf-notify-hipchatservice)
* [stf-processor@.service](#stf-processorservice)
* [stf-provider@.service](#stf-providerservice)
* [stf-reaper.service](#stf-reaperservice)
* [stf-storage-plugin-apk@.service](#stf-storage-plugin-apkservice)
* [stf-storage-plugin-image@.service](#stf-storage-plugin-imageservice)
* [stf-storage-temp@.service](#stf-storage-tempservice)
* [stf-triproxy-app.service](#stf-triproxy-appservice)
* [stf-triproxy-dev.service](#stf-triproxy-devservice)
* [stf-websocket@.service](#stf-websocketservice)

### Database role

The database role requires the following units, UNLESS you already have a working RethinkDB server/cluster running somewhere. In that case you simply will not have this role, and should point your [rethinkdb-proxy-28015.service](#rethinkdb-proxy-28015service) to that server instead.

* [rethinkdb.service](#rethinkdbservice)

### Proxy role

The proxy role ties all HTTP-based units together behind a common reverse proxy. See [nginx configuration](#nginx-configuration) for more information.

## Support units

These external units are required for the actual STF units to work.

### `adbd.service`

You need to have a single `adbd.service` unit running on each host where you have devices connected.

The docker container comes with a default, insecure ADB key for convenience purposes, so that you won't have to accept a new ADB key on your devices each time the unit restarts. This is insecure because anyone in possession of the insecure key will then be able to access your device without any prompt, assuming they have physical access to it. This may or may not be a problem for you. See [sorccu/adb](https://registry.hub.docker.com/u/sorccu/adb/) for more information if you'd like to provide your own keys.

```ini
[Unit]
Description=ADB daemon
After=docker.service
Requires=docker.service

[Service]
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull sorccu/adb:latest
ExecStartPre=-/usr/bin/docker kill %p
ExecStartPre=-/usr/bin/docker rm %p
ExecStart=/usr/bin/docker run --rm \
  --name %p \
  --privileged \
  -v /dev/bus/usb:/dev/bus/usb \
  --net host \
  sorccu/adb:latest
ExecStop=-/usr/bin/docker stop -t 2 %p
```

### `rethinkdb.service`

As mentioned before, you only need this unit if you do not have an existing RethinkDB cluster. This configuration is provided as an example, and will get you going, but is not very robust or secure.

If you need to expand your RethinkDB cluster beyond one server you may encounter problems that you'll have to solve by yourself, we're not going to help with that. There are many ways to configure the unit, this is just one possibility! Note that if you end up not using `--net host`, you will then have to give `rethinkdb` the `--canonical-address` option with the server's real IP, and expose the necessary ports somehow.

You will also have to:

1. Modify the `--cache-size` as you please. It limits the amount of memory RethinkDB uses and is given in megabytes, but is not an absolute limit! Real usage can be slightly higher.
2. Update the version number in `rethinkdb:2.1.1` for the latest release. We don't use `rethinkdb:latest` here because then you might occasionally have to manually rebuild your indexes after an update and not even realize it, bringing the whole system effectively down.
3. The `AUTHKEY` environment variable is only for convenience when linking. So, the first time you set things up, you will have to access http://DB_SERVER_IP:8080 after starting the unit and run the following command:

```javascript
r.db('rethinkdb').table('cluster_config').get('auth').update({auth_key: 'newkey'})
```

More information can be found [here](https://rethinkdb.com/docs/security/). You will then need to replace `YOUR_RETHINKDB_AUTH_KEY_HERE_IF_ANY` in the the rest of the units with the real authentication key.

Here's the unit configuration itself.

```ini
[Unit]
Description=RethinkDB
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull rethinkdb:2.1.1
ExecStartPre=-/usr/bin/docker kill %p
ExecStartPre=-/usr/bin/docker rm %p
ExecStartPre=/usr/bin/mkdir -p /srv/rethinkdb
ExecStartPre=/usr/bin/chattr -R +C /srv/rethinkdb
ExecStart=/usr/bin/docker run --rm \
  --name %p \
  -v /srv/rethinkdb:/data \
  -e "AUTHKEY=YOUR_RETHINKDB_AUTH_KEY_HERE_IF_ANY" \
  --net host \
  rethinkdb:2.1.1 \
  rethinkdb --bind all \
    --cache-size 8192
ExecStop=-/usr/bin/docker stop -t 10 %p
```

### `rethinkdb-proxy-28015.service`

You need a single instance of the `rethinkdb-proxy-28015.service` unit on each host where you have another unit that needs to access the database. Having a local proxy simplifies configuration for other units and allows the `AUTHKEY` to be specified only once.

Note that the `After` condition also specifies the [rethinkdb.service](#rethinkdbservice) unit just in case you're on a low budget and want to run the RethinkDB unit on the same server as the rest of the units, which by the way is NOT recommended at all.

```ini
[Unit]
Description=RethinkDB proxy/28015
After=docker.service rethinkdb.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/ambassador:latest
ExecStartPre=-/usr/bin/docker kill %p
ExecStartPre=-/usr/bin/docker rm %p
ExecStart=/usr/bin/docker run --rm \
  --name %p \
  -e "AUTHKEY=YOUR_RETHINKDB_AUTH_KEY_HERE_IF_ANY" \
  -p 28015 \
  -e RETHINKDB_PORT_28015_TCP=tcp://rethinkdb.stf.example.org:28015 \
  openstf/ambassador:latest
ExecStop=-/usr/bin/docker stop -t 10 %p
```

## Main units

These units are required for proper operation of STF. Unless mentioned otherwise, each unit can have multiple running instances (possibly on separate hosts) if desired.

### `stf-app@.service`

**Requires** the `rethinkdb-proxy-28015.service` unit on the same host.

The app unit provides the main HTTP server and currently a very, very modest API for the client-side. It also serves all static resources including images, scripts and stylesheets.

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example configuration the identifier is used to specify the exposed port number (i.e. `stf-app@3100.service` runs on port 3100). You can have multiple instances running on the same host by using different ports.

```ini
[Unit]
Description=STF app
After=rethinkdb-proxy-28015.service
BindsTo=rethinkdb-proxy-28015.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \
  --link rethinkdb-proxy-28015:rethinkdb \
  -e "SECRET=YOUR_SESSION_SECRET_HERE" \
  -p %i:3000 \
  openstf/stf:latest \
  stf app --port 3000 \
    --auth-url https://stf.example.org/auth/mock/ \
    --websocket-url https://stf.example.org/
ExecStop=-/usr/bin/docker stop -t 10 %p-%i
```

You may have to change the `--auth-url` depending on which authentication method you choose.

### `stf-auth@.service`

You have multiple options here. STF currently provides authentication units for [OAuth 2.0](http://oauth.net/2/) and [LDAP](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol), plus a mock implementation that simply asks for a name and an email address.

#### Option A: Mock auth

With the mock auth provider the user simply enters their name and email and the system trusts those values. This is what the development version uses by default. Obviously not very secure, but very easy to set up if you can trust your users.

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example configuration the identifier is used to specify the exposed port number (i.e. `stf-auth@3200.service` runs on port 3200). You can have multiple instances running on the same host by using different ports.

**NOTE:** Don't forget to change the `--auth-url` option in the `stf-app` unit. For mock auth, the value should be `https://stf.example.org/auth/mock/`.

```ini
[Unit]
Description=STF mock auth
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \
  -e "SECRET=YOUR_SESSION_SECRET_HERE" \
  -p %i:3000 \
  openstf/stf:latest \
  stf auth-mock --port 3000 \
    --app-url https://stf.example.org/
ExecStop=-/usr/bin/docker stop -t 10 %p-%i
```

#### Option B: OAuth 2.0

We'll set up [Google's OAuth 2.0 provider](https://developers.google.com/identity/protocols/OpenIDConnect#appsetup) as an example, allowing users to log in with their Google accounts. You must be able to sign up for the API and configure the authorized URLs by yourself, we won't help you. You can see the callback URL in the unit config below. Proceed once you've received the client id and client secret.

Note that if you use another OAuth 2 provider that uses a self-signed cert, you may have to add `-e "NODE_TLS_REJECT_UNAUTHORIZED=0"` to the `docker run` command. Don't forget to end the line with `\`.

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example configuration the identifier is used to specify the exposed port number (i.e. `stf-auth@3200.service` runs on port 3200). You can have multiple instances running on the same host by using different ports.

**NOTE:** Don't forget to change the `--auth-url` option in the `stf-app` unit. For OAuth 2.0, the value should be `https://stf.example.org/auth/oauth/`.

```ini
[Unit]
Description=STF OAuth 2.0 auth
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \
  -e "SECRET=YOUR_SESSION_SECRET_HERE" \
  -e "OAUTH_AUTHORIZATION_URL=https://accounts.google.com/o/oauth2/v2/auth" \
  -e "OAUTH_TOKEN_URL=https://www.googleapis.com/oauth2/v4/token" \
  -e "OAUTH_USERINFO_URL=https://www.googleapis.com/oauth2/v3/userinfo" \
  -e "OAUTH_CLIENT_ID=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.apps.googleusercontent.com" \
  -e "OAUTH_CLIENT_SECRET=BBBBBBBBBBBBBBBBBBBBBBBB" \
  -e "OAUTH_CALLBACK_URL=https://stf.example.org/auth/oauth/callback" \
  -e "OAUTH_SCOPE=openid email" \
  -p %i:3000 \
  openstf/stf:latest \
  stf auth-oauth2 --port 3000 \
    --app-url https://stf.example.org/
ExecStop=-/usr/bin/docker stop -t 10 %p-%i
```

#### Option C: LDAP

See `stf auth-ldap --help` and change one of the unit files above as required.

**NOTE:** Don't forget to change the `--auth-url` option in the `stf-app` unit. For LDAP, the value should be `https://stf.example.org/auth/ldap/`.

#### Option D: SAML 2.0

This is one of the multiple options for authentication provided by STF. It uses [SAML 2.0](http://saml.xml.org/saml-specifications) protocol. If your company uses [Okta](https://www.okta.com/) or some other SAML 2.0 supported id provider, you can use it.

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example configuration the identifier is used to specify the exposed port number (i.e. `stf-auth@3200.service` runs on port 3200). You can have multiple instances running on the same host by using different ports.

**NOTE:** Don't forget to change the `--auth-url` option in the `stf-app` unit. For SAML 2.0, the value should be `https://stf.example.org/auth/saml/`.

```ini
[Unit]
Description=STF SAML 2.0 auth
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \
  -v /srv/ssl/id_provider.cert:/etc/id_provider.cert:ro \
  -e "SECRET=YOUR_SESSION_SECRET_HERE" \
  -e "SAML_ID_PROVIDER_ENTRY_POINT_URL=YOUR_ID_PROVIDER_ENTRY_POINT" \
  -e "SAML_ID_PROVIDER_ISSUER=YOUR_ID_PROVIDER_ISSUER" \
  -e "SAML_ID_PROVIDER_CERT_PATH=/etc/id_proider.cert" \
  -p %i:3000 \
  openstf/stf:latest \
  stf auth-saml2 --port 3000 \
    --app-url https://stf.example.org/
ExecStop=-/usr/bin/docker stop -t 10 %p-%i
```

#### Other options

See `stf -h` for other possible options.

### `stf-migrate.service`

**Requires** the `rethinkdb-proxy-28015.service` unit on the same host.

This unit migrates the database to the latest version, which pretty much means creating tables and setting up indexes. Schema changes do not require a migration unless a new index is introduced.

This is a oneshot unit, meaning that it shuts down after it's done.

```ini
[Unit]
Description=STF migrate
After=rethinkdb-proxy-28015.service
BindsTo=rethinkdb-proxy-28015.service

[Service]
EnvironmentFile=/etc/environment
Type=oneshot
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p
ExecStartPre=-/usr/bin/docker rm %p
ExecStart=/usr/bin/docker run --rm \
  --name %p \
  --link rethinkdb-proxy-28015:rethinkdb \
  openstf/stf:latest \
  stf migrate
```

### `stf-processor@.service`

**Requires** the `rethinkdb-proxy-28015.service` unit on the same host.

The processor is the main workhorse of STF. It acts as a bridge between the devices and the app, and nearly all communication goes through it. You may wish to have more than one instance running.

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example the identifier has no special purpose, but having it allows you to start more than one unit on the same host.

```ini
[Unit]
Description=STF processor
After=rethinkdb-proxy-28015.service
BindsTo=rethinkdb-proxy-28015.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \
  --link rethinkdb-proxy-28015:rethinkdb \
  openstf/stf:latest \
  stf processor %p-%i \
    --connect-app-dealer tcp://appside.stf.example.org:7160 \
    --connect-dev-dealer tcp://devside.stf.example.org:7260
ExecStop=-/usr/bin/docker stop -t 10 %p-%i
```

### `stf-provider@.service`

**Requires** the `adbd.service` unit on the same host.

The provider unit connects to ADB and start worker processes for each device. It then sends and receives commands from the processor.

The name of the provider shows up in the device list, making it easier to see where the physical devices are located. In this configuration the name is set to the hostname.

Note that the provider needs to be able to manage a certain port range, so `--net host` is required until Docker makes it easier to work with ranges. The ports are used for internal services and the screen capturing WebSocket.

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example configuration the identifier is used to specify the provider ID, which can then be matched against in the [nginx](http://nginx.org/) configuration later on. The ID should be unique and persistent. This is only one way to set things up, you may choose to do things differently if it seems sketchy.

Note that you cannot have more than one provider unit running on the same host, as they would compete over which one gets to control the devices. In the future we might add a negotiation protocol to allow for relatively seamless upgrades.

Furthermore, if you're using a self-signed cert, you may have to add `-e "NODE_TLS_REJECT_UNAUTHORIZED=0"` to the `docker run` command. Don't forget to end the line with `\`.

```ini
[Unit]
Description=STF provider
After=adbd.service
BindsTo=adbd.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \
  --net host \
  openstf/stf:latest \
  stf provider \
    --name "%H/%i" \
    --connect-sub tcp://devside.stf.example.org:7250 \
    --connect-push tcp://devside.stf.example.org:7270 \
    --storage-url https://stf.example.org/ \
    --public-ip ${COREOS_PRIVATE_IPV4} \
    --min-port=15000 \
    --max-port=25000 \
    --heartbeat-interval 10000 \
    --screen-ws-url-pattern "wss://stf.example.org/d/%i/<%= serial %>/<%= publicPort %>/"
ExecStop=-/usr/bin/docker stop -t 10 %p-%i
```

### `stf-reaper.service`

**Requires** the `rethinkdb-proxy-28015.service` unit on the same host.

The reaper unit receives heartbeat events from device workers, and marks lost devices as absent until a heartbeat is received again. The purpose of this unit is to ensure the integrity of the present/absent flag in the database, in case a provider shuts down unexpectedly or another unexpected failure occurs. It loads the current state from the database on startup and keeps patching its internal view as events are routed to it.

Note that it doesn't make sense to have more than one reaper running at once, as they would just duplicate the events.

```ini
[Unit]
Description=STF reaper
After=rethinkdb-proxy-28015.service
BindsTo=rethinkdb-proxy-28015.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p
ExecStartPre=-/usr/bin/docker rm %p
ExecStart=/usr/bin/docker run --rm \
  --name %p \
  --link rethinkdb-proxy-28015:rethinkdb \
  openstf/stf:latest \
  stf reaper dev \
    --connect-push tcp://devside.stf.example.org:7270 \
    --connect-sub tcp://appside.stf.example.org:7150 \
    --heartbeat-timeout 30000
ExecStop=-/usr/bin/docker stop -t 10 %p
```

### `stf-storage-plugin-apk@.service`

The APK storage plugin loads raw blobs from the main storage unit and allows additional actions to be performed on APK files, such as retrieving the `AndroidManifest.xml`.

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example configuration the identifier is used to specify the exposed port number (i.e. `stf-storage-plugin-apk@3300.service` runs on port 3300). You can have multiple instances running on the same host by using different ports.

Furthermore, if you're using a self-signed cert, you may have to add `-e "NODE_TLS_REJECT_UNAUTHORIZED=0"` to the `docker run` command. Don't forget to end the line with `\`.

```ini
[Unit]
Description=STF APK storage plugin
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \
  -p %i:3000 \
  openstf/stf:latest \
  stf storage-plugin-apk --port 3000 \
    --storage-url https://stf.example.org/
ExecStop=-/usr/bin/docker stop -t 10 %p-%i
```

### `stf-storage-plugin-image@.service`

The image storage plugin loads raw blobs from the main storage unit and and allows images to be resized using parameters.

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example configuration the identifier is used to specify the exposed port number (i.e. `stf-storage-plugin-image@3400.service` runs on port 3400). You can have multiple instances running on the same host by using different ports.

Furthermore, if you're using a self-signed cert, you may have to add `-e "NODE_TLS_REJECT_UNAUTHORIZED=0"` to the `docker run` command. Don't forget to end the line with `\`.

```ini
[Unit]
Description=STF image storage plugin
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \
  -p %i:3000 \
  openstf/stf:latest \
  stf storage-plugin-image --port 3000 \
    --storage-url https://stf.example.org/
ExecStop=-/usr/bin/docker stop -t 10 %p-%i
```

### `stf-storage-temp@.service`

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example configuration the identifier is used to specify the exposed port number (i.e. `stf-storage-temp@3500.service` runs on port 3500). Currently, **you cannot have more than one instance of this unit**, as both temporary files and an in-memory mapping is used. Using a template unit makes it easy to set the port.

```ini
[Unit]
Description=STF temp storage
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \
  -v /mnt/storage:/data \
  -p %i:3000 \
  openstf/stf:latest \
  stf storage-temp --port 3000 \
    --save-dir /data
ExecStop=-/usr/bin/docker stop -t 10 %p-%i
```

### `stf-triproxy-app.service`

This unit provides the `appside.stf.example.org` service mentioned earlier. Its purpose is to send and receive requests from the app units, and distribute them across the processor units. It's "dumb" in that it contains no real logic, and you rarely if ever need to upgrade the unit.

We call it a triproxy because it deals with three endpoints instead of the usual two.

You may have more than one instance running simultaneously, and then give a comma separated list to the provider. For simplicity we're using a normal unit here.

```ini
[Unit]
Description=STF app triproxy
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p
ExecStartPre=-/usr/bin/docker rm %p
ExecStart=/usr/bin/docker run --rm \
  --name %p \
  --net host \
  openstf/stf:latest \
  stf triproxy app \
    --bind-pub "tcp://*:7150" \
    --bind-dealer "tcp://*:7160" \
    --bind-pull "tcp://*:7170"
ExecStop=-/usr/bin/docker stop -t 10 %p
```

### `stf-triproxy-dev.service`

This unit provides the `devside.stf.example.org` service mentioned earlier. Its purpose is to send and receive requests from the provider units, and distribute them across the processor units. It's "dumb" in that it contains no real logic, and you rarely if ever need to upgrade the unit.

We call it a triproxy because it deals with three endpoints instead of the usual two.

You may have more than one instance running simultaneously, and then give a comma separated list to the provider. For simplicity we're using a normal unit here.

```ini
[Unit]
Description=STF dev triproxy
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p
ExecStartPre=-/usr/bin/docker rm %p
ExecStart=/usr/bin/docker run --rm \
  --name %p \
  --net host \
  openstf/stf:latest \
  stf triproxy dev \
    --bind-pub "tcp://*:7250" \
    --bind-dealer "tcp://*:7260" \
    --bind-pull "tcp://*:7270"
ExecStop=-/usr/bin/docker stop -t 10 %p
```

### `stf-websocket@.service`

**Requires** the `rethinkdb-proxy-28015.service` unit on the same host.

The websocket unit provides the communication layer between client-side JavaScript and the server-side ZeroMQ+Protobuf combination. Almost every action in STF goes through the websocket unit.

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example configuration the identifier is used to specify the exposed port number (i.e. `stf-websocket@3600.service` runs on port 3600). You can have multiple instances running on the same host by using different ports.

Furthermore, if you're using a self-signed cert, you may have to add `-e "NODE_TLS_REJECT_UNAUTHORIZED=0"` to the `docker run` command. Don't forget to end the line with `\`.

```ini
[Unit]
Description=STF websocket
After=rethinkdb-proxy-28015.service
BindsTo=rethinkdb-proxy-28015.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \
  --link rethinkdb-proxy-28015:rethinkdb \
  -e "SECRET=YOUR_SESSION_SECRET_HERE" \
  -p %i:3000 \
  openstf/stf:latest \
  stf websocket --port 3000 \
    --storage-url https://stf.example.org/ \
    --connect-sub tcp://appside.stf.example.org:7150 \
    --connect-push tcp://appside.stf.example.org:7170
ExecStop=/usr/bin/docker stop -t 10 %p-%i
```

## Optional units

These units are optional and don't affect the way STF works in any way.

### `stf-log-rethinkdb.service`

**Requires** the `rethinkdb-proxy-28015.service` unit on the same host.

Allows you to store device log events into RethinkDB.

Note that it doesn't make sense to have more than one instance of this unit running at once as you'd just record the same events twice.

```ini
[Unit]
Description=STF RethinkDB log recorder
After=rethinkdb-proxy-28015.service
BindsTo=rethinkdb-proxy-28015.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p
ExecStartPre=-/usr/bin/docker rm %p
ExecStart=/usr/bin/docker run --rm \
  --name %p \
  --link rethinkdb-proxy-28015:rethinkdb \
  openstf/stf:latest \
  stf log-rethinkdb \
    --connect-sub tcp://appside.stf.example.org:7150
ExecStop=-/usr/bin/docker stop -t 10 %p
```

### `stf-notify-hipchat.service`

If you use [HipChat](https://www.hipchat.com/), you can use this unit to push notifications to your room. Check `stf notify-hipchat --help` for more configuration options.

Even if you don't use HipChat, you can use the code as a base for implementing a new notifier.

Note that it doesn't make sense to have more than one instance of this unit running at once. You'd just get the same notifications twice.

```ini
[Unit]
Description=STF HipChat notifier
After=docker.service
BindsTo=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p
ExecStartPre=-/usr/bin/docker rm %p
ExecStart=/usr/bin/docker run --rm \
  --name %p \
  -e "HIPCHAT_TOKEN=YOUR_HIPCHAT_TOKEN_HERE" \
  -e "HIPCHAT_ROOM=YOUR_HIPCHAT_ROOM_HERE" \
  openstf/stf:latest \
  stf notify-hipchat \
    --connect-sub tcp://appside.stf.example.org:7150
ExecStop=-/usr/bin/docker stop -t 10 %p
```

### `stf-storage-s3@.service`

If you want to store data such as screenshots and apk files into [Amazon S3](https://aws.amazon.com/s3/) instead of locally, then you can use this optional unit. Before using this you will need to setup your amazon account and get proper credentials for S3 bucket. You can read more about this at [AWS documentation](https://aws.amazon.com/s3/).

** NOTE** If you are using this storage, you will not need [stf-storage-temp@.service](#stf-storage-tempservice) unit, since both do the same thing. Only the storage location is different.

This is a template unit, meaning that you'll need to start it with an instance identifier. In this example configuration the identifier is used to specify the exposed port number (i.e. `stf-storage-s3@3500.service` runs on port 3500). Currently, **you cannot have more than one instance of this unit**, as both temporary files and an in-memory mapping is used. Using a template unit makes it easy to set the port.

```ini
[Unit]
Description=STF s3 storage
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull openstf/stf:latest
ExecStartPre=-/usr/bin/docker kill %p-%i
ExecStartPre=-/usr/bin/docker rm %p-%i
ExecStart=/usr/bin/docker run --rm \
  --name %p-%i \  
  -p %i:3000 \
  openstf/stf:latest \
  stf storage-s3 --port 3000 \
    --bucket YOUR_S3_BUCKET_NAME_HERE \
    --profile YOUR_AWS_CREDENTIALS_PROFILE \
    --endpoint YOUR_BUCKET_ENDPOING_HERE
ExecStop=-/usr/bin/docker stop -t 10 %p-%i
```

## Nginx configuration

Now that you've got all the units ready, it's time to set up [nginx](http://nginx.org/) to tie all the processes together with a clean URL.

So, to recap, our example setup is as follows:

| Unit | IP | Port |
|------|----|------|
| [stf-app@3100.service](#stf-appservice) | 192.168.255.100 | 3100 |
| [stf-auth@3200.service](#stf-authservice) | 192.168.255.150 | 3200 |
| [stf-storage-plugin-apk@3300.service](#stf-storage-plugin-apkservice) | 192.168.255.100 | 3300 |
| [stf-storage-plugin-image@3400.service](#stf-storage-plugin-imageservice) | 192.168.255.100 | 3400 |
| [stf-storage-temp@3500.service](#stf-storage-tempservice) | 192.168.255.100 | 3500 |
| [stf-websocket@3600.service](#stf-websocketservice) | 192.168.255.100 | 3600 |

Furthermore, let's assume that we have the following providers set up:

| Unit | IP | Identifier |
|------|----|------------|
| [stf-provider@floor4.service](#stf-providerservice) | 192.168.255.200 | floor4 |
| [stf-provider@floor8.service](#stf-providerservice) | 192.168.255.201 | floor8 |

Our base nginx configuration for `stf.example.org` would then be:

```nginx
daemon off;
worker_processes 4;

events {
  worker_connections 1024;
}

http {
  upstream stf_app {
    server 192.168.255.100:3100 max_fails=0;
  }

  upstream stf_auth {
    server 192.168.255.150:3200 max_fails=0;
  }

  upstream stf_storage_apk {
    server 192.168.255.100:3300 max_fails=0;
  }

  upstream stf_storage_image {
    server 192.168.255.100:3400 max_fails=0;
  }

  upstream stf_storage {
    server 192.168.255.100:3500 max_fails=0;
  }

  upstream stf_websocket {
    server 192.168.255.100:3600 max_fails=0;
  }

  types {
    application/javascript  js;
    image/gif               gif;
    image/jpeg              jpg;
    text/css                css;
    text/html               html;
  }

  map $http_upgrade $connection_upgrade {
    default  upgrade;
    ''       close;
  }

  server {
    listen 80;
    server_name stf.example.org;
    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 ssl;
    server_name stf.example.org;
    keepalive_timeout 70;
    root /dev/null;

    # https://mozilla.github.io/server-side-tls/ssl-config-generator/
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/cert.key;
    ssl_session_timeout 5m;
    ssl_session_cache shared:SSL:10m;
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA';
    ssl_prefer_server_ciphers on;

    #add_header Strict-Transport-Security max-age=15768000;

    #ssl_stapling on;
    #ssl_stapling_verify on;
    #ssl_trusted_certificate /etc/nginx/ssl/cert.pem;

    resolver 8.8.4.4 8.8.8.8 valid=300s;
    resolver_timeout 10s;

    # Handle stf-provider@floor4.service
    location ~ "^/d/floor4/([^/]+)/(?<port>[0-9]{5})/$" {
      proxy_pass http://192.168.255.200:$port/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # Handle stf-provider@floor8.service
    location ~ "^/d/floor8/([^/]+)/(?<port>[0-9]{5})/$" {
      proxy_pass http://192.168.255.201:$port/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_set_header X-Real-IP $remote_addr;
    }

    location /auth/ {
      proxy_pass http://stf_auth/auth/;
    }

    location /s/image/ {
      proxy_pass http://stf_storage_image;
    }

    location /s/apk/ {
      proxy_pass http://stf_storage_apk;
    }

    location /s/ {
      client_max_body_size 1024m;
      client_body_buffer_size 128k;
      proxy_pass http://stf_storage;
    }

    location /socket.io/ {
      proxy_pass http://stf_websocket;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Real-IP $http_x_real_ip;
    }

    location / {
      proxy_pass http://stf_app;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Real-IP $http_x_real_ip;
    }
  }
}

```

Here's one possible unit configuration for `nginx.service`:

```ini
[Unit]
Description=STF nginx public load balancer
After=docker.service
Requires=docker.service
ConditionPathExists=/srv/ssl/stf.example.org.crt
ConditionPathExists=/srv/ssl/stf.example.org.key
ConditionPathExists=/srv/ssl/dhparam.pem
ConditionPathExists=/srv/nginx/nginx.conf

[Service]
EnvironmentFile=/etc/environment
TimeoutStartSec=0
Restart=always
ExecStartPre=/usr/bin/docker pull nginx:1.7.10
ExecStartPre=-/usr/bin/docker kill %p
ExecStartPre=-/usr/bin/docker rm %p
ExecStart=/usr/bin/docker run --rm \
  --name %p \
  --net host \
  -v /srv/ssl/stf.example.org.crt:/etc/nginx/ssl/cert.pem:ro \
  -v /srv/ssl/stf.example.org.key:/etc/nginx/ssl/cert.key:ro \
  -v /srv/ssl/dhparam.pem:/etc/nginx/ssl/dhparam.pem:ro \
  -v /srv/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:1.7.10 \
  nginx
ExecStop=/usr/bin/docker stop -t 2 %p
```

Start everything up and you should be good to go.

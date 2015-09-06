#!/bin/bash -
#
node lib/cli.js local --public-ip $(hostname -i) "$@"
exit $?

1: stf provider --name onlinegame-14-51 --min-port 7400 --max-port 7700 --connect-sub tcp://127.0.0.1:7114 --connect-push tcp://127.0.0.1:7116 --group-timeout 900 --public-ip 10.246.14.51 --storage-url http://10.246.14.51:7100/ --adb-host 127.0.0.1 --adb-port 5037

2: stf auth-mock --port 7120 --secret kittykat --app-url http://10.246.14.51:7100/

3: stf app --port 7105 --secret kittykat --auth-url http://10.246.14.51:7100/auth/mock/ --websocket-url http://10.246.14.51:7110/

4: stf websocket --port 7110 --secret kittykat --storage-url http://10.246.14.51:7100/ --connect-sub tcp://127.0.0.1:7111 --connect-push tcp://127.0.0.1:7113

5: stf storage-plugin-image --port 7103 --storage-url http://10.246.14.51:7100/
6: stf storage-plugin-apk --port 7104 --storage-url http://10.246.14.51:7100/

8: stf device cff039ebb31fa11 --provider onlinegame-14-51 --connect-sub tcp://127.0.0.1:7114 --connect-push tcp://127.0.0.1:7116 --screen-port 7400 --connect-port 7401 --public-ip 10.246.14.51 --group-timeout 900 --storage-url http://10.246.14.51:7100/ --adb-host 127.0.0.1 --adb-port 5037 --screen-ws-url-pattern ws://${publicIp}:${publicPort} --connect-url-pattern ${publicIp}:${publicPort} --heartbeat-interval 10000
9: stf device 1eccbe4d --provider onlinegame-14-51 --connect-sub tcp://127.0.0.1:7114 --connect-push tcp://127.0.0.1:7116 --screen-port 7402 --connect-port 7403 --public-ip 10.246.14.51 --group-timeout 900 --storage-url http://10.246.14.51:7100/ --adb-host 127.0.0.1 --adb-port 5037 --screen-ws-url-pattern ws://${publicIp}:${publicPort} --connect-url-pattern ${publicIp}:${publicPort} --heartbeat-interval 10000

7: stf poorxy --port 7100 --app-url http://10.246.14.51:7105/ --auth-url http://10.246.14.51:7120/ --websocket-url http://10.246.14.51:7110/ --storage-url http://10.246.14.51:7102/ --storage-plugin-image-url http://10.246.14.51:7103/ --storage-plugin-apk-url http://10.246.14.51:7104/

FROM sorccu/node:0.10
MAINTAINER Simo Kinnunen

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get -y install libzmq3-dev libprotobuf-dev git graphicsmagick && \
    apt-get clean && \
    rm -rf /var/cache/apt/*

CMD ["/usr/local/bin/stf", "--help"]

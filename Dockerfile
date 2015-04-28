FROM sorccu/node:0.12.2
MAINTAINER Simo Kinnunen

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get -y install libzmq3-dev libprotobuf-dev git graphicsmagick && \
    apt-get clean && \
    rm -rf /var/cache/apt/*

ENV PATH /app/bin:$PATH

CMD stf --help

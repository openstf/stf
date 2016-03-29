# Get the base image by running the included `mkimage-alpine.sh` script, or
# get a fresh copy from github.com/docker/docker/contrib/.
FROM alpine:edge

# Copy app source.
COPY . /tmp/build/

# Sneak the stf executable into $PATH.
ENV PATH /app/bin:$PATH

# Build the whole thing. Since Docker Hub doesn't really support other archs,
# we'll run a full daily build by ourselves, so it doesn't necessary have to
# be separated into multiple steps for speed.
#
# Node build taken from https://github.com/mhart/alpine-node and slightly adapted.
RUN set -xo pipefail && \
    echo '--- Updating repositories' && \
    echo '@testing http://nl.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories && \
    apk update && \
    echo '--- Building node' && \
    apk add curl make gcc g++ binutils-gold python linux-headers paxctl libgcc libstdc++ && \
    curl -sSL https://nodejs.org/dist/v5.7.0/node-v5.7.0.tar.gz | tar -xz && \
    cd /node-v* && \
    ./configure --prefix=/usr && \
    make -j$(grep -c ^processor /proc/cpuinfo 2>/dev/null || 1) && \
    make install && \
    paxctl -cm /usr/bin/node && \
    echo '--- Building app' && \
    addgroup -S stf && \
    adduser -S -G stf stf && \
    chown -R stf:stf /tmp/build && \
    cd /tmp/build && \
    export PATH=$PWD/node_modules/.bin:$PATH && \
    sed -i'' -e '/phantomjs/d' package.json && \
    apk add git zeromq-dev protobuf-dev graphicsmagick@testing && \
    export JOBS=$(grep -c ^processor /proc/cpuinfo 2>/dev/null || 1) && \
    echo 'npm install --no-optional' | su stf -s /bin/sh && \
    echo '--- Assembling app' && \
    echo 'npm pack' | su stf -s /bin/sh && \
    tar -xzf stf-*.tgz && \
    mv package /app && \
    echo 'bower cache clean' | su stf -s /bin/sh && \
    echo 'npm prune --production' | su stf -s /bin/sh && \
    mv node_modules /app && \
    chown -R root:root /app && \
    echo '--- Cleaning up' && \
    echo 'npm cache clean' | su stf -s /bin/sh && \
    rm -rf /home/stf/.node-gyp && \
    apk del curl make gcc g++ binutils-gold python linux-headers paxctl && \
    rm -rf /node-v* \
      /usr/share/man /tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp \
      /usr/lib/node_modules/npm/man /usr/lib/node_modules/npm/doc /usr/lib/node_modules/npm/html

# Work in app dir by default.
WORKDIR /app

# Export default app port, not enough for all processes but it should do
# for now.
EXPOSE 3000

# Switch to weak user.
USER stf

# Show help by default.
CMD stf --help

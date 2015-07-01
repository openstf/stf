FROM ubuntu:14.04
MAINTAINER Simo Kinnunen

# Install app requirements. Trying to optimize push speed for dependant apps
# by reducing layers as much as possible. Note that one of the final steps
# installs development files for node-gyp so that npm install won't have to
# wait for them on the first native module installation.
RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get -y install wget && \
    cd /tmp && \
    wget --progress=dot:mega \
      https://nodejs.org/dist/v0.12.5/node-v0.12.5.tar.gz && \
    cd /tmp && \
    apt-get -y install python build-essential ninja-build && \
    tar xzf node-v*.tar.gz && \
    rm node-v*.tar.gz && \
    cd node-v* && \
    export CXX="g++ -Wno-unused-local-typedefs" && \
    ./configure --ninja && \
    make && \
    make install && \
    rm -rf /tmp/node-v* && \
    cd /tmp && \
    /usr/local/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js install && \
    apt-get -y install libzmq3-dev libprotobuf-dev git graphicsmagick && \
    apt-get clean && \
    rm -rf /var/cache/apt/*

# Add a user for the app.
RUN useradd --system \
      --no-create-home \
      --shell /usr/sbin/nologin \
      --home-dir /app \
      stf

# Sneak the stf executable into $PATH.
ENV PATH /app/bin:$PATH

# Work in app dir by default.
WORKDIR /app

# Export default app port, not enough for all processes but it should do
# for now.
EXPOSE 3000

# Copy app source.
COPY . /app/

# Get the rest of the dependencies and build.
RUN export PATH=/app/node_modules/.bin:$PATH && \
    npm install && \
    bower install --allow-root && \
    gulp build

# Switch to weak user.
USER stf

# Show help by default.
CMD stf --help

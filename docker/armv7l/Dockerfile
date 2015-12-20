# Get the base image by running the included `base.sh` script.
FROM archlinuxarm/odroid-xu3:latest

# Copy app source.
COPY . /tmp/build/

# Sneak the stf and node executables into $PATH.
ENV PATH /app/bin:/opt/node/bin:$PATH

# Build the whole thing. Since Docker Hub doesn't really support other archs,
# we'll run a full daily build by ourselves, so it doesn't necessary have to
# be separated into multiple steps for speed.
RUN set -x && \
    useradd --system --create-home stf && \
    echo 'Server = http://mirror.archlinuxarm.org/$arch/$repo' > /etc/pacman.d/mirrorlist && \
    pacman -Sy && \
    pacman --noconfirm -S zeromq protobuf git graphicsmagick yasm python2 pkg-config make gcc && \
    curl -o /opt/node.tar.xz https://nodejs.org/dist/v5.3.0/node-v5.3.0-linux-armv7l.tar.xz && \
    cd /opt && \
    tar xf node.tar.xz && \
    rm node.tar.xz && \
    mv node-* node && \
    chown -R stf:stf /tmp/build && \
    cd /tmp/build && \
    export PATH=$PWD/node_modules/.bin:$PATH && \
    sed -i'' -e '/phantomjs/d' package.json && \
    export JOBS=$(nproc) && \
    runuser -u stf -- npm install --no-optional && \
    runuser -u stf -- npm pack && \
    mkdir -p /app && \
    tar xf stf-*.tgz --strip-components 1 -C /app && \
    runuser -u stf -- bower cache clean && \
    runuser -u stf -- npm prune --production && \
    mv node_modules /app && \
    chown -R root:root /app && \
    runuser -u stf -- npm cache clean && \
    rm -rf /home/stf/.node-gyp && \
    cd /app && \
    rm -rf /tmp/* && \
    pacman --noconfirm -Rs git yasm python2 pkg-config make gcc && \
    pacman --noconfirm -Sc

# Work in app dir by default.
WORKDIR /app

# Export default app port, not enough for all processes but it should do
# for now.
EXPOSE 3000

# Switch to weak user.
USER stf

# Show help by default.
CMD stf --help

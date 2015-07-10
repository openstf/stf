FROM openstf/base:v1.0.1

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

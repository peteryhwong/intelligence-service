FROM node:22.14.0-alpine3.20 AS setup

WORKDIR /home/node/app
COPY package.json /home/node/app/
COPY package-lock.json /home/node/app/
COPY .npmrc /home/node/app/.npmrc

# Install dependencies
# /var/www/html/api installs dependencies
# /home/node/app installs devDependencies
RUN mkdir -p /tmp/cache && \
    npm ci --ignore-scripts --cache /tmp/cache && \
    mkdir -p /var/www/html/api && \
    cp /home/node/app/package.json /var/www/html/api/ &&\
    cp /home/node/app/package-lock.json /var/www/html/api/ &&\
    cp /home/node/app/.npmrc /var/www/html/api/ &&\
    cd /var/www/html/api && \
    npm ci --only=production --ignore-scripts --cache /tmp/cache && \
    rm -rf /tmp/cache

# Build and test
FROM node:22.14.0-alpine3.20 AS build

COPY --from=setup /home/node/app /home/node/app

WORKDIR /home/node/app

COPY tsconfig.json /home/node/app/tsconfig.json
COPY baml_src /home/node/app/baml_src
COPY src /home/node/app/src
COPY eslint.config.mjs /home/node/app/eslint.config.mjs
COPY jest.config.ts /home/node/app/jest.config.ts
COPY jest.setup.ts /home/node/app/jest.setup.ts
COPY .nvmrc /home/node/app/.nvmrc
COPY .prettierrc /home/node/app/.prettierrc
COPY .prettierignore /home/node/app/.prettierignore

# Test, audit and build
ARG SKIP_RUN_TEST
RUN if [ "$SKIP_RUN_TEST" != "true" ]; then npm run test; fi && \
    npm run build


# Deployment
FROM node:22.14.0-alpine3.20

# Build
WORKDIR /var/www/html/api

# Setting UTC time
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/UTC /etc/localtime && \
    echo UTC > /etc/timezone

# COPY production dependencies and code
COPY --from=setup /var/www/html/api /var/www/html/api
COPY --from=build /home/node/app/dist /var/www/html/api/dist

# Using the default port
EXPOSE 8080

ENV NODE_ENV=production
CMD [ "node", "--max-old-space-size=2048", "dist/index.js" ]

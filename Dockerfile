FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY web/package.json web/package-lock.json ./web/

RUN npm ci --cache .npm-cache

COPY . .

RUN npm run build:web \
  && npm prune --omit=dev \
  && rm -rf web/node_modules .npm-cache


FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/public ./public

RUN mkdir -p /app/data && chown -R node:node /app/data

USER node

EXPOSE 3000
VOLUME ["/app/data"]

CMD ["node", "src/server.js"]

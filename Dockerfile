FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN bunx pnpm install --frozen-lockfile

COPY . .
RUN bunx pnpm build:node

FROM oven/bun:1 AS prod-deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN bunx pnpm install --prod --frozen-lockfile

FROM oven/bun:1-slim
WORKDIR /app

COPY --from=build /app/build-node ./build-node
COPY --from=prod-deps /app/node_modules ./node_modules

ENV NODE_ENV=production \
	PORT=3000 \
	SQLITE_PATH=/data/app.db

VOLUME /data
EXPOSE 3000

CMD ["bun", "build-node"]

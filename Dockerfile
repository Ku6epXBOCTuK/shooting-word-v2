FROM node:22-slim AS build
WORKDIR /app

RUN npm install -g pnpm@12.4.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build:node

FROM node:22-slim AS prod-deps
WORKDIR /app

RUN npm install -g pnpm@12.4.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

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

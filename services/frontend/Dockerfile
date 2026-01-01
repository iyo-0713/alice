FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY app ./app
COPY env.d.ts react-router.config.ts tsconfig.json vite.config.ts server.js ./

RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/build ./build
COPY --from=build /app/server.js ./server.js

EXPOSE 5173

CMD ["node", "server.js"]

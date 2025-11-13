FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS dependencies
RUN npm ci --only=production

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM base AS release
COPY --from=build /app .
COPY --from=dependencies /app/node_modules ./node_modules

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]

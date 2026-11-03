# Build with backend/ as context to preserve the npm workspace layout.
FROM node:22-alpine AS manifests
WORKDIR /app
COPY package.json package-lock.json ./
COPY api-gateway/package.json ./api-gateway/package.json
COPY services/auth-service/package.json ./services/auth-service/package.json
COPY services/user-service/package.json ./services/user-service/package.json
COPY services/training-service/package.json ./services/training-service/package.json
COPY services/agenda-service/package.json ./services/agenda-service/package.json
COPY services/performance-service/package.json ./services/performance-service/package.json
COPY services/hydration-service/package.json ./services/hydration-service/package.json
COPY services/professional-service/package.json ./services/professional-service/package.json
COPY services/management-service/package.json ./services/management-service/package.json
COPY services/payment-service/package.json ./services/payment-service/package.json
COPY services/notification-service/package.json ./services/notification-service/package.json
COPY services/ai-coach-service/package.json ./services/ai-coach-service/package.json

FROM manifests AS dependencies
RUN npm ci --include=dev --no-audit --no-fund

FROM dependencies AS build
ARG SERVICE_PATH=services/agenda-service
COPY ${SERVICE_PATH}/tsconfig.json ./${SERVICE_PATH}/tsconfig.json
COPY ${SERVICE_PATH}/src ./${SERVICE_PATH}/src
RUN npm run build --workspace="${SERVICE_PATH}"

FROM manifests AS production-dependencies
ARG SERVICE_PATH=services/agenda-service
RUN npm ci --omit=dev --workspace="${SERVICE_PATH}" --include-workspace-root --no-audit --no-fund

FROM node:22-alpine AS runtime
COPY runtime/ /app/runtime/
ENV NODE_ENV=production
ARG SERVICE_PATH=services/agenda-service
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/ ./
COPY --from=build --chown=node:node /app/${SERVICE_PATH}/dist ./${SERVICE_PATH}/dist
WORKDIR /app/${SERVICE_PATH}
USER node
CMD ["node", "dist/server.js"]

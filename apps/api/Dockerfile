FROM node:22-bookworm AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter @wife-checkin/api prisma:generate
RUN pnpm --filter @wife-checkin/api build
RUN pnpm deploy --legacy --filter @wife-checkin/api --prod /prod/api

FROM node:22-bookworm AS runtime
ENV NODE_ENV=production
ENV TZ=Asia/Shanghai
WORKDIR /app
COPY --from=build /prod/api ./
COPY --from=build /app/apps/api/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

# ---- Builder stage: full deps, compile TypeScript, generate Prisma client ----
FROM node:20-alpine AS builder
WORKDIR /app

# Prisma's engine needs OpenSSL - Alpine doesn't ship it by default.
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production stage: only what's needed to actually run the app ----
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

# The generated Prisma client lives in node_modules/@prisma/client after
# `prisma generate` - reinstalling production deps above wipes it out, so
# it has to be copied in from the builder stage explicitly, along with the
# schema itself (needed at runtime for some Prisma operations).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# App Runner/ECS set PORT via environment - src/config/configuration.ts
# already reads process.env.PORT, so nothing extra needed here.
EXPOSE 3001

# The compiled entry point is dist/src/main.js, not dist/main.js as the
# (currently unused) start:prod npm script assumes - verified directly
# against a real build output, not assumed from the script name.
CMD ["node", "dist/src/main.js"]

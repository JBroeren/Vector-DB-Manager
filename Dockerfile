# syntax=docker/dockerfile:1

# -------- Base deps --------
FROM node:20-alpine AS base
ENV NODE_ENV=production
WORKDIR /app

# Install libc6-compat for some npm packages if needed, and add git if required
RUN apk add --no-cache libc6-compat

# -------- Dependencies layer --------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
  npm ci --omit=dev

# -------- Builder layer --------
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
  npm ci

# Copy rest of the source
COPY . .

# Build Next.js app
RUN npm run build

# -------- Runner layer --------
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Copy only the necessary production artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

# Next.js needs these at runtime for standalone mode if used in future
# If you switch to output: 'standalone', adjust the copy commands accordingly

USER nextjs

CMD ["npm", "start"]


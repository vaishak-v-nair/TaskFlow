FROM node:20.19.0

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies using npm install (not npm ci)
# npm install does NOT aggressively delete node_modules, so it won't conflict with Docker cache mounts
RUN npm install --omit=dev --no-fund --no-audit

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy application code
COPY . .

# Build Next.js app
RUN npm run build

# Remove dev dependencies for production
RUN npm prune --production

EXPOSE 3000

CMD ["npm", "start"]

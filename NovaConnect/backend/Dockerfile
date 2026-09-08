FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy application files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "index.js"]

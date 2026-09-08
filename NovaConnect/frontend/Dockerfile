FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy application source
COPY . .

# Build Next.js application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]

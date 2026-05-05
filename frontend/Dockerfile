FROM node:22-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

EXPOSE 5173

# --host 0.0.0.0 makes Vite bind to all interfaces inside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
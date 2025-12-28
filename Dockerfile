FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build the app (if using TypeScript)
RUN npm run build

# Expose the port your NestJS app runs on (default 3000)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
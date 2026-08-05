# Use Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies   
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose port (defaulting to 5000 as configured in .env and server.js)
EXPOSE 5000

# Start command
CMD ["npm", "start"]

FROM node:22-alpine

WORKDIR /app

# Copy only the backend directory
COPY backend/ .

# Install dependencies
RUN npm install --production

# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "src/index.js"]
FROM node:lts-alpine

# Set working directory
WORKDIR /src

# Copy package.json and install dependencies first for caching
COPY package.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Install PM2 globally
RUN npm install -g pm2

# Expose the port
EXPOSE 3000

# Start the application with PM2
CMD ["pm2","restart","src/app.js"]

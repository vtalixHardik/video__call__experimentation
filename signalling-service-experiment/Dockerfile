# Use a standard Node.js image (non-Alpine) to avoid any Alpine-specific issues
FROM node:20

#AS build
RUN apt-get update && \
    apt-get install -y \
    awscli \
    unzip \
    curl 

WORKDIR /app

# RUN npm install 
COPY .env .env

# Copy the rest of the application files
COPY . .

# Clear npm cache before installing dependencies
RUN npm cache clean --force

# Install dependencies (including nodemon for development)
RUN npm install

# Expose the port your app will run on (adjust if necessary)
EXPOSE 3015

CMD ["npm", "start"]

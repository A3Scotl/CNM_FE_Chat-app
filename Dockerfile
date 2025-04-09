# Dockerfile (frontend)
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copy .env
COPY .env .env

EXPOSE 8081
CMD ["npm", "start", "--tunnel", "--non-interactive"]

FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Cài expo-cli nếu cần
RUN npm install -g expo-cli

EXPOSE 19000 19001 19002

CMD ["npx", "expo", "start", "--tunnel"]

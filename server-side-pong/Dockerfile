FROM node:20-slim

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npx", "tsx", "src/index.ts"]

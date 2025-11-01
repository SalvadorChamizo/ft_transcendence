FROM ft_transcendence-node-base:latest

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["npx", "tsx", "src/index.ts"]
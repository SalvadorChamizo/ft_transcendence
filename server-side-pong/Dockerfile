
FROM ft_transcendence-node-base:latest

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm install

COPY . .

EXPOSE 7000

CMD ["npx", "tsx", "src/index.ts"]

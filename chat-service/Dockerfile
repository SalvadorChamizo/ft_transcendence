FROM ft_transcendence-node-base:latest

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm install

COPY . .

CMD ["npx", "tsx", "src/index.ts"]
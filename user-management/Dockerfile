FROM ft_transcendence-node-base:latest

WORKDIR /app

RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

COPY package*.json tsconfig.json ./

RUN npm install

COPY . .

CMD ["npx", "tsx", "src/index.ts"]

FROM node:20-slim

RUN apt-get update && \
	apt-get install -y python3 make g++ && \
	rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm install

COPY . .

EXPOSE 7000

CMD ["npx", "tsx", "src/index.ts"]

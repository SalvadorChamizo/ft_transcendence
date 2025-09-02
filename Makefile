all: up

up:
	docker compose up --build -d

down:
	docker compose down

clean:
	docker system prune -a
all: up

up:
	docker compose up --build -d

down:
	docker compose down

clean:
	docker system prune -a

erase:
	@sudo docker ps -qa | xargs -r docker stop
	@sudo docker ps -qa | xargs -r docker rm
	@sudo docker images -qa | xargs -r docker rmi -f
	@sudo docker volume ls -q | xargs -r docker volume rm
	@sudo docker system prune -a --volumes -f

re: down clean up
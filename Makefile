all: up

up:
	docker compose up --build -d

down:
	docker compose down

clean:
	docker system prune -a

logs-auth:
	docker logs ft_transcendence-auth-service-1

logs-user:
	docker logs ft_transcendence-user-management-service-1

logs-gateway:
	docker logs ft_transcendence-gateway-1

logs-frontend:
	docker logs ft_transcendence-frontend-dev-1

logs-chat:
	docker logs ft_transcendence-chat-service-1

erase:
	@sudo docker ps -qa | xargs -r docker stop
	@sudo docker ps -qa | xargs -r docker rm
	@sudo docker images -qa | xargs -r docker rmi -f
	@sudo docker volume ls -q | xargs -r docker volume rm
	@sudo docker system prune -a --volumes -f

re: down clean up

all: up

up:
	docker compose up --build -d

down:
	docker compose down

clean:
	docker system prune -a

logs-auth:
	docker logs trascende-auth-service-1

logs-user:
	docker logs trascende-user-management-service-1

logs-gateway:
	docker logs trascende-gateway-1

logs-frontend:
	docker logs trascende-frontend-dev-1

logs-chat:
	docker logs trascende-chat-service-1

erase:
	@sudo docker ps -qa | xargs -r docker stop
	@sudo docker ps -qa | xargs -r docker rm
	@sudo docker images -qa | xargs -r docker rmi -f
	@sudo docker volume ls -q | xargs -r docker volume rm
	@sudo docker system prune -a --volumes -f

re: down clean up

volume-rm:
	docker volume rm $$(docker volume ls -q)

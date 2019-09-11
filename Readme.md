### Requirements

* Docker

### Basic installation for development

1.- Step-by-step shell commands

```shell
git https://github.com/salvador-lucas/ejercicio.git
cd ejercicio
sudo docker-compose up --build -d
```

<!-- endpoints:
- signup:
curl -X POST \
  http://localhost:3000/user/signup \
  -H 'Content-Type: application/json' \
  -H 'Postman-Token: 7d25a832-608d-488c-84f0-f7c8bb165847' \
  -H 'cache-control: no-cache' \
  -d '{
	"email": "test@mail.com", 
	"password": "test"
}'

- login

curl -X POST \
  http://localhost:3000/user/login \
  -H 'Content-Type: application/json' \
  -H 'Postman-Token: fceaab45-0338-4b13-9870-e19e44c55240' \
  -H 'cache-control: no-cache' \
  -d '{
	"email": "test@mail.com", 
	"password": "test"
}'

- list files:

curl -X GET \
  http://localhost:3000/files/list \
  -H 'Authorization: Bearer {TOKEN}' \
  -H 'Postman-Token: f7cf34b4-693d-4cc6-b9c6-abadef8e9a38' \
  -H 'cache-control: no-cache'


- file metrics:
curl -X GET \
  'http://localhost:3000/files/metrics?filename=file1.tsv' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhvbG9AbWFpbC5jb20iLCJpYXQiOjE1NjgxMzk5MzksImV4cCI6MTU2ODE0MzUzOX0.XQvghBCHS3x9iaeDTxA9k_-EvvnNyB3e3E7hlftJKC8' \
  -H 'Postman-Token: 2297975d-3036-4598-a7cc-46e96ce1fd30' \
  -H 'cache-control: no-cache' -->

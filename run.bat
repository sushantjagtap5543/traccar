echo Starting GPS platform...

docker-compose pull

docker-compose build

docker-compose up -d

timeout /t 10

start http://localhost

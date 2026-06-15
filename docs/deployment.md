Deployment Steps

1. cd ~/apps/bvrinfra/bvrinfra-site
2. git pull
3. docker build -t bvrinfra-site:v1 .
4. docker compose up -d

Verification

1. docker compose ps
2. curl http://localhost
3. Verify https://bvrinfra.in

Rollback

1. git log --oneline
2. git checkout <commit>
3. docker build -t bvrinfra-site:v1 .
4. docker compose up -d

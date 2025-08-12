# todo.txt

## install

- node
- bun
- nginx

## backend

- bun run prod
- touch `data/todo.txt`

## frontend

- npm install
- npm run build
- copy `dist` to `/var/www/dist`

## nginx

- `sudo nginx -t`
- `sudo systemctl reload nginx`
- `/etc/nginx/sites-available/todo`

```
server {
  listen 80 default_server;
  server_name _;

  root /var/www/dist;
  index index.html;

  # API -> Bun (strip /api)
  location /api/ {
    proxy_pass http://127.0.0.1:3000/;  # trailing slash removes /api/
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

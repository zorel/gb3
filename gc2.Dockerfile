FROM docker.io/nginx
COPY --chown=nginx ./gc2 /usr/share/nginx/html
EXPOSE 80
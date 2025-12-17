# Lightweight nginx container to serve static frontend
FROM nginx:stable-alpine

# Copy index and static site files into nginx html folder
COPY *.html /usr/share/nginx/html/
COPY static /usr/share/nginx/html/static
# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]




FROM node:lts-alpine AS build-stage

WORKDIR /application

RUN npm install -g typescript

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run generate

FROM nginx:stable-alpine AS final

COPY --from=build-stage /application/.output/public /usr/share/nginx/html
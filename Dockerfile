FROM node:19.5.0-alpine

WORKDIR /usr/app

COPY package*.json /usr/app

COPY prisma ./prisma

RUN npm install

RUN npm install -g prisma

COPY . . 

RUN npx prisma generate --schema ./prisma/schema.prisma

RUN npm run build

EXPOSE 5000



FROM node:19.5.0-alpine

WORKDIR /usr/app

COPY package*.json /usr/app

COPY prisma /usr/app/prisma

RUN npm install

COPY . . 

RUN npx prisma generate --schema ./prisma/schema.prisma

RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start:prod"]



FROM node:lts-bookworm-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g npm@latest

RUN npm cache clean --force

RUN npm install

COPY  . . 

EXPOSE 5000

CMD ["npm", "run", "build"]


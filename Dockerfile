FROM node:10.16.3-alpine

ADD . /ejercicio
WORKDIR /ejercicio
COPY package.json /ejercicio/

RUN npm install
CMD [ "node", "server.js" ]
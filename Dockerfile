FROM node:10.16.3-alpine

ADD . /ejercicio
WORKDIR /ejercicio
COPY package.json /ejercicio/
ENV NODE_ENV=docker

RUN npm install
CMD [ "npm", "start" ]
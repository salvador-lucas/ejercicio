FROM node:10.16.3-alpine

ADD . /ejercicio
WORKDIR /ejercicio

RUN npm install
CMD ["npm start"]
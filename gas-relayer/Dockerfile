FROM node:10

WORKDIR /gas-relayer

COPY package.json .

RUN npm install

COPY . .

RUN mkdir -p /config 

VOLUME /config

RUN ["chmod", "+x", "/gas-relayer/scripts/start.sh"]

ENTRYPOINT "scripts/start.sh"

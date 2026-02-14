FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY src ./src

EXPOSE 4000

ENV NODE_ENV=production

CMD ["npm", "start"]

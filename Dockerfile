FROM node:20-alpine

COPY package-lock.json .

COPY package-lock.json .

RUN npm i

COPY . .

CMD ["npm", "start"]
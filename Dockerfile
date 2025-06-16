FROM node:20-alpine

COPY package.json .

COPY package-lock.json .

COPY public .

RUN npm i

COPY . .

CMD ["npm", "start"]
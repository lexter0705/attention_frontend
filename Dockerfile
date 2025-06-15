FROM node:20-alpine

COPY . .

RUN npm i

CMD ["npm", "start"]
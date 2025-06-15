FROM node:19-alpine

COPY . .

RUN npm i

CMD ["npm", "start"]
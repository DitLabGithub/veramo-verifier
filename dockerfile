
FROM node:22-bookworm

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

CMD ["sh", "-c", "DEBUG=* yarn start"]

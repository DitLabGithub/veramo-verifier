
FROM node:21-bookworm

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

CMD ["sh", "-c", "yarn dev"]

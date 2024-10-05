FROM node:14-alpine

ENV NODE_ENV development
ENV HTTPS true

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY public/ /public/
COPY src/ /src/

RUN yarn install --ignore-engines --frozen-lockfile --network-timeout 100000

COPY . .

EXPOSE 3000

RUN unset NODE_OPTIONS

# we need max user watches set for node
CMD echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

CMD yarn run start

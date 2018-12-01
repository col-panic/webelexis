FROM node:alpine
RUN apk add openjdk8 bash git

RUN apk add --no-cache --virtual build_deps python \
  g++ gcc make binutils-gold

RUN npm install -g aurelia-cli \
  && ln -s /usr/lib/jvm/java-1.8-openjdk/bin/javac /usr/bin/javac


USER node
WORKDIR /home/node

RUN git clone https://github.com/rgwch/webelexis \
  && cd webelexis/client \
  && npm install \
  && au build --env prod \
  && cd ../server \
  && npm install \
  && npm install java

COPY server/lib/ /home/node/webelexis/server/lib/

USER root

RUN apk del build_deps

USER node

WORKDIR /home/node/webelexis/server
ENV NODE_ENV=dockered
CMD ["npm","run","dockered"]


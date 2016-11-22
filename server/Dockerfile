FROM node:latest

# add a user and group to run the app server:
RUN groupadd -r app && useradd -r -g app app

# grab gosu for easy step-down from root:
RUN gpg --keyserver pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4
RUN curl -o /usr/local/bin/gosu -fSL "https://github.com/tianon/gosu/releases/download/1.7/gosu-$(dpkg --print-architecture)" \
  && curl -o /usr/local/bin/gosu.asc -fSL "https://github.com/tianon/gosu/releases/download/1.7/gosu-$(dpkg --print-architecture).asc" \
  && gpg --verify /usr/local/bin/gosu.asc \
  && rm /usr/local/bin/gosu.asc \
  && chmod +x /usr/local/bin/gosu
# RUN npm install -g npm bower grunt-cli gulp
RUN npm install -g nodemon

RUN mkdir -p /opt/app && chown app:app /opt/app
VOLUME /opt/app
WORKDIR /opt/app

COPY package.json /opt/package.json
RUN cd /opt && npm install
# RUN cd /opt && npm install && bower install

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 3000

CMD ["node", "app.js"]
FROM ubuntu
MAINTAINER Chris Witko <chris.witko@gmail.com>

# install our dependencies and nodejs
RUN apt-get update -yq && apt-get upgrade -yq && \
    apt-get install -yq curl git ssh sshpass
RUN apt-get -q -y install nodejs npm build-essential
RUN ln -s "$(which nodejs)" /usr/bin/node
RUN npm install -g npm bower grunt-cli gulp
RUN npm install -g nodemon

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD ./front/package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
WORKDIR /opt/app
COPY ./front/ /opt/app
VOLUME        ["/opt/app"]

EXPOSE 3000
CMD [ "node", "app.js" ]
CMD bash
FROM mongo
MAINTAINER Chris Witko (SUBURB STUDIO) <info@shopnowapp.com>

# connecting to host volume with existing mongo data
VOLUME ["/data/db":"/data/db"]

EXPOSE 27017

CMD ["mongod"]
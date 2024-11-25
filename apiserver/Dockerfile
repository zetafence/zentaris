FROM alpine:3.14

ADD ./build/apiserver-static /usr/local/bin/apiserver

COPY ./certs/server.crt /etc/certs/server.crt
COPY ./certs/server.key /etc/certs/server.key

ENTRYPOINT [ "/usr/local/bin/apiserver" ]

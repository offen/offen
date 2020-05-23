FROM alpine:3.11
LABEL maintainer="offen <hioffen@posteo.de>"

ARG version=latest

RUN apk add -U --no-cache ca-certificates
COPY ./bin/offen-linux-amd64 /opt/offen/$version/offen-linux-amd64
RUN ln -s /opt/offen/$version/offen-linux-amd64 /usr/local/bin/offen

ENV OFFEN_SERVER_PORT 80
EXPOSE 80 443

WORKDIR /root
ENTRYPOINT ["offen"]

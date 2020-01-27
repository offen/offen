FROM alpine:3.11
LABEL maintainer="offen <hioffen@posteo.de>"

RUN apk add -U --no-cache ca-certificates
COPY ./bin/offen-linux-amd64 /usr/bin/offen

ENV OFFEN_SERVER_PORT 80
EXPOSE 80 443

WORKDIR /root
ENTRYPOINT ["offen"]

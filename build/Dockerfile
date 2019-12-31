FROM alpine:3.10
LABEL maintainer="offen <hioffen@posteo.de>"

RUN apk add -U --no-cache ca-certificates
COPY ./bin/offen-linux-amd64 /usr/bin/offen

ENV OFFEN_SERVER_PORT 3000
EXPOSE 3000

ENTRYPOINT ["offen"]

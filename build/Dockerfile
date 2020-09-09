# Copyright 2020 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.12
LABEL maintainer="offen <hioffen@posteo.de>"

RUN apk add -U --no-cache ca-certificates

COPY ./bin/offen-linux-amd64 /opt/offen/offen-linux-amd64
RUN ln -s /opt/offen/offen-linux-amd64 /usr/local/bin/offen

COPY ./build/offen.env /etc/offen/offen.env
RUN mkdir -p /var/opt/offen && mkdir -p /var/www/.cache

ENV OFFEN_SERVER_PORT 80
EXPOSE 80 443

WORKDIR /root
ENTRYPOINT ["offen"]

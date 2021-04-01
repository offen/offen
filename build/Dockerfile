# Copyright 2021 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.13
LABEL maintainer="offen <hioffen@posteo.de>"

RUN addgroup -g 10001 -S offen \
	&& adduser -u 10000 -S -G offen -h /home/offen offen
RUN apk add -U --no-cache ca-certificates libcap tini bind-tools

COPY ./bin/offen-linux-amd64 /opt/offen/offen-linux-amd64
RUN setcap CAP_NET_BIND_SERVICE=+eip /opt/offen/offen-linux-amd64
RUN ln -s /opt/offen/offen-linux-amd64 /sbin/offen

RUN mkdir -p /var/opt/offen \
	&& mkdir -p /var/www/.cache \
	&& mkdir -p /etc/offen \
	&& chown offen: /var/opt/offen /var/www/.cache /etc/offen

ENV OFFEN_SERVER_PORT 80
EXPOSE 80 443

ENTRYPOINT ["/sbin/tini", "--", "offen"]

USER offen
WORKDIR /home/offen

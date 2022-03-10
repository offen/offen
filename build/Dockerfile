# Copyright 2021 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

FROM alpine:3.15
LABEL maintainer="offen <hioffen@posteo.de>"

ARG TARGETARCH
ARG TARGETVARIANT

RUN addgroup -g 10001 -S offen \
	&& adduser -u 10000 -S -G offen -h /home/offen offen
RUN apk add -U --no-cache ca-certificates libcap tini bind-tools

COPY ./bin/offen-linux-$TARGETARCH${TARGETVARIANT:+-$TARGETVARIANT} /opt/offen/offen-linux-$TARGETARCH${TARGETVARIANT:+-$TARGETVARIANT}
RUN setcap CAP_NET_BIND_SERVICE=+eip /opt/offen/offen-linux-$TARGETARCH${TARGETVARIANT:+-$TARGETVARIANT}
RUN ln -s /opt/offen/offen-linux-$TARGETARCH${TARGETVARIANT:+-$TARGETVARIANT} /sbin/offen

RUN mkdir -p /var/opt/offen \
	&& mkdir -p /var/www/.cache \
	&& mkdir -p /etc/offen \
	&& chown offen: /var/opt/offen /var/www/.cache /etc/offen

ENV OFFEN_SERVER_PORT 80
EXPOSE 80 443

HEALTHCHECK --interval=1m --timeout=5s \
  CMD wget -qO- http://localhost:80/healthz || exit 1

ENTRYPOINT ["/sbin/tini", "--", "offen"]

USER offen
WORKDIR /home/offen

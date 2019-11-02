FROM node:12 as auditorium

COPY ./auditorium/package.json ./auditorium/package-lock.json /code/deps/
COPY ./packages /code/packages
WORKDIR /code/deps
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm ci
COPY ./auditorium /code/auditorium
COPY ./l10n /code/l10n
COPY ./banner.txt /code/banner.txt
WORKDIR /code/auditorium
RUN cp -a /code/deps/node_modules /code/auditorium/
ENV NODE_ENV production
RUN npm run build

FROM node:12 as script

COPY ./script/package.json ./script/package-lock.json /code/deps/
COPY ./packages /code/packages
WORKDIR /code/deps
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm ci
COPY ./script /code/script
COPY ./l10n /code/l10n
COPY ./banner.txt /code/banner.txt
WORKDIR /code/script
RUN cp -a /code/deps/node_modules /code/script/
ENV NODE_ENV production
RUN npm run build

FROM node:12 as vault

COPY ./vault/package.json ./vault/package-lock.json /code/deps/
COPY ./packages /code/packages
WORKDIR /code/deps
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm ci
COPY ./vault /code/vault
COPY ./l10n /code/l10n
COPY ./banner.txt /code/banner.txt
WORKDIR /code/vault
RUN cp -a /code/deps/node_modules /code/vault/
ENV NODE_ENV production
RUN npm run build

FROM golang:1.13 as server

RUN apt-get update \
	&& apt-get -y install musl-tools \
	&& rm -rf /var/lib/apt/lists/*

COPY ./server/go.mod ./server/go.sum /code/server/
WORKDIR /code/server
RUN go mod download

COPY ./server /code/server
COPY ./l10n /code/server/l10n

ARG rev
ENV GIT_REVISION=$rev

RUN go get github.com/rakyll/statik
COPY --from=script /code/script/dist /code/server/public
COPY --from=auditorium /code/auditorium/dist /code/server/public/auditorium
COPY --from=vault /code/vault/dist /code/server/public/vault

RUN statik -dest public -src public
RUN statik -dest l10n -src l10n

ENV GOOS linux
RUN CC=musl-gcc go build -ldflags "-linkmode external -extldflags '-static' -s -w -X github.com/offen/offen/server/config.Revision=$GIT_REVISION" -o bin/offen cmd/offen/main.go

FROM alpine:3.10
LABEL maintainer="offen <hioffen@posteo.de>"

RUN apk add -U --no-cache ca-certificates
COPY --from=server /code/server/bin/offen /

ENV OFFEN_SERVER_PORT 3000
EXPOSE 3000

ENTRYPOINT ["/offen"]

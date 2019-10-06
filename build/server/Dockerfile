FROM node:10 as auditorium

COPY ./auditorium/package.json ./auditorium/package-lock.json /code/deps/
COPY ./packages /code/packages
WORKDIR /code/deps
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm ci
COPY ./auditorium /code/auditorium
COPY ./banner.txt /code/banner.txt
WORKDIR /code/auditorium
RUN cp -a /code/deps/node_modules /code/auditorium/
ENV NODE_ENV production
RUN npm run build

FROM node:10 as script

COPY ./script/package.json ./script/package-lock.json /code/deps/
COPY ./packages /code/packages
WORKDIR /code/deps
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm ci
COPY ./script /code/script
COPY ./banner.txt /code/banner.txt
WORKDIR /code/script
RUN cp -a /code/deps/node_modules /code/script/
ENV NODE_ENV production
RUN npm run build

FROM node:10 as vault

COPY ./vault/package.json ./vault/package-lock.json /code/deps/
COPY ./packages /code/packages
WORKDIR /code/deps
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm ci
COPY ./vault /code/vault
COPY ./banner.txt /code/banner.txt
WORKDIR /code/vault
RUN cp -a /code/deps/node_modules /code/vault/
ENV NODE_ENV production
RUN npm run build

FROM golang:1.13 as server

COPY ./server/go.mod ./server/go.sum /code/server/
WORKDIR /code/server
RUN go mod download

COPY ./server /code/server

RUN go get github.com/rakyll/statik
COPY --from=script /code/script/dist /code/server/public
COPY --from=auditorium /code/auditorium/dist /code/server/public/auditorium
COPY --from=vault /code/vault/dist /code/server/public/vault
RUN statik -dest assets -src public

ENV CGO_ENABLED 0
ENV GOOS linux
RUN make build

FROM alpine:3.10
LABEL maintainer="mail@offen.dev"

RUN apk add -U --no-cache ca-certificates
COPY --from=server /code/server/bin/offen /

ENV GIN_MODE "release"
ENV PORT 3000
EXPOSE 3000

CMD ["/offen", "serve"]

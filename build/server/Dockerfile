FROM golang:1.13 as builder

COPY ./server/go.mod ./server/go.sum /code/server/
WORKDIR /code/server
RUN go mod download

COPY ./server /code/server

ENV CGO_ENABLED 0
ENV GOOS linux
RUN make build

FROM alpine:3.10

RUN apk add -U --no-cache ca-certificates
COPY --from=builder /code/server/bin/offen /

ENV PORT 3000
EXPOSE 3000

CMD ["/offen", "serve"]

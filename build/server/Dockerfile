FROM golang:1.12 as builder

COPY ./server/go.mod ./server/go.sum /code/server/
WORKDIR /code/server
RUN go mod download

COPY ./server /code/server

ENV CGO_ENABLED 0
RUN make build

FROM scratch

COPY --from=builder /code/server/bin/server /

ENV PORT 3000
EXPOSE 3000

CMD ["/server"]

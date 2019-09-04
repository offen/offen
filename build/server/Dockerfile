FROM golang:1.12 as builder

COPY ./server /code/server
COPY ./shared /code/shared

WORKDIR /code/server
ENV CGO_ENABLED 0
RUN make build

FROM scratch

COPY --from=builder /code/server/bin/server /

ENV PORT 3000
EXPOSE 3000

CMD ["/server"]

FROM golang:1.26.1-alpine3.23 AS builder

WORKDIR /service/

COPY ./go.mod ./
COPY ./go.sum ./
RUN go mod download

COPY ./cmd/ ./cmd/
COPY ./config/ ./config/
COPY ./internal/ ./internal/
COPY ./pkg/ ./pkg/
RUN CGO_ENABLED=0 GOOS=linux go build -o ./build/server ./cmd/api


FROM alpine:3.23

ARG MIGRATE_VERSION=v4.19.1

WORKDIR /service/

RUN apk --no-cache add ca-certificates tzdata curl
RUN curl -o /usr/local/share/ca-certificates/russian_trusted_root_ca.crt \
    https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt && \
    curl -o /usr/local/share/ca-certificates/russian_trusted_sub_ca.crt \
    https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt && \
    update-ca-certificates
RUN curl -L https://github.com/golang-migrate/migrate/releases/download/$MIGRATE_VERSION/migrate.linux-amd64.tar.gz | tar xvz

COPY ./migrations/ ./migrations/
COPY --from=builder /service/build/server .

CMD ["sh", "-c", "./migrate -source file://migrations/ -database postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DATABASE?sslmode=disable up && ./server"]

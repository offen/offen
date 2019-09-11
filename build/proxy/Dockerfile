FROM node:10 as auditorium

COPY ./auditorium/package.json /code/deps/package.json
COPY ./packages /code/packages
WORKDIR /code/deps
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm install
COPY ./auditorium /code/auditorium
COPY ./styles /code/styles
COPY ./banner.txt /code/banner.txt
WORKDIR /code/auditorium
RUN cp -a /code/deps/node_modules /code/auditorium/
ENV NODE_ENV production
RUN npm run build

FROM node:10 as script

COPY ./script/package.json /code/deps/package.json
COPY ./packages /code/packages
WORKDIR /code/deps
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm install
COPY ./script /code/script
COPY ./banner.txt /code/banner.txt
WORKDIR /code/script
RUN cp -a /code/deps/node_modules /code/script/
ENV NODE_ENV production
RUN npm run build

FROM node:10 as vault

COPY ./vault/package.json /code/deps/package.json
COPY ./packages /code/packages
WORKDIR /code/deps
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm install
COPY ./vault /code/vault
COPY ./banner.txt /code/banner.txt
WORKDIR /code/vault
RUN cp -a /code/deps/node_modules /code/vault/
ENV NODE_ENV production
RUN npm run build

FROM nikolaik/python-nodejs:python3.6-nodejs10 as homepage

ARG siteurl
ENV SITEURL=$siteurl

COPY ./homepage /code/homepage
COPY ./styles /code/styles

RUN npm install svgo -g
RUN apt-get update \
	&& apt-get install -y libjpeg-progs optipng \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /code/homepage
ENV PATH /root/.local/bin:$PATH
RUN pip install --user -r requirements.txt
RUN make publish

FROM nginx:1.17-alpine

COPY --from=homepage /code/homepage/output /www/data
COPY --from=script /code/script/dist /www/data
COPY --from=auditorium /code/auditorium/dist /www/data/auditorium
COPY --from=vault /code/vault/dist /www/data/vault
COPY ./build/proxy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

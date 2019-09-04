FROM node:10 as auditorium

COPY ./auditorium /code/auditorium
COPY ./packages /code/packages
COPY ./styles /code/styles
COPY ./banner.txt /code/banner.txt
WORKDIR /code/auditorium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm install
ENV NODE_ENV production
RUN npm run build

FROM node:10 as script

COPY ./script /code/script
COPY ./packages /code/packages
COPY ./banner.txt /code/banner.txt
WORKDIR /code/script
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm install
ENV NODE_ENV production
RUN npm run build

FROM node:10 as vault

COPY ./vault /code/vault
COPY ./packages /code/packages
COPY ./banner.txt /code/banner.txt
WORKDIR /code/vault
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm install
ENV NODE_ENV production
RUN npm run build

FROM nikolaik/python-nodejs:python3.6-nodejs10 as homepage

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
COPY --from=auditorium /code/auditorium/dist /www/data/auditorium
COPY --from=script /code/script/dist /www/data/script
COPY --from=vault /code/vault/dist /www/data/vault
COPY ./build/proxy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

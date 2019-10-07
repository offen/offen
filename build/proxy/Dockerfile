FROM nikolaik/python-nodejs:python3.7-nodejs10 as homepage

ARG siteurl
ENV SITEURL=$siteurl

COPY ./homepage /code/homepage

RUN npm install svgo -g
RUN apt-get update \
	&& apt-get install -y libjpeg-progs optipng \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /code/homepage
ENV PATH /root/.local/bin:$PATH
RUN pip install --user -r requirements.txt
RUN make publish

FROM nginx:1.17-alpine
LABEL maintainer="mail@offen.dev"

ARG robots
ENV ROBOTS_FILE=$robots

COPY --from=homepage /code/homepage/output /www/data
COPY ./build/proxy/$ROBOTS_FILE /www/data/robots.txt
COPY ./build/proxy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

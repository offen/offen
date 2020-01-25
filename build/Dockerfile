FROM ruby:2.5

RUN gem install bundler

WORKDIR /repo
COPY ./Gemfile /repo
COPY ./Gemfile.lock /repo
RUN bundle install

COPY . /repo
RUN bundle exec just-the-docs rake search:init
RUN bundle exec jekyll build

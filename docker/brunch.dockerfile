FROM debian:bullseye-20221114-slim
MAINTAINER Sean Morris <sean@seanmorr.is>

RUN set -eux \
  && apt-get update \
  && apt-get install -y curl gnupg apt-transport-https \
  && curl -sL https://deb.nodesource.com/setup_19.x | bash - \
  && apt update \
  && apt install -y nodejs \
  && npm i -g brunch

WORKDIR "/app"

ENTRYPOINT ["brunch"]

CMD ["w", "-sn"]

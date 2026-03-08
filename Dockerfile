FROM node:22-alpine AS packager

WORKDIR /src

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm pack --pack-destination /tmp

FROM node:22-alpine

WORKDIR /app

COPY --from=packager /tmp/*.tgz /tmp/companyhelm-web.tgz

RUN tar -xzf /tmp/companyhelm-web.tgz -C /tmp \
  && cp -R /tmp/package/. /app/ \
  && rm -rf /tmp/package /tmp/companyhelm-web.tgz

RUN npm install

ENV PORT=4173
ENV COMPANYHELM_ENVIRONMENT=prod
EXPOSE 4173

ENTRYPOINT ["npm", "run", "preview:container"]

# Bazaar [![CircleCI](https://circleci.com/gh/dartmouth-cs98/19w-bazaar-backend.svg?style=svg&circle-token=da3f2720e545f2b6c92aceccc91852ffca18ea15)](https://circleci.com/gh/dartmouth-cs98/19w-bazaar-backend)

This is a REST API that will support the Bazaar client. Please refer to the frontent repo @ https://github.com/dartmouth-cs98/19w-bazaar-frontend. There's no screenshots since this is a pure API (no server-side view 
rendering).

## Architecture

The frontend will interact with the backend via a REST API. This API is created by `express`, with user session management done by `cookie-session` + `passport` + `passport-local`. The rate limiter uses `express-rate-limit` and `rate-limit-redis`. The models are managed by the `Objection` ORM and I use `Knex` to migrate our `Postgres` database. I'm using `argon2` for password hashing, `Amazon SES` for sending emails, and `ioredis` for storing reset/verify tokens in `Redis`. Pictures are resized by `sharp` and are stored in `S3` (via `aws-sdk`). For the websocket endpoint, I'm using `express-ws`. For tests, I'm using just plain `mocha` and for continuous integration/agile development, I'm using `CircleCI`.

## Setup (this is to be run every time the application updates)

1. Install postgres if it isn't installed
2. Create a postgres database (`createdb bazaar`) if it doesn't already exist
3. Install redis if it isn't installed
4. Create `.env` if it doesn't exist, and fill it with environment variables from `.env.defaults` that you'd like to change, or variables that are left empty (such as `AWS_ACCESS_KEY_ID`)
5. `yarn` to install dependencies for development, `yarn install --production` for production
6. (optional) Run `dropdb bazaar` then `createdb bazaar` if the next 2 steps fail
7. `yarn rollback`
8. `yarn migrate`
9. (optional) `yarn seed` if you want to populate the database with sample entries
10. `yarn watch` to run the server for development, `yarn start` for production

## Deployment

The deployment process should involve pulling the repo from the server, installing *only* production dependencies (`yarn --production`), configuring the `.env` file, setting up nginx reverse proxy, and running `yarn start` (optionally 
managing the process with `pm2`).

## Authors

Sungil Ahn  
Ryan Hall

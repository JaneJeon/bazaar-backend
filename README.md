# Bazaar Back End

This is a backend service that will support the Bazaar client. Please refer to the frontent repo @ https://github.com/dartmouth-cs98/19w-bazaar-frontend. There's no screenshots since this is a pure API (no server-side view 
rendering).

## Architecture

The frontend will interact with the backend via a REST API. This API is created by `express`, with user session 
management done by 
`cookie-session` + `passport` + `passport-local`. We have a basic rate limiter set up (`express-rate-limit` + 
`rate-limit-redis`). Our models are managed by the `Objection` ORM and we use `Knex` to migrate our `Postgres` database. We're 
using `argon2` for password hashing and `Amazon SES` for sending emails (and `jsonwebtoken` to authenticate users clicking 
email links). Major blobs 
(mostly pictures) are to be stored 
in `S3` (via `aws-sdk`).

## Setup (this is to be run every time the application updates)

1. Install postgres if it isn't installed
2. Create a postgres database if it doesn't already exist
3. Install redis if it isn't installed
4. Run `yarn update-env`; this will create `.env` if it doesn't already exist, and if it does, it updates its values from the latest `.env.example` values
5. Modify the environment variables in `.env` as needed (`yarn update-env` will tell you which configurations are missing)
6. `yarn` to install dependencies for development, `yarn install --production` for production
7. `yarn rollback`
8. `yarn migrate`
9. (optional) `yarn seed` if you want to populate the database with sample entries
10. `yarn watch` to run the server for development, `yarn start` for production

## Deployment

The deployment process should involve pulling the repo from the server, installing *only* production dependencies (`yarn --production`), configuring the `.env` file, setting up nginx reverse proxy, and running `yarn start` (optionally 
managing the process with `pm2`).

## Authors

Sungil Ahn

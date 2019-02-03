# Bazaar Back End

This is a backend service that will support the Bazaar client. Please refer to the frontent repo @ https://github
.com/dartmouth-cs98/19w-bazaar-frontend. There's no screenshots since this is a pure API (no server-side view 
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

## Setup

1. Install postgres and create a database
2. Install redis
3. Copy `.env.example` into `.env` and modify the environment variables as needed
4. `yarn` to install dependencies
5. `yarn watch`

## Deployment

The deployment 
process should involve pulling the repo from the server, installing *only* production dependencies (`yarn 
--production`), configuring the `.env` file, setting up nginx reverse proxy, and running `yarn start` (optionally 
managing the process with `pm2`).

## Authors

Lindsey Hodel (frontend)
Ryan Hall (frontend)
Daniel Kim (backend)
Sungil Ahn (backend)
Ricky Taboada (frontend)

## Acknowledgments

Thanks Ryan for taking me out for a drink!

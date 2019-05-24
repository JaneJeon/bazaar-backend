# Bazaar

[![CircleCI](https://circleci.com/gh/dartmouth-cs98/19w-bazaar-backend.svg?style=shield&circle-token=da3f2720e545f2b6c92aceccc91852ffca18ea15)](https://circleci.com/gh/dartmouth-cs98/19w-bazaar-backend)

This is a REST API that will support the Bazaar React client. Please refer to the frontent repo @ https://github.com/dartmouth-cs98/19w-bazaar-frontend.

## Architecture

The backend serves as a REST API for the React frontend to interact with. The API server is based on `express`, and uses sessionless Json Web Tokens for authentication. The tokens are given a long life thanks to token blacklisting with the help of `Redis`.

The API server has uses a basic rate limiter based on `express-rate-limit`, since there is no way to configure Heroku's reverse proxy. We're using `PostgreSQL` database, and we use `Objection` ORM to manage data models and `Knex` for queries/migrations/seeds.

While we used to use `argon2` for password hashing, the build kept failing on Heroku's node.js buildpack, so now we're using `bcrypt`.

We resize the pictures server-side using `sharp` and store them in Amazon `S3`. We also use Amazon `SES` for sending emails, though we're planning on using `nodemailer` on top of raw `SES` to support more flexible templating.

The API also has websocket endpoints, and for that, we're using `express-ws`, backed by `Redis` pub/sub.

For tests, we're using plain `mocha`, and for CI/CD, we're using `CircleCI`.

## Setup/Deployment

See `docs/installation.md`.

## Authors

Sungil Ahn  
Ryan Hall

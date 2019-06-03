# Installation Instructions

These steps are to be run every time the application updates. Most of these steps don't need to be run twice, but it is good to check these components are up-to-date.

## Prerequisites

### Postgres

The server relies on a running PostgreSQL instance to store all of the "permanent" data.

When it's running, you can make the required database by running `createdb bazaar` (if it doesn't already exist, of course).

If you're not running a local instance, or if your database name is different, make sure to update `DATABASE_URL` in `.env`!

### Redis

The server relies on a running Redis instance to store all of the "temporary" data. Again, if you're not running a local instance, make sure to update `REDIS_URL` in `.env`!

### Dependencies

Packages may be added/removed between updates, and package versions may change as well. So if you're running this locally, run `yarn` to install all dependencies, whereas for production uses, run `yarn install --production`.

## Running the server

1. `yarn migrate` to migrate our Postgres database to the latest version
2. (optional) `yarn seed` if you want to populate the database with sample data
3. `yarn watch` to run the server for development, `yarn start` for production

## Troubleshooting

If the migration fails for some reason, try `yarn rollback` before migrating. If it fails altogether, try dropping the database (`dropdb bazaar`) and creating the database again (`createdb bazaar`).

## Deployment notes

Only the CI server should be able to push to production when all tests pass. Some sort of reverse proxy (e.g. nginx) should be used to terminate SSL connections and proxy them to our node.js server. In addition, for safety, the server should be run with a process manager in clustered mode (using something like `pm2`), and logs and metrics should be monitored for unexpected failures.

## .env

If there are any empty environment variables in `.env.defaults` (e.g. `AWS_ACCESS_KEY_ID`) or if you want to stray from the defaults, rather than updating `.env.defaults` directly, you should list them in `.env` (create the file if it doesn't already exist).

```c
# server configuration
NODE_ENV=development

FRONTEND_URL=http://localhost:3000

# yarn secret
JWT_SECRET=shhhhhhhhhh
DATABASE_URL=postgres://localhost/bazaar
REDIS_URL=redis://localhost

# AWS configuration
AWS_ACCESS_KEY_ID=AKIAI7BFZ2OKRUFRHMDA
AWS_SECRET_ACCESS_KEY=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
AWS_DEFAULT_REGION=us-east-1

SENDER_ADDRESS=sungil.ahn.19@dartmouth.edu
PICTURE_BUCKET=19w-bazaar

# stripe configuration
STRIPE_PUBLIC_KEY=pk_test_LMFYJ1ERcTyoa8dmVAf19k5A002bFXKGIa
STRIPE_PRIVATE_KEY=sk_test_mA9OXwPPqAvbkIt6K2jYL5Jr000P0fSvee
STRIPE_CLIENT_ID=ca_Eo8m0oC0yHVND3SoLjaJPMfBCAKBZEXH

# algolia configuration
ALGOLIASEARCH_API_KEY=cea126703ca9e20dd46c7e7053421fac
ALGOLIASEARCH_APPLICATION_ID=G6R9SY790V

# application configuration
MIN_USERNAME_LENGTH=2
MAX_USERNAME_LENGTH=15
MIN_PASSWORD_LENGTH=9
MAX_NAME_LENGTH=30
MAX_LOCATION_LENGTH=50
MAX_BIO_LENGTH=140
AVATAR_MAX_FILESIZE=15000000
AVATAR_MAX_WIDTH=500
AVATAR_MAX_HEIGHT=500

MAX_TITLE_LENGTH=140
MAX_DESCRIPTION_LENGTH=500
MAX_CHAT_LENGTH=1000
PAGE_SIZE=15
PICTURE_MAX_FILESIZE=100000000
PICTURE_MAX_WIDTH=4000
PICTURE_MAX_HEIGHT=4000
MAX_PICTURE_ATTACHMENTS=4
MIN_PRICE=5
MAX_REPORT_LENGTH=5000

APPLICATION_FEE=0.25
```


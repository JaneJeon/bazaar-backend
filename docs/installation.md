# Installation Instructions

These steps are to be run every time the application updates. Most of these steps don't need to be run twice, but it is good to check these components are up-to-date.

## Prerequisites

### Postgres

The server relies on a running PostgreSQL instance to store all of the "permanent" data.

When it's running, you can make the required database by running `createdb bazaar` (if it doesn't already exist, of course).

If you're not running a local instance, or if your database name is different, make sure to update `DATABASE_URL` in `.env`!

### Redis

The server relies on a running Redis instance to store all of the "temporary" data. Again, if you're not running a local instance, make sure to update `REDIS_URL` in `.env`!

### .env

If there are any empty environment variables in `.env.defaults` (e.g. `AWS_ACCESS_KEY_ID`) or if you want to stray from the defaults, rather than updating `.env.defaults` directly, you should list them in `.env` (create the file if it doesn't already exist).

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

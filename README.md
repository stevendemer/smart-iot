# Smart IoT Project

## Smart charging solution for EV cars


## Description

<p>Nest API responsible for providing an optimal course of action for your EV charging session. The service takes into consideration the solar radiation, energy prices (euro / kwh), current battery percentage,  duration of stay and returns the appropriate response. </p>

## Installation

```bash
$ npm install
```

## Running the app

```bash
# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Modules summary

- weather forecast module
- Energy prices module
- ampeco session module (charging station info)
- Huawei module (PV)

<p>
  The <strong>prices</strong> module fetches the day-ahead prices from the ENTSOE API (EUR/MWH) once per day at 22:00 PM (UTC+2).
</p>

- Parsing the XML document obtained from the ENTSOE API.
- Extracting and processing only the attributes deemed relevant to our objectives.

## Website
[The Smart Project](https://thesmartproject.gr/the-tool/)


## Contacts
  - Author - [Steven Demertzis](https://www.linkedin.com/in/steven-demertzis-5931571a6/)

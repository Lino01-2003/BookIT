# BookIt

BookIt is a small local web app for booking shared office rooms and equipment. It uses Node.js 20+, plain browser JavaScript, and a JSON file for storage.

## Run in under five minutes

1. Install Node.js 20 or newer.
2. From this folder, run `npm start`.
3. Open http://localhost:3000 in a browser.

If port 3000 is already in use, BookIt automatically tries the next available port and prints the correct URL in the terminal.

Bookings are stored in `data/bookings.json`. Delete its contents and replace them with `[]` to reset local data.

## Run tests

```text
npm test
```

The tests use Node's built-in test runner, so no package installation is required.

## What works

- Create a booking for one of the five fixed office resources.
- Validate required fields, resource names, dates, times, and time ranges on the server.
- Reject overlapping `confirmed` bookings for the same resource and date.
- Allow adjacent bookings: `[09:00, 10:00)` and `[10:00, 11:00)` do not clash.
- Allow the same time on different resources or different dates.
- Cancel confirmed bookings; cancelled bookings remain visible but do not block new bookings.
- View bookings for a selected day, sorted by start time.

## Testing

Run `npm test` from the project folder. The suite uses Node's built-in test runner and covers overlap rejection, adjacent bookings, cancellation release, resource/date isolation, time-range validation, and invalid or missing input. The current verified result is 7 passing tests.

## Known limitations / what does not work

- This is designed for one local process and a small JSON data file, not concurrent multi-user production traffic.
- There are no user accounts, permissions, email notifications, deployment configuration, or database migrations.
- Dates and times are local office values; overnight bookings and timezone conversion are not supported.
- The resource list is fixed in code and cannot be edited through the app.

## Stretch feature

No stretch item was selected because the goal was to finish and test the core booking flow.

## Time spent

Not tracked.

## Assumptions and decisions

- Dates and times are local office values; bookings do not cross midnight.
- Time intervals are half-open: `[start, end)`, so an appointment ending at 10:00 does not block one starting at 10:00.
- Only `confirmed` bookings block a new booking. Cancellation changes a booking to `cancelled` and preserves it in the daily list.
- The server validates all input because the browser is not a trusted boundary.
- This is intended for one local process and a small amount of data. The JSON file is deliberately simple and is not a concurrent database.

## Intentionally out of scope

User accounts, passwords, email notifications, deployment, mobile apps, admin panels, design systems, permissions, recurring bookings, and other stretch features are not included.

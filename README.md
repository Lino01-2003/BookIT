# BookIt

BookIt is a small local web app for booking shared office rooms and equipment. It uses Node.js 20+, the built-in Node HTTP APIs, plain browser JavaScript, and a JSON file for storage.

## Setup and run

1. Install Node.js 20 or newer.
2. From this folder, run `npm start`.
3. Open the URL printed in the terminal, normally `http://localhost:3000`.

The first booking creates `data/bookings.json` automatically when it is missing. Local booking data is ignored by Git, so a fresh checkout starts with an empty store. To reset local data, stop the server and replace the file contents with `[]`.

## Tests

Run:

```text
npm test
```

The suite uses Node's built-in test runner and requires no package installation. The verified result for this version is **12 passing tests**: 7 existing booking-rule tests and 5 API tests covering simultaneous conflicts, simultaneous non-conflicts, cancellation persistence and release, invalid input, missing bookings, storage failure handling, and queue recovery.

## Verified functionality

- Create a booking for one of five fixed resources.
- Validate object shape, text fields, resources, dates, times, and time ranges on the server.
- Reject overlapping confirmed bookings with HTTP 409.
- Allow adjacent intervals such as `[09:00, 10:00)` and `[10:00, 11:00)`.
- Serialize create and cancellation mutations within one running server process.
- Persist JSON through a temporary file before replacing the data file.
- Cancel confirmed bookings; cancelled records remain visible but release the slot.
- Return 400 for invalid input, 404 for missing bookings, and 500 for unexpected storage failures without exposing filesystem details.
- Use the Asia/Colombo office calendar date in browser defaults.

## Known limitations

- Mutation serialization protects one running Node process only. It does not coordinate multiple server processes or multiple deployed instances.
- JSON storage is intentionally small and local, not a concurrent production database.
- There are no accounts, permissions, email notifications, deployment configuration, or database migrations.
- Dates and times use Asia/Colombo office values; bookings do not cross midnight.
- The five-resource list is fixed in code.

## Stretch feature

No stretch feature was selected. The considered options were next-free-slot suggestions, a free-right-now view, and weekly recurrence. Accounts, notifications, and administration remain out of scope.

## Time spent

Approximately 19 hours.

## Assumptions and decisions

- Dates and times are local office values in Asia/Colombo; bookings do not cross midnight.
- Intervals are half-open: `[start, end)`, so an appointment ending at 10:00 does not block one starting at 10:00.
- Only confirmed bookings block a new booking.
- The server is the trusted validation boundary.
- A single-process mutation queue protects the JSON read-check-write sequence.

## Intentionally out of scope

User accounts, passwords, email notifications, deployment, mobile apps, admin panels, permissions, recurring bookings, and other stretch features are not included.

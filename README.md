# BookIt

A local web app for booking shared office rooms and equipment.

## Run in under five minutes

1. Install Node.js 20 or newer.
2. Clone or download the repository.
3. Open a terminal in the project folder and run `npm start`.
4. Open the URL printed in the terminal, normally http://localhost:3000.

No package installation is required. Keep the `data` folder present so the app can save bookings.

## What works

- View five resources and create bookings.
- View bookings for a selected day.
- Reject invalid input and overlapping confirmed bookings.
- Allow back-to-back bookings.
- Cancel bookings and release their slots.
- Save bookings in a local JSON file.

Run `npm test` to execute the tests.

## What does not work

- Overnight bookings and resource editing are not supported.
- Storage does not support multiple server processes safely.
- Elapsed start times today are still allowed; bookings on past dates are rejected.
- Accounts, notifications, and deployment are outside the project scope.

## Stretch feature

None. I prioritised completing and testing the core booking functionality.

## Time spent

Approximately 19 hours.
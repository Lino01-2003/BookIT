# Decisions

## 1. Technology
I chose plain HTML, CSS, browser JavaScript, and Node.js instead of React and Express. The app is small, so this keeps setup and code simple.

## 2. Storage
I chose a local JSON file instead of SQLite or a hosted database. It needs no database setup and is sufficient for this small, single-process application.

## 3. Concurrent requests
I chose a single-process queue instead of database transactions to process booking changes one at a time. Together with conflict checks, it prevents lost updates and double bookings within one server process.

## 4. Saving data
I chose to write to a temporary file before replacing the booking file instead of overwriting it directly. This reduces the risk of partially written JSON.

## 5. Adjacent bookings
I chose to allow back-to-back bookings instead of treating matching endpoints as a clash. Therefore, `09:00–10:00` and `10:00–11:00` can use the same resource.

## 6. Timezone
I chose Asia/Colombo office time instead of UTC or individual user timezones. This keeps booking dates and times consistent for the office.

## 7. Cancellation
I chose to keep cancelled records and exclude them from conflict checks instead of deleting them or keeping their slots blocked. This preserves history and makes the resource available again.

## 8. Input validation and overnight bookings
I chose server-side checks for required text fields, known resources, valid dates and times, and an end time after the start, rather than relying only on browser checks or supporting overnight bookings. This protects against invalid requests and keeps each booking within one day.

## 9. Past dates and elapsed times
The current implementation allows valid past dates and elapsed times today; the alternative is to reject bookings whose date or start time has passed. I am documenting this as a known limitation because the prepared past-date fix has not yet been verified in the submitted project.

## 10. Stretch features
I chose no stretch feature after considering next-free-slot suggestions, a “free right now” view, and weekly recurrence. Completing and testing the core requirements takes priority.
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
I chose to prevent cancellation of past-date bookings rather than allow historical records to be changed. Confirmed bookings dated today or later can be cancelled.

## 8. Input validation and overnight bookings
I chose server-side checks for required text fields, known resources, valid dates and times, and an end time after the start, rather than relying only on browser checks or supporting overnight bookings. This protects against invalid requests and keeps each booking within one day.

## 9. Past dates and elapsed times
I chose to reject past booking dates using Asia/Colombo office time, rather than allow bookings on previous days. Elapsed start times today are still allowed; checking whether today's start time has passed is not implemented.

## 10. Stretch features
I chose no stretch feature after considering next-free-slot suggestions, a “free right now” view, and weekly recurrence. Completing and testing the core requirements takes priority.
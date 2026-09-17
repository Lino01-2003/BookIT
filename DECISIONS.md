# Decisions

## 1. Plain Node.js and browser JavaScript

- **Decision:** Use Node.js built-in `http` APIs with plain HTML, CSS, and browser JavaScript.
- **Options considered:** React/Express or a larger full-stack framework.
- **Why chosen:** The app is small, has no package dependencies, and the core flow stays simple enough to explain line by line in an interview.

## 2. JSON file storage

- **Decision:** Store bookings in `data/bookings.json`.
- **Options considered:** SQLite, another database, or an external hosted service.
- **Why chosen:** Local JSON is sufficient for a single-process assessment app and keeps setup under five minutes.

## 3. Half-open time intervals

- **Decision:** Treat bookings as `[start, end)` intervals.
- **Options considered:** Closed intervals that treat both endpoints as occupied.
- **Why chosen:** A booking ending at 10:00 and another starting at 10:00 should be allowed, which supports practical back-to-back scheduling.

## 4. Only confirmed bookings block

- **Decision:** Only bookings with `confirmed` status participate in conflict checks.
- **Options considered:** Let every stored booking block, including cancelled bookings.
- **Why chosen:** Cancellation must release the resource while preserving the cancelled record for the daily history.

## 5. Local office date and time values

- **Decision:** Treat date and time fields as local office values and reject bookings that cross midnight.
- **Options considered:** Convert values to user time zones or support overnight bookings.
- **Why chosen:** The assessment needs a small, predictable booking model and does not require timezone or overnight scheduling.

## 6. Server-side validation

- **Decision:** Validate required fields, resources, dates, times, and ranges on the server.
- **Options considered:** Rely only on browser `required` and input controls.
- **Why chosen:** Browser validation can be bypassed, while the server is the trusted boundary for stored data.

## 7. Fixed resource list

- **Decision:** Keep the five resources defined in code and not editable in the app.
- **Options considered:** Add resource management or an admin interface.
- **Why chosen:** The assessment provides a fixed seed list, and editing resources is outside the core booking flow.

## 8. No stretch feature

- **Decision:** Select no stretch feature.
- **Options considered:** Recurring bookings, accounts, notifications, or administration.
- **Why chosen:** Finishing and testing the core booking flow is more valuable than adding unrequested complexity.

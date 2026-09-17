# Decisions

## 1. Plain Node.js and browser JavaScript

- **Decision:** Use Node.js built-in HTTP APIs with plain HTML, CSS, and browser JavaScript.
- **Alternative:** React, Express, or a larger full-stack framework.
- **Reason:** The app is small, has no package dependencies, and stays easy to explain.

## 2. JSON file storage

- **Decision:** Store bookings in `data/bookings.json`.
- **Alternative:** SQLite or a hosted database.
- **Reason:** Local JSON keeps setup short and is sufficient for the single-process assessment scope.

## 3. Single-process mutation queue

- **Decision:** Serialize each create/cancel read, validate, conflict-check, modify, and save sequence inside one server process.
- **Alternative:** Database transactions or a distributed lock.
- **Reason:** This prevents lost updates and double-booking without adding infrastructure, while the limitation is documented honestly.

## 4. Temporary-file persistence

- **Decision:** Write complete JSON to a temporary file and replace the storage file only after the write succeeds.
- **Alternative:** Write directly to `bookings.json`.
- **Reason:** Readers should not observe partially written JSON.

## 5. Half-open time intervals

- **Decision:** Treat bookings as `[start, end)` intervals.
- **Alternative:** Closed intervals that block both endpoints.
- **Reason:** Practical back-to-back bookings are allowed.

## 6. Asia/Colombo office date

- **Decision:** Use Asia/Colombo for browser default dates and treat date/time fields as local office values.
- **Alternative:** Use the browser's UTC date or support user time zones.
- **Reason:** The agreed office calendar must not change when a user is near a UTC date boundary.

## 7. Confirmed bookings block

- **Decision:** Only `confirmed` bookings participate in conflict checks.
- **Alternative:** Let cancelled records continue blocking.
- **Reason:** Cancellation releases the resource while preserving history.

## 8. No stretch feature

- **Decision:** Implement no stretch feature.
- **Alternatives considered:** Next-free-slot suggestions, a free-right-now view, and weekly recurrence.
- **Reason:** Core booking correctness, validation, persistence, and testing are more valuable for this assessment. Accounts, notifications, and administration are out of scope.

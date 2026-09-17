# BookIt - Code Review

## Part 1: Findings and fixes

### 1. Concurrent mutations could lose bookings or double-book a resource

- **Severity:** High for simultaneous requests.
- **Finding:** Create and cancellation previously performed separate asynchronous read and write operations, so requests could work from stale arrays.
- **Fix:** A single-process mutation queue now serializes the complete read, validation, conflict check, modification, and save sequence. The queue releases after failures so later requests continue.

### 2. Direct JSON writes could expose incomplete data

- **Severity:** High for a reader during a write.
- **Finding:** Writing directly to `bookings.json` could leave partial JSON if interrupted.
- **Fix:** The server writes a uniquely named temporary file and replaces the data file only after the temporary write succeeds.

### 3. Input validation assumed a well-shaped object

- **Severity:** High at the API boundary.
- **Finding:** Null, arrays, non-string fields, and malformed JSON were not handled with clear validation responses.
- **Fix:** The API rejects malformed bodies and non-string booking fields with HTTP 400 and user-facing messages that do not expose internal details.

### 4. Error statuses did not describe the failure

- **Severity:** Medium.
- **Finding:** Errors were previously returned as HTTP 400, including conflicts and unexpected storage failures.
- **Fix:** Invalid input is 400, clashes are 409, missing bookings are 404, and unexpected storage failures are 500.

### 5. Browser date defaults used UTC instead of the office calendar

- **Severity:** Medium near midnight.
- **Finding:** `toISOString()` could choose a different calendar date from the office date.
- **Fix:** Dashboard and booking defaults now use Asia/Colombo.

## Part 2: Required answers

### What would I fix first?

I would fix the unsynchronized read-check-write sequence first because simultaneous users could receive successful confirmations for conflicting bookings or cause one valid booking to disappear. The mutation queue and isolated concurrency tests now address this for one running server process.

### One thing I would change even though it is not a bug

I would eventually replace JSON storage with a transactional database and use stable machine-readable domain error codes such as `BOOKING_CONFLICT`. That would support multiple server processes and make client error handling less dependent on message text.

### One thing I would deliberately leave alone

I would keep the overlap rule as a small pure helper using half-open intervals. It is easy to read, easy to test, and matches the agreed back-to-back booking policy.

## Remaining limitation

The queue is intentionally scoped to one running Node.js process. Multiple processes or deployed instances would require database transactions or distributed coordination.

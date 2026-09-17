# BookIt — Code Review

## 1. Conflict checks rely on local memory

- Lines: 2, 9–11, 19
- Severity: High
- Problem: After a restart or across multiple server instances, the local array can miss existing bookings and allow double-booking.
- Fix: Use the database as the source of truth and enforce conflict checking and insertion atomically.

## 2. Adjacent bookings are treated as overlapping

- Lines: 4–5
- Severity: Medium (depends on the booking policy)
- Problem: The comparison rejects 10:00–11:00 when an existing booking ends at 10:00, even if back-to-back bookings should be allowed.
- Fix: If back-to-back bookings are allowed, use `a.start < b.end && a.end > b.start`.

## 3. Input and identifier types are not validated consistently

- Lines: 8–10, 25, 32
- Severity: High
- Problem: Missing fields, invalid or reversed dates, and inconsistent identifier types can cause incorrect comparisons, failed lookups, or runtime errors.
- Fix: Validate required fields, normalize dates and identifiers, enforce `start < end`, and compare canonical identifiers using `===`.

## 4. Cancellation is incomplete and handles missing bookings unsafely

- Lines: 9–11, 24–27
- Severity: High
- Problem: Cancellation is not persisted, cancelled bookings still block availability, and an unknown booking ID causes a TypeError.
- Fix: Handle missing bookings explicitly, persist cancellation before reporting success, and exclude cancelled bookings from conflict checks.

## 5. Booking IDs are neither reliably unique nor protected

- Lines: 15–16
- Severity: High
- Problem: Array-length IDs can repeat after restarts or across servers, and a caller-supplied `id` can overwrite the generated value through `...input`.
- Fix: Copy only allowed input fields and assign a server-controlled ID backed by a database unique constraint.

## 6. Mutable references expose internal booking data

- Lines: 16, 21, 27, 31–33
- Severity: Medium
- Problem: An in-process caller can modify shared booking objects or Date values without validation, conflict checks, or database updates.
- Fix: Copy and normalize input values and return detached response objects.

## 7. Creation reports success before persistence completes

- Lines: 19–21
- Severity: High
- Problem: If the database save is asynchronous, creation reports success before it completes; a failed save leaves an unsaved booking in memory.
- Fix: Await persistence before updating memory and returning success, while keeping conflict checking and insertion atomic.

## 8. Daily filtering can return incomplete or incorrectly dated results

- Lines: 30–33
- Severity: Medium (depends on the daily view and timezone requirements)
- Problem: Filtering by the UTC start date omits overnight bookings occupying the requested day and can place bookings on the wrong business calendar date.
- Fix: Calculate day boundaries in the agreed timezone and include bookings where `start < dayEnd && end > dayStart`.

## What I would fix first in thirty minutes

I would fix issue 7 because a customer can receive confirmation for a booking that was never saved.

I would await persistence, handle failures, and update memory only after success. Introducing an awaited save must not allow concurrent requests to bypass conflict checks; database-level protection is required across multiple servers.

I would verify that a delayed save delays the success response and that a failed save leaves no booking in memory.

## One thing I would change even though it is not a bug

I would replace `Error('Conflict')` on line 12 with a domain error carrying a stable code such as `BOOKING_CONFLICT`. This makes client handling clearer without relying on message text.

## One thing I would deliberately leave alone

I would keep `overlaps()` as a small, pure helper function. It makes the overlap rule easy to understand and test, while allowing its comparison operators to follow the agreed booking policy.

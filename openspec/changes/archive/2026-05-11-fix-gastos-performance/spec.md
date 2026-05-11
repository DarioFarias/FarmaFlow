# Delta: Gastos Performance Optimization

Performance requirements for the gastos module — 4 independent fixes targeting database round-trips and client-side caching.

## ADDED Requirements

### Requirement: N+1 Pharmacy Query Cache (REQ-PERF-001)

For SUPERVISOR users, the Pharmacy active-IDs query in GET /api/expenses MUST be cached in-memory with a TTL of 60 seconds to eliminate redundant DB round-trips.

#### Scenario: Cache hit skips Pharmacy query

- GIVEN the pharmacy cache was populated within the last 60 seconds
- WHEN a SUPERVISOR requests GET /api/expenses
- THEN the handler MUST NOT execute Pharmacy.find
- AND cached IDs MUST be used for expense filtering

#### Scenario: Cache miss fetches from database

- GIVEN the pharmacy cache is empty or TTL has expired
- WHEN a SUPERVISOR requests GET /api/expenses
- THEN the handler MUST execute exactly one Pharmacy.find query
- AND the response MUST contain correct expenses for all active pharmacies

#### Scenario: Bounded staleness on pharmacy deactivation

- GIVEN a pharmacy was deactivated less than 60 seconds ago
- WHEN the cached IDs still include it
- THEN the supervisor MAY still see expenses from that pharmacy for up to 60 seconds
- AND this bounded inconsistency MUST be documented as an accepted tradeoff

### Requirement: Batch Operations via Bulk Writes (REQ-PERF-002)

The batch-approve, batch-report, and batch-return endpoints MUST use find({$in}) + bulkWrite instead of N individual findById + findByIdAndUpdate calls, reducing DB round-trips from 2N to exactly 2.

#### Scenario: All expenses valid

- GIVEN all expense IDs in the batch request are valid and in correct status
- WHEN the batch endpoint executes
- THEN the system MUST make exactly 2 DB queries (one find, one bulkWrite)
- AND the response status MUST be 200 with all IDs in processedResults

#### Scenario: Partial failure — some IDs invalid

- GIVEN some expense IDs do not exist or are in an invalid status for the operation
- WHEN the batch endpoint executes
- THEN valid expenses MUST still be updated via bulkWrite
- AND the response MUST include a partialErrors array with each failed ID and its reason
- AND no expense in invalid status MUST be modified

#### Scenario: Empty batch request

- GIVEN the batch request body contains an empty expense IDs array
- WHEN the endpoint processes it
- THEN the system MUST return 400 Bad Request with a validation error message

### Requirement: Client-Side Caching with React Query (REQ-PERF-003)

The gastos list page and expense form MUST use TanStack React Query to cache expense and pharmacy data with staleTime 30s, preventing redundant network requests on remount or navigation.

#### Scenario: Component remount returns cached data

- GIVEN `useExpenses` fetched data within the last 30 seconds
- WHEN the user navigates away and back to the gastos page
- THEN the UI MUST render from cache immediately
- AND MUST NOT show a loading spinner
- AND a background refetch MAY update stale data

#### Scenario: First mount fetches from API

- GIVEN no cached data exists for the query key
- WHEN the gastos page mounts for the first time
- THEN the component MUST show a loading state
- AND MUST fetch from GET /api/expenses
- AND MUST render the list once data arrives

#### Scenario: Network error shows retry UI

- GIVEN the API request fails (network error or 5xx)
- WHEN `useExpenses` receives the error
- THEN the component MUST display an error message with a retry button
- AND MUST NOT remain in an infinite loading state

### Requirement: Compound Database Index (REQ-PERF-004)

The Expense collection MUST have a compound index on {pharmacy: 1, status: 1, createdAt: -1} to support the common query pattern without full collection scans.

#### Scenario: Index present on collection

- GIVEN the application has started with the updated Expense schema
- WHEN querying db.expenses.getIndexes()
- THEN an index on {pharmacy: 1, status: 1, createdAt: -1} MUST exist

#### Scenario: Background index creation

- GIVEN MongoDB applies the new index
- THEN the index SHOULD be created in the background to avoid blocking reads/writes

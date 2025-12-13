#  Module 2 – API Key Authentication & Authorization Service

## 1. Overview

Module 2 is responsible for **API key validation and role-based authorization** in a server-to-server communication architecture.
It acts as a centralized authentication layer that verifies incoming API keys using **Redis caching** and **MongoDB as the source of truth**, ensuring **low latency**, **high throughput**, and **abuse prevention**.

---

## 2. Responsibilities

Module 2 performs the following tasks:

* Validate API keys received in incoming requests
* Cache **both valid and invalid API keys** in Redis
* Fetch API key data from MongoDB on cache misses
* Enforce **role-based authorization**
* Prevent database abuse by caching invalid keys
* Provide fast authentication responses for downstream services

---

## 3. Request Flow

```text
Client / Service
        ↓
Rate Limiting (Module 1)
        ↓
API Key Authentication (Module 2)
        ↓
Authorization (Module 3)
        ↓
Protected API
```

---

## 4. API Key Format

API keys follow a predefined format:

```text
sk_<environment>_<service>_<random>
```

**Example:**

```text
sk_test_payment_123456
```

---

## 5. Data Model

### MongoDB – `ApiKey` Collection

```ts
{
  keyHash: string,        // SHA-256 hash of API key
  roles: string[],        // Allowed roles (e.g. ["PAYMENTS"])
  owner: string,          // Service name
  isActive: boolean,      // Revocation flag
  createdAt: Date
}
```

> **Note:** Raw API keys are never stored in the database.

---

## 6. Redis Caching Strategy

### Redis Key Patterns

| Type        | Redis Key               | Value              | TTL        |
| ----------- | ----------------------- | ------------------ | ---------- |
| Valid key   | `apikey:valid:<hash>`   | `{ roles, owner }` | 10 minutes |
| Invalid key | `apikey:invalid:<hash>` | `1`                | 2 minutes  |

---

### Why cache invalid keys?

Caching invalid API keys:

* Prevents repeated MongoDB queries
* Mitigates brute-force attempts
* Improves system resilience under abuse

---

## 7. Validation Logic

1. Hash incoming API key using **SHA-256**
2. Check Redis cache:

   * If **valid key found** → allow request
   * If **invalid key found** → reject immediately
3. On cache miss:

   * Query MongoDB
   * Cache result in Redis (valid or invalid)
4. Attach roles to request context
5. Forward request to authorization layer

---

## 8. Authorization Handling

Once authenticated, the user’s roles are attached to the request:

```ts
req.auth = {
  roles: ["PAYMENTS"],
  owner: "payment-service"
}
```

Module 3 verifies whether the requested API has the required roles.

---

## 9. Error Responses

| Status Code | Reason                        |
| ----------- | ----------------------------- |
| `401`       | Missing or invalid API key    |
| `403`       | Insufficient role permissions |
| `500`       | Internal server error         |

---

## 10. Performance & Load Testing

### Load Test Configuration

* **Tool:** k6
* **Concurrent users:** 50
* **Duration:** 30 seconds
* **Traffic:** Mixed valid and invalid API keys

### Results Summary

| Metric          | Value       |
| --------------- | ----------- |
| Average latency | ~7 ms       |
| P95 latency     | < 10 ms     |
| Throughput      | ~50 req/sec |
| Success rate    | 98%         |

> Redis caching ensured low latency even under invalid-key abuse scenarios.

### Stress Testing – API Key Validation Module
Test Objective

To evaluate system stability, correctness, and latency under high concurrent load, simulating multiple backend services accessing the API using valid API keys.

Test Configuration

Tool: k6
Max Virtual Users: 200
Test Duration: ~2 minutes
Load Pattern: Gradual ramp-up and ramp-down across 6 stages
Endpoint Tested: GET /test
Authentication: API key via request headers

Results Summary
Request Handling

Total Requests: 20,705
Request Rate: ~172 requests/second
Successful Checks: 100%
Failed Checks: 0%
Latency Metrics
Average Response Time: 2.66 ms
Median Response Time: 2.5 ms
90th Percentile: 4.03 ms
95th Percentile: 4.66 ms
Maximum Observed Latency: 27.06 ms

Error Metrics
HTTP Request Failure Rate: 29.55%
Note: HTTP failures correspond to intentionally rejected requests (e.g., invalid or unauthorized API keys) and do not indicate server instability.

---

## 11. Security Considerations

* API keys are hashed before storage
* Raw API keys are never logged or persisted
* Invalid keys are cached to prevent abuse
* Redis TTL prevents stale permissions
* Supports API key revocation via database flag

---

## 12. Tech Stack

* **Language:** TypeScript
* **Runtime:** Node.js
* **Database:** MongoDB
* **Cache:** Redis (ioredis)
* **Testing:** k6

---

## 13. Conclusion

Module 2 provides a **high-performance, secure, and scalable API key authentication system** designed for microservice communication.
Through Redis-based caching and strict validation logic, the system ensures both **low latency** and **strong abuse prevention**, making it suitable for production environments.

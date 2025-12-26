import http from "k6/http";
import { check, sleep } from "k6";
// Define different API key scenarios
const API_KEYS = [
  { name: "valid", value: "sk_student_123", expected: 200 },
  { name: "invalid", value: "sk_invalid_abcdef", expected: 401 },
  { name: "random", value: "lol-no-key", expected: 401 }
];

export const options = {
  vus: 50,
  duration: "30s"
};
//function to test load on the server 
export default function () {
  // Randomly select an API key type for each request
  const key = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];

  const res = http.get("http://localhost:3000/test", {
    headers: {
      "x-api-key": key.value
    }
  });

  check(res, {
    [`${key.name} key → correct status`]: (r) => r.status === key.expected,
    "latency < 30ms": (r) => r.timings.duration < 30
  });

  sleep(1);
}

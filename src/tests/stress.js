import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "20s", target: 20 },
    { duration: "20s", target: 50 },
    { duration: "20s", target: 100 },
    { duration: "20s", target: 150 },
    { duration: "20s", target: 200 },
    { duration: "20s", target: 0 }
  ]
};

export default function () {
  const isValid = Math.random() < 0.7;

  const apiKey = isValid
    ? "sk_test_payment_123456"
    : "sk_invalid_abuse";

  const expectedStatus = isValid ? 200 : 401;

  const res = http.get("http://localhost:3000/test", {
    headers: {
      "x-api-key": apiKey
    }
  });

  check(res, {
    "correct status": (r) => r.status === expectedStatus
  });

  sleep(0.5);
}

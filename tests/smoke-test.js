import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Smoke test standard: simulasi beban ringan untuk memastikan server hidup & responsif
  vus: 5, // Virtual Users
  duration: '10s',
  thresholds: {
    // 99% request harus dibawah 500ms
    http_req_duration: ['p(99)<500'],
    // Tingkat error harus 0%
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Secara default menunjuk ke localhost, tapi di CI/CD bisa diganti via env target
  const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:3000';

  // Endpoint health harus selalu mengembalikan 200 OK dengan latency rendah
  const res = http.get(`${TARGET_URL}/health`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'status is ok': (r) => r.json('status') === 'ok',
    'latency is acceptable (< 200ms)': (r) => r.timings.duration < 200,
  });

  sleep(1);
}

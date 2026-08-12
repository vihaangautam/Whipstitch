import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    inbound_burst: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1m', // 1,000 requests per minute
      duration: '3m',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<2500'], // p95 latency under 2.5s
  },
};

export default function () {
  const url = 'http://localhost:8000/v1/events/ingest';
  const payload = JSON.stringify({
    tenant_id: 'trifid_media',
    email: `lead_${__VU}_${__ITER}@loadtestbrand.com`,
    company_name: `LoadTest Brand ${__VU}`,
    raw_payload: { campaign: 'k6_burst_2026' },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'whipstitch-dev-key-12345',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'event_id present': (r) => JSON.parse(r.body).event_id !== undefined,
  });

  sleep(0.05);
}

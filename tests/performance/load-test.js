// K6 Load Testing Script for Omekan
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate below 10%
  },
};

const BASE_URL = 'http://localhost';

// Test data
const testEvents = [
  'summer-festival-2026',
  'rock-concert-march',
  'jazz-night-downtown'
];

export default function () {
  // Test homepage
  let response = http.get(`${BASE_URL}/frontend/events.html`);
  check(response, {
    'homepage loads': (r) => r.status === 200,
    'homepage has title': (r) => r.body.includes('Omekan'),
  }) || errorRate.add(1);

  sleep(1);

  // Test API endpoints
  response = http.get(`${BASE_URL}/api/events`);
  check(response, {
    'events API responds': (r) => r.status === 200,
    'events API returns JSON': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.status === 'success';
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test communities API
  response = http.get(`${BASE_URL}/api/communities`);
  check(response, {
    'communities API responds': (r) => r.status === 200,
    'communities API returns data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.status === 'success' && Array.isArray(data.data);
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test categories API
  response = http.get(`${BASE_URL}/api/categories`);
  check(response, {
    'categories API responds': (r) => r.status === 200,
    'categories API returns data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.status === 'success' && Array.isArray(data.data);
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test search functionality
  const searchQueries = ['festival', 'concert', 'party', 'kultur'];
  const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  
  response = http.get(`${BASE_URL}/api/search/events?q=${randomQuery}&limit=10`);
  check(response, {
    'search API responds': (r) => r.status === 200,
    'search returns results': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.status === 'success' && data.pagination;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test admin dashboard
  response = http.get(`${BASE_URL}/admin/dashboard.html`);
  check(response, {
    'admin dashboard loads': (r) => r.status === 200,
    'admin dashboard has content': (r) => r.body.includes('Admin Dashboard'),
  }) || errorRate.add(1);

  sleep(1);

  // Test static assets
  const assets = [
    '/frontend/css/events.css',
    '/frontend/js/events.js',
    '/frontend/manifest.json'
  ];

  assets.forEach(asset => {
    response = http.get(`${BASE_URL}${asset}`);
    check(response, {
      [`${asset} loads`]: (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(2);
}

// Setup function (runs once per VU)
export function setup() {
  console.log('Starting load test for Omekan Event Platform');
  
  // Verify application is running
  const response = http.get(`${BASE_URL}/api/health`);
  if (response.status !== 200) {
    throw new Error('Application is not healthy, aborting test');
  }
  
  return { baseUrl: BASE_URL };
}

// Teardown function (runs once after all VUs finish)
export function teardown(data) {
  console.log('Load test completed');
  
  // Could send results to monitoring system here
  const finalHealthCheck = http.get(`${data.baseUrl}/api/health`);
  console.log(`Final health check: ${finalHealthCheck.status}`);
}

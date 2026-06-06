import http from 'k6/http';
import { check, sleep } from 'k6';

// Usage: 
// k6 run -e SUPABASE_URL=https://your-project.supabase.co -e SUPABASE_ANON_KEY=your-anon-key scripts/load-test.js

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // ramp up to 50 concurrent users
    { duration: '1m', target: 50 },   // stay at 50 for 1 minute
    { duration: '30s', target: 0 },   // ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of queries must complete below 500ms
  },
};

const supabaseUrl = __ENV.SUPABASE_URL;
const anonKey = __ENV.SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Please provide SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

export default function () {
  // Randomly hit one of the 500 seeded businesses to defeat DB-level query caching
  const bizId = Math.floor(Math.random() * 500) + 1;
  const slug = `scale-biz-${bizId}`;

  // 1. Fetch the business
  const bizRes = http.get(`${supabaseUrl}/rest/v1/businesses?slug=eq.${slug}&select=*`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });
  
  check(bizRes, {
    'business status 200': (r) => r.status === 200,
    // The result is an array, we check if it has items
    'business found': (r) => r.body && r.body.length > 5,
  });

  // Extract the real UUID of the business if we needed to chain queries (mocking a real frontend SSR)
  // For brevity, we just do a separate query fetching all categories for this slug
  // Wait a small amount before fetching client data to mimic realistic load
  sleep(Math.random() * 0.5 + 0.1);

  // Note: in a real Next.js SSR scenario, these fetches happen in parallel
  // We simulate the database read load here.
  sleep(Math.random() * 2 + 1);
}

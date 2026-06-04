import { GET } from '../app/api/concepts/[slug]/route';
import { NextRequest } from 'next/server';

async function testRoute() {
  console.log('--- TESTING PUBLIC CONCEPT API ROUTE FOR SABR ---');

  // NextRequest mock
  const request = new NextRequest('http://localhost:3000/api/concepts/sabr');
  
  // Call the GET handler directly
  const response = await GET(request, { 
    params: Promise.resolve({ slug: 'sabr' }) 
  });

  console.log('Status Code:', response.status);
  const data = await response.json();
  
  console.log('\nResponse JSON:');
  console.log(JSON.stringify(data, null, 2));
}

testRoute().catch(console.error);

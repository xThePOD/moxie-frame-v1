import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';  // For making API requests
import { neynar } from 'frog/middlewares';

// Airstack API configuration
const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
const AIRSTACK_API_KEY = '12c3d6930c35e4f56a44191b68b84483f';  // Replace with your real API key

// Initialize the Frog app with Neynar middleware
export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 630 },
  title: '$MOXIE Earnings Tracker',
}).use(
  neynar({
    apiKey: '63FC33FA-82AF-466A-B548-B3D906ED2314',  // Neynar API Key for Farcaster FID integration
    features: ['interactor', 'cast'],
  })
);

// Define the Airstack API response types
interface AirstackApiResponse {
  data: {
    todayEarnings?: { FarcasterMoxieEarningStat?: Array<{ allEarningsAmount?: string }> };
    lifetimeEarnings?: { FarcasterMoxieEarningStat?: Array<{ allEarningsAmount?: string }> };
  };
  errors?: Array<{ message: string }>;
}

// Moxie User Info interface
interface MoxieUserInfo {
  todayEarnings: string;
  lifetimeEarnings: string;
}

// Function to fetch Moxie earnings based on FID
async function getMoxieUserInfo(fid: string): Promise<MoxieUserInfo> {
  const query = `
    query MoxieEarnings($fid: String!) {
      todayEarnings: FarcasterMoxieEarningStats(
        input: {timeframe: TODAY, blockchain: ALL, filter: {entityType: {_eq: USER}, entityId: {_eq: $fid}}}
      ) {
        FarcasterMoxieEarningStat {
          allEarningsAmount
        }
      }
      lifetimeEarnings: FarcasterMoxieEarningStats(
        input: {timeframe: LIFETIME, blockchain: ALL, filter: {entityType: {_eq: USER}, entityId: {_eq: $fid}}}
      ) {
        FarcasterMoxieEarningStat {
          allEarningsAmount
        }
      }
    }
  `;

  const variables = { fid };

  try {
    const response = await fetch(AIRSTACK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIRSTACK_API_KEY}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: AirstackApiResponse = await response.json();

    if (data.errors) {
      throw new Error('Error in GraphQL query: ' + data.errors[0].message);
    }

    const todayEarnings = data.data.todayEarnings?.FarcasterMoxieEarningStat?.[0]?.allEarningsAmount || '0';
    const lifetimeEarnings = data.data.lifetimeEarnings?.FarcasterMoxieEarningStat?.[0]?.allEarningsAmount || '0';

    return {
      todayEarnings,
      lifetimeEarnings,
    };
  } catch (error) {
    console.error('Error fetching Moxie data:', error);
    throw error;
  }
}

// Frame 1: Welcome Screen with a Button to Check Moxie Stats
app.frame('/', (c) => {
  return c.res({
    image: (
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: black;">
        <h1 style="color: white; font-size: 48px;">MOXIE</h1>
      </div>
    ),
    intents: [
      <Button value="check_moxie_stats">Check Moxie Stats</Button>
    ],
  });
});

// Frame 2: Moxie Earnings Display
app.frame('/check', (c) => {
  const { fid } = c.frameData || {};  // Neynar usually provides FID here

  if (!fid) {
    return c.res({
      image: (
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; background-color: #f0e6fa;">
          <h1 style="font-size: 36px; color: black;">Error: No FID provided</h1>
        </div>
      ),
    });
  }

  // Fetch and display Moxie earnings
  return getMoxieUserInfo(fid.toString()).then((userInfo) => {
    return c.res({
      image: (
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background-color: black;">
          <h1 style="color: white; font-size: 36px;">Moxie Stats</h1>
          <p style="color: white; font-size: 24px;">Today’s Earnings: {userInfo.todayEarnings} MOX</p>
          <p style="color: white; font-size: 24px;">Lifetime Earnings: {userInfo.lifetimeEarnings} MOX</p>
        </div>
      ),
    });
  }).catch((error) => {
    return c.res({
      image: (
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; background-color: #f0e6fa;">
          <h1 style="color: black; font-size: 36px;">Error fetching data: {error.message}</h1>
        </div>
      ),
    });
  });
});

// Handle GET and POST requests
export const GET = handle(app);
export const POST = handle(app);

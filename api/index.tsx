import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';

const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
const AIRSTACK_API_KEY = '12c3d6930c35e4f56a44191b68b84483f';  // Replace with your actual Airstack API Key

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 630 },
  title: '$MOXIE Earnings Tracker',
}).use(
  neynar({
    apiKey: '63FC33FA-82AF-466A-B548-B3D906ED2314',  // Replace with your Neynar API Key
    features: ['interactor', 'cast'],
  })
);

interface AirstackApiResponse {
  data: {
    todayEarnings?: { FarcasterMoxieEarningStat?: Array<{ allEarningsAmount?: string }> };
    lifetimeEarnings?: { FarcasterMoxieEarningStat?: Array<{ allEarningsAmount?: string }> };
  };
  errors?: Array<{ message: string }>;
}

interface MoxieUserInfo {
  todayEarnings: string;
  lifetimeEarnings: string;
}

// Function to fetch Moxie earnings from Airstack based on FID
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

// First frame: Welcome Screen with a Button to Check Moxie Stats
app.frame('/', (c) => {
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'black' }}>
        <h1 style={{ color: 'white', fontSize: '48px' }}>MOXIE</h1>
        <p style={{ color: 'white', fontSize: '24px' }}>Check your Moxie earnings</p>
      </div>
    ),
    intents: [
      <Button value="check_moxie_stats" action="/check">Check Moxie Stats</Button>
    ],
  });
});

// Second frame: Display Moxie Earnings
app.frame('/check', async (c) => {
  const { fid } = c.frameData || {};  // Neynar provides FID here

  if (!fid) {
    return c.res({
      image: (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#f0e6fa' }}>
          <h1 style={{ fontSize: '36px', color: 'black' }}>Error: No FID provided</h1>
        </div>
      ),
    });
  }

  try {
    const userInfo = await getMoxieUserInfo(fid.toString());
    return c.res({
      image: (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'black' }}>
          <h1 style={{ color: 'white', fontSize: '36px' }}>Moxie Stats</h1>
          <p style={{ color: 'white', fontSize: '24px' }}>Today’s Earnings: {userInfo.todayEarnings} MOX</p>
          <p style={{ color: 'white', fontSize: '24px' }}>Lifetime Earnings: {userInfo.lifetimeEarnings} MOX</p>
        </div>
      ),
      intents: [
        <Button action="/">Back</Button>,
      ]
    });
  } catch (error) {
    return c.res({
      image: (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0e6fa' }}>
          <h1 style={{ fontSize: '36px', color: 'black' }}>Error fetching data</h1>
          <p style={{ fontSize: '24px', color: 'black' }}>{(error as Error).message}</p>
        </div>
      ),
    });
  }
});

// Handle GET and POST requests
export const GET = handle(app);
export const POST = handle(app);

import { Frog } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';

// Define the Airstack API URL and your actual API key
const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
const AIRSTACK_API_KEY = '12c3d6930c35e4f56a44191b68b84483f'; // Update this with your real API key

// Initialize the Frog app and use Neynar for Farcaster FID and Wallet integration
export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 630 },
  title: '$MOXIE Earnings Tracker',
}).use(
  neynar({
    apiKey: '63FC33FA-82AF-466A-B548-B3D906ED2314',  // Your Neynar API Key for Farcaster integration
    features: ['interactor', 'cast'],
  })
);

// Define the types for the response data
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

// Function to get Moxie earnings for a specific FID
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
        'Authorization': `Bearer ${AIRSTACK_API_KEY}`,  // Ensure this key is correct
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

// Frame 1: Welcome frame that shows "MOXIE" with a button to check stats
app.frame('/', () => {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>$MOXIE Earnings Tracker</title>
      <meta property="fc:frame" content="vNext">
    </head>
    <body style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: black;">
      <h1 style="color: white; font-size: 48px;">MOXIE</h1>
      <form method="post" action="/api/check">
        <button type="submit" style="font-size: 24px; margin-top: 20px;">Check Moxie Stats</button>
      </form>
    </body>
    </html>`, {
    headers: { 'Content-Type': 'text/html' },
  });
});

// Frame 2: Shows Moxie earnings after checking stats
app.frame('/check', async (c) => {
  const { fid } = c.frameData || {};  // Extract FID from frameData
  if (!fid) {
    return c.res({
      image: (
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; background-color: #f0e6fa;">
          <h1 style="font-size: 36px; color: black;">Error: No FID provided</h1>
          <form method="post" action="/">
            <button type="submit" style="font-size: 24px;">Go Back</button>
          </form>
        </div>
      ),
    });
  }

  try {
    const userInfo = await getMoxieUserInfo(fid.toString());

    return c.res({
      image: (
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background-color: black;">
          <h1 style="color: white; font-size: 36px;">Moxie Stats</h1>
          <p style="color: white; font-size: 24px;">Today’s Earnings: {userInfo.todayEarnings} MOX</p>
          <p style="color: white; font-size: 24px;">Lifetime Earnings: {userInfo.lifetimeEarnings} MOX</p>
          <form method="post" action="/">
            <button type="submit" style="font-size: 24px; margin-top: 20px;">Back</button>
          </form>
        </div>
      ),
    });
  } catch (error) {
    return c.res({
      image: (
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background-color: #f0e6fa;">
          <h1 style="color: black; font-size: 36px;">Error fetching data</h1>
          <form method="post" action="/">
            <button type="submit" style="font-size: 24px;">Go Back</button>
          </form>
        </div>
      ),
    });
  }
});

// Handle GET and POST requests
export const GET = handle(app);
export const POST = handle(app);

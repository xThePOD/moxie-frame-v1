import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';
import fetch from 'node-fetch';
import { neynar } from 'frog/middlewares';

const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
const AIRSTACK_API_KEY = '12c3d6930c35e4f56a44191b68b84483f'; // Your actual API key

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 630 },
  title: '$MOXIE Earnings Tracker',
}).use(
  neynar({
    apiKey: '63FC33FA-82AF-466A-B548-B3D906ED2314',
    features: ['interactor', 'cast'],
  })
);

// API Response Interfaces
interface AirstackApiResponse {
  data: {
    todayEarnings?: {
      FarcasterMoxieEarningStat?: Array<{
        allEarningsAmount?: string;
      }>;
    };
    lifetimeEarnings?: {
      FarcasterMoxieEarningStat?: Array<{
        allEarningsAmount?: string;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

interface MoxieUserInfo {
  todayEarnings: string;
  lifetimeEarnings: string;
}

// Fetch Moxie User Info from API
async function getMoxieUserInfo(fid: string): Promise<MoxieUserInfo> {
  const query = `
    query MoxieEarnings($fid: String!) {
      todayEarnings: FarcasterMoxieEarningStats(
        input: { timeframe: TODAY, blockchain: ALL, filter: { entityType: {_eq: USER}, entityId: {_eq: $fid}} }
      ) {
        FarcasterMoxieEarningStat {
          allEarningsAmount
        }
      }
      lifetimeEarnings: FarcasterMoxieEarningStats(
        input: { timeframe: LIFETIME, blockchain: ALL, filter: { entityType: {_eq: USER}, entityId: {_eq: $fid}} }
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
        Authorization: `Bearer ${AIRSTACK_API_KEY}`,
      },
      body: JSON.stringify({ query, variables }),
    });

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

// Home Frame
app.frame('/', (c) => {
  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          color: 'white',
        }}
      >
        <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>MOXIE</h1>
        <p style={{ fontSize: '27px', fontWeight: 'bold' }}>Check your Moxie earnings</p>
      </div>
    ),
    intents: [<Button value="check_moxie_stats" action="/check">Check Moxie Stats</Button>],
  });
});

// Frame with Cast Button
app.frame('/check', async (c) => {
  const { fid } = c.frameData || {};

  if (!fid) {
    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f0e6fa',
            color: 'black',
          }}
        >
          <h1 style={{ fontSize: '39px', fontWeight: 'bold' }}>Error: No FID provided</h1>
        </div>
      ),
    });
  }

  try {
    const userInfo = await getMoxieUserInfo(fid.toString());

    // Prewritten message for Farcaster
    const shareText = `I've earned ${parseFloat(userInfo.todayEarnings).toFixed(2)} MOX today and ${parseFloat(userInfo.lifetimeEarnings).toFixed(
      2
    )} MOX in total! 🚀 Check your own Moxie earnings!`;
    
    const frameUrl = `https://moxie-frame-v1.vercel.app/api/check?fid=${fid}`; // Update with your base URL
    
    const farcasterShareURL = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(frameUrl)}`;

    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#7b2cbf',
            color: 'white',
          }}
        >
          <h1 style={{ fontSize: '51px', fontWeight: 'bold', marginBottom: '20px' }}>Moxie Stats</h1>
          <p style={{ fontSize: '39px', fontWeight: 'bold' }}>Today's Earnings: {parseFloat(userInfo.todayEarnings).toFixed(2)} MOX</p>
          <p style={{ fontSize: '39px', fontWeight: 'bold' }}>Lifetime Earnings: {parseFloat(userInfo.lifetimeEarnings).toFixed(2)} MOX</p>
        </div>
      ),
      intents: [
        <Button action="/">Back</Button>,
        <Button.Link href={farcasterShareURL}>Cast This</Button.Link>,
      ],
    });
  } catch (error) {
    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f0e6fa',
            color: 'black',
          }}
        >
          <h1 style={{ fontSize: '39px', fontWeight: 'bold' }}>Error fetching data</h1>
          <p style={{ fontSize: '27px' }}>{(error as Error).message}</p>
        </div>
      ),
    });
  }
});

// Handle GET and POST requests
export const GET = handle(app);
export const POST = handle(app);

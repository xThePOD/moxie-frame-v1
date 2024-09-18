import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { handle } from 'frog/vercel';

// Hardcode your API key here (Make sure to replace with the actual API key)
const AIRSTACK_API_KEY = '12c3d6930c35e4f56a44191b68b84483f';

// Query to fetch Moxie earnings stats for users
async function fetchMoxieEarningStats(): Promise<any> {
  const query = `
    query RewardUsersForFrameInteraction {
      FarcasterMoxieEarningStats(
        input: {timeframe: TODAY, blockchain: ALL, filter: {entityType: {_eq: USER}}}
      ) {
        FarcasterMoxieEarningStat {
          entityId
          entityType
          allEarningsAmount
          castEarningsAmount
          frameDevEarningsAmount
          otherEarningsAmount
          timeframe
          socials {
            profileName
            userId
            userAddress
          }
        }
      }
    }
  `;

  try {
    console.log('Fetching Moxie earning stats...');
    const response = await fetch('https://api.airstack.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIRSTACK_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('Airstack API errors:', result.errors);
      return null;
    }

    console.log('Moxie earning stats fetched successfully');
    return result.data.FarcasterMoxieEarningStats.FarcasterMoxieEarningStat;
  } catch (error) {
    console.error('Error fetching Moxie earning stats:', error);
    return null;
  }
}

// Initialize the Frog app
export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'Moxie Frame',
});

// First frame displaying 'MOXIE' with a button to proceed
app.frame('/', (c) => {
  return c.res({
    image: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#000000' }}>
        <h1 style={{ color: 'white', fontSize: '48px', fontWeight: 'bold' }}>MOXIE</h1>
      </div>
    ),
    intents: [<Button action="/moxie-stats">Check Moxie Stats</Button>],
  });
});

// Second frame displaying 'Moxie Earnings Results'
app.frame('/moxie-stats', async (c) => {
  console.log('Entering /moxie-stats frame');
  let content;
  try {
    const moxieEarnings = await fetchMoxieEarningStats();

    if (!moxieEarnings || moxieEarnings.length === 0) {
      console.log('No Moxie earnings data available');
      content = (
        <p style={{ color: 'white', fontSize: '24px' }}>No Moxie earnings data available at the moment.</p>
      );
    } else {
      console.log('Moxie earnings data received:', moxieEarnings);
      content = moxieEarnings.map((stat: any, index: number) => (
        <p key={index} style={{ color: 'white', fontSize: '20px', margin: '5px 0' }}>
          {`${stat.socials?.profileName || 'Unknown'} earned ${stat.allEarningsAmount || '0'} MOX`}
        </p>
      ));
    }
  } catch (error) {
    console.error('Error in /moxie-stats frame:', error);
    content = (
      <p style={{ color: 'white', fontSize: '24px' }}>Error fetching Moxie earnings data. Please try again.</p>
    );
  }

  console.log('Rendering /moxie-stats frame');
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', background: '#000000', padding: '20px' }}>
        <h1 style={{ color: 'white', fontSize: '36px', marginBottom: '20px' }}>Moxie Earnings</h1>
        <div style={{ overflowY: 'auto', maxHeight: '70%' }}>
          {content}
        </div>
      </div>
    ),
    intents: [<Button action="/">Back to Home</Button>],
  });
});

// Edge runtime configuration for Vercel
export const config = {
  runtime: 'edge',
};

// Environment detection for development vs. production
const isProduction = process.env.NODE_ENV === 'production';

// Setup devtools based on environment
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
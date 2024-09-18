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
    const response = await fetch('https://api.airstack.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIRSTACK_API_KEY}`,  // Use hardcoded API key
      },
      body: JSON.stringify({
        query,
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('Airstack API errors:', result.errors);
      return null;
    }

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
    intents: [<Button value="check_stats">Check Moxie Stats</Button>],
  });
});

// Second frame displaying 'Moxie Earnings Results'
app.frame('/moxie-stats', async (c) => {
  const moxieEarnings = await fetchMoxieEarningStats();

  if (!moxieEarnings) {
    return c.res({
      image: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#000000' }}>
          <h1 style={{ color: 'white', fontSize: '24px' }}>Unable to retrieve Moxie earnings data</h1>
        </div>
      ),
    });
  }

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#000000' }}>
        <h1 style={{ color: 'white', fontSize: '36px', marginBottom: '20px' }}>Moxie Results</h1>
        {moxieEarnings.map((stat: any, index: number) => (
          <p key={index} style={{ color: 'white', fontSize: '24px' }}>
            {`${stat.socials.profileName} earned ${stat.allEarningsAmount} MOX`}
          </p>
        ))}
      </div>
    ),
    intents: [<Button.Reset>Check Again</Button.Reset>],
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

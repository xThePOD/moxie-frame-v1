import 'dotenv/config';
import { Button, Frog } from 'frog';
import { handle } from 'frog/vercel';

// Create your Frog app
const app = new Frog({
  basePath: '/api',
  title: 'Moxie Frame',
});

// Home Frame
app.frame('/', (c) => {
  return c.res({
    image: 'https://amethyst-able-sawfish-36.mypinata.cloud/ipfs/QmSxprHHGYVX8rVYdcF7fu7LSB6TEkRRjhxq7AMRRWVYcu',
    intents: [<Button action="/check">Check Moxie Stats</Button>],
  });
});

// Stats Frame
app.frame('/check', (c) => {
  return c.res({
    image: (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#7b2cbf',
        color: 'white',
        padding: '20px',
      }}>
        <h1 style={{ fontSize: '51px', fontWeight: 'bold', marginBottom: '20px' }}>Your Moxie Stats</h1>
        <p style={{ fontSize: '39px', fontWeight: 'bold' }}>Today: 0.00 MOX</p>
        <p style={{ fontSize: '39px', fontWeight: 'bold' }}>Total: 0.00 MOX</p>
      </div>
    ),
    intents: [
      <Button action="/">Back to Home</Button>
    ]
  });
});

export const GET = handle(app);
export const POST = handle(app);

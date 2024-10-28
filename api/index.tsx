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
    image: 'https://amethyst-able-sawfish-36.mypinata.cloud/ipfs/QmcETgAvvydMDHJKpZxUW6ETcK6k7hQmHAq8fRLXLefwfo',
    intents: [
      <Button action="/">Back to Home</Button>
    ]
  });
});

export const GET = handle(app);
export const POST = handle(app);

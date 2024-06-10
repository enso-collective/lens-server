import bodyParser from 'body-parser';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/healthcheck', async (req, res) => {
  res.sendStatus(200);
});

app.post('/lens/notifications', async (req, res) => {
  const buffers = [];

  for await (const chunk of req) {
    buffers.push(chunk);
  }

  const data = Buffer.concat(buffers).toString();
  const payload = JSON.parse(data);

  if (payload.Type === 'Notification') {
    const message = JSON.parse(payload.Message);
    if (message.type === 'PROFILE_MENTIONED' && message.data.profileId.toLowerCase() === '0x020ce6') {
      console.log('sns message is a profile mention ' + message.data.profileId);

      const postData = { 
        key: '263a9791808ef5a263a9791808ef5a',
        publicationId: message.data.serverPubIdPointer,
        profileId: message.data.pubProfileIdPointed
      };

      await fetch('https://us-central1-enso-collective.cloudfunctions.net/lensWebhook', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      res.sendStatus(200);
      return;
    }
  }

  if (payload.Type === 'SubscriptionConfirmation') {
    const url = payload.SubscribeURL;
    const response = await fetch(url);
    if (response.status === 200) {
      console.log('Subscription confirmed');
      console.log('------------------------------------------------------');
      console.log('------------------------------------------------------');
      console.log('------------------------------------------------------');
      res.sendStatus(200);
      return;
    } else {
      console.error('Subscription failed');
      res.sendStatus(500);
      return;
    }
  }
});

app.post('/lens/notifications-test', async (req, res) => {
  const buffers = [];

  for await (const chunk of req) {
    buffers.push(chunk);
  }

  const data = Buffer.concat(buffers).toString();
  const payload = JSON.parse(data);

  if (payload.Type === 'Notification') {
    const message = JSON.parse(payload.Message);
    if (message.type === 'PROFILE_MENTIONED') {
      console.log('sns message is a profile mention ', message);
      console.log('------------------------------------------------------');
      console.log('------------------------------------------------------');
      console.log('------------------------------------------------------');
      res.sendStatus(200);
      return;
    }
  }

  if (payload.Type === 'SubscriptionConfirmation') {
    const url = payload.SubscribeURL;
    const response = await fetch(url);
    if (response.status === 200) {
      console.log('Subscription confirmed');
      console.log('------------------------------------------------------');
      console.log('------------------------------------------------------');
      console.log('------------------------------------------------------');
      res.sendStatus(200);
      return;
    } else {
      console.error('Subscription failed');
      res.sendStatus(500);
      return;
    }
  }

});

app.listen(port, () => console.log('Sns notification listening on port ' + port + '!'));
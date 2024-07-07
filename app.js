import bodyParser from 'body-parser';
import express from 'express';
import fetch from 'node-fetch';
import { CloudTasksClient } from '@google-cloud/tasks';

const client = new CloudTasksClient();

const app = express();
const port = 8080;

const project = 'enso-collective';
const queue = 'lensPost';
const location = 'us-central1';
const url = 'https://us-central1-enso-collective.cloudfunctions.net/lensWebhook';
const parent = client.queuePath(project, location, queue);

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

      const task = {
        httpRequest: {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          httpMethod: 'POST',
          body: Buffer.from(JSON.stringify(postData)).toString("base64"),
          url,
        },
        scheduleTime: {
          seconds: 0 + Date.now() / 1000
        }
      };

      const request = { parent: parent, task: task };
      try {
        await client.createTask(request);
      } catch(e) {
        console.log('Failed to create a task: ' + e);
      }

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
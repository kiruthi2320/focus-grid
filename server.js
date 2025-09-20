const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// CORS middleware handling preflight properly
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  next();
});

app.get('/', (req, res) => {
  res.send('Image Proxy Server is running');
});

app.get('/proxy/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const url = `https://archive.org/services/img/${identifier}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).send('Image not found or blocked');
    }

    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType);
    console.log(`Proxying ${url} with status ${response.status} and content-type ${contentType}`);

    response.body.pipe(res).on('error', err => {
      console.error('Stream error:', err);
      res.status(500).send('Stream error');
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).send('Request timeout');
    } else {
      console.error('Proxy error:', err);
      res.status(500).send('Server error');
    }
  }
});

app.listen(PORT, () => {
  console.log(`Image proxy server listening on port ${PORT}`);
});

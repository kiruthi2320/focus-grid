const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.get('/', (req, res) => {
  res.send('Image Proxy Server is running');
});

app.get('/proxy/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const iaImageUrl = `https://archive.org/services/img/${identifier}`;

  try {
    const response = await fetch(iaImageUrl);

    if (!response.ok) {
      return res.status(404).send('Image not found');
    }

    const contentType = response.headers.get('content-type');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', contentType);

    response.body.pipe(res);

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Image proxy server listening on port ${PORT}`);
});

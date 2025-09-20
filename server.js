const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

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

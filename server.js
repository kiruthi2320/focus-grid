const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Global CORS middleware handling OPTIONS preflight
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
  res.send('Proxy server for Internet Archive images and videos');
});

// Route for single identifier (images)
app.get('/proxy/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const url = `https://archive.org/services/img/${identifier}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(response.status).send('Image not found or blocked');
      return;
    }

    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType);

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

// Route for video or multiple segment file paths (only supports one segment folder + file)
app.get('/proxy/:folder/:filename', async (req, res) => {
  try {
    const { folder, filename } = req.params;
    const url = `https://archive.org/download/${folder}/${filename}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(response.status).send('File not found or blocked');
      return;
    }

    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType);

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
  console.log(`Proxy server listening on port ${PORT}`);
});

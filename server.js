const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Global CORS middleware including OPTIONS preflight handler
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

// Proxy route with named wildcard parameter supporting full file paths
app.get('/proxy/:path(*)', async (req, res) => {
  try {
    const archivePath = req.params.path;
    const isImage = !archivePath.includes('/');
    const baseUrl = isImage 
      ? 'https://archive.org/services/img/'
      : 'https://archive.org/download/';
    
    const url = baseUrl + archivePath;

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

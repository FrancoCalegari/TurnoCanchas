const express = require('express');
const router = express.Router();

router.get('/image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) {
            return res.status(400).send('URL is required');
        }

        // Validate that it's a spiderweb URL to prevent SSRF
        if (!imageUrl.startsWith('http://spiderwebargapi.com.ar/') && !imageUrl.startsWith('https://spiderwebargapi.com.ar/')) {
            return res.status(403).send('Invalid origin');
        }

        const fetchResponse = await fetch(imageUrl);
        
        if (!fetchResponse.ok) {
            return res.status(fetchResponse.status).send('Error fetching image');
        }

        // Copy headers like Content-Type
        fetchResponse.headers.forEach((val, key) => {
            // Do not copy restrictive headers like CORP or X-Frame-Options
            const lowerKey = key.toLowerCase();
            if (!['cross-origin-resource-policy', 'cross-origin-opener-policy', 'x-frame-options'].includes(lowerKey)) {
                res.setHeader(key, val);
            }
        });

        // Set permissive CORP header so the browser allows embedding it
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        
        // Stream the response body directly to the client
        const buffer = await fetchResponse.arrayBuffer();
        res.send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('[Proxy Error]', error);
        res.status(500).send('Error proxying image');
    }
});

module.exports = router;

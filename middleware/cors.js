const corsMiddleware = (req, res, next) => {
    const allowedOrigins = [
        'http://localhost:3000',
        'https://dataviz-platform.vercel.app'
    ];

    const origin = req.headers.origin;

    // Log the request origin for debugging
    console.log('Request origin:', origin);

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS, PUT, PATCH, DELETE'
    );

    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-Requested-With,content-type,Authorization'
    );

    res.setHeader('Access-Control-Allow-Credentials', true);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
};

module.exports = corsMiddleware;

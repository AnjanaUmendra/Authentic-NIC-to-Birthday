const jwt = require('jwt-simple');
const bearerToken = require('bearer-token');

// Export a middleware function that handles JWT token authentication
module.exports = function (req, res, next) {

    // Check if the URL contains '/api/v1/protected/'
    if (req.url.indexOf('/api/v1/protected/') < 0) {
        next();
    } else {
        try {
            // Use the 'bearer-token' module to extract the token from the request
            bearerToken(req, function (err, token) {

                if (err) {
                    res.status(500);
                    res.json({
                        "status": false,
                        "message": "Operation failed. please try again",
                        "error": err
                    });
                    return;
                } else {
                    try {
                         // Decode the JWT token using the provided secret key
                        const decoded = jwt.decode(token, process.env.AUTH_SECRET);
                        console.log(decoded)

                        // Check if the token has expired or haven't userId
                        if (decoded.exp <= Date.now() || !decoded.userId) {
                            res.status(500);
                            res.json({
                                "status": false,
                                "message": "Operation failed. please try again",
                                "error": err
                            });
                            return;
                        }
                        req.userId = decoded.userId;

                        // Continue to the next middleware
                        next();
                        console.error("111");
                    } catch (err) {

                        console.log('invalid_access_token');

                        res.status(500);
                        res.json({
                            "status": false,
                            "message": "Operation failed. please try again",
                            "error": err
                        });
                        console.error("222");
                        return;
                    }
                }
            });
            console.error("3333");
        } catch (err) {
            
            // Handle errors related to the request or empty headers
            console.log('empty_header');
            res.status(500);
            res.json({
                "status": false,
                "message": "Operation failed. please try again",
                "error": err
            });
            return;
        }
    }
};
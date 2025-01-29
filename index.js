const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();
const app = express();
app.use(cors());
app.use(cookieParser());

const ZOOM_OAUTH_URL = "https://zoom.us/oauth/authorize";
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_USER_URL = "https://api.zoom.us/v2/users/me";

// Redirect to Zoom Authorization Page
app.get("/auth/zoom", (req, res) => {
    const authUrl = `${ZOOM_OAUTH_URL}?response_type=code&client_id=${process.env.ZOOM_CLIENT_ID}&redirect_uri=${process.env.ZOOM_REDIRECT_URI}`;
    res.redirect(authUrl);
});

// Handle Zoom OAuth Callback
app.get("/oauth/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send("Authorization code missing!");

    try {
        const tokenResponse = await axios.post(
            ZOOM_TOKEN_URL,
            new URLSearchParams({
                code,
                grant_type: "authorization_code",
                redirect_uri: process.env.ZOOM_REDIRECT_URI
            }),
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(
                        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
                    ).toString("base64")}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            }
        );

        const { access_token } = tokenResponse.data;

        // Fetch user data from Zoom
        const userResponse = await axios.get(ZOOM_USER_URL, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        res.json(userResponse.data);
    } catch (error) {
        console.error(error);
        res.status(500).send("OAuth Error");
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

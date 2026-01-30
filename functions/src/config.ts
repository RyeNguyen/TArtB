// API Configuration
// Load environment variables from .env file (local development)
import * as dotenv from "dotenv";
dotenv.config();

export const config = {
  wikiart: {
    // eslint-disable-next-line no-undef
    accessCode: process.env.WIKIART_ACCESS_CODE || "",
    // eslint-disable-next-line no-undef
    secretCode: process.env.WIKIART_SECRET_CODE || "",
  },
};

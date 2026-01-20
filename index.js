import 'dotenv/config';
import express from "express";
import rateLimit from "express-rate-limit";
import { Resend } from "resend";

const app = express();

/* --------------------
   BODY PARSERS
   -------------------- */
app.use(express.json()); // Postman / fetch
app.use(express.urlencoded({ extended: true })); // iframe / form POST

/* --------------------
   RESEND
   -------------------- */
const resend = new Resend(process.env.RESEND_API_KEY);

/* --------------------
   CONFIG
   -------------------- */
const FROM_EMAIL = "Nivara Diamonds <care@nivaradiamonds.com>";
const SHARE_CART_KEY = "SHARE_CART_V1";

/* --------------------
   RATE LIMIT
   -------------------- */
app.use(
  "/share-cart",
  rateLimit({
    windowMs: 60 * 1000,
    max: 10
  })
);

/* --------------------
   HEALTH CHECK
   -------------------- */
app.get("/", (req, res) => {
  res.send("Share Cart API is running");
});

/* --------------------
   SHARE CART ENDPOINT
   -------------------- */
app.post("/share-cart", async (req, res) => {
  try {
    const {
      recipientEmail,
      senderName,
      senderEmail,
      message,
      cartUrl,
      key
    } = req.body;

    /* ---- TEMP KEY CHECK (plumbing safety) ---- */
    if (key !== SHARE_CART_KEY) {
      return res.status(403).json({ error: "Invalid request key" });
    }

    /* ---- VALIDATION ---- */
    if (!recipientEmail || !senderName || !senderEmail || !cartUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    /* ---- SEND EMAIL ---- */
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      replyTo: senderEmail,
      subject: `${senderName} shared a cart with you`,
      html: `
        <h2>${senderName} has shared their cart with you</h2>
        ${message ? `<p><strong>Message:</strong></p><p>${message}</p>` : ""}
        <p>
          <a href="${cartUrl}"
             style="display:inline-block;padding:12px 20px;
                    background:#000;color:#fff;text-decoration:none;">
            View Cart
          </a>
        </p>
        <p style="font-size:12px;color:#666;margin-top:20px">
          You received this email because someone shared their shopping cart from Nivara Diamonds.
        </p>
      `
    });

    console.log("✅ Resend message ID:", result.id);

    res.json({ success: true });

  } catch (err) {
    console.error("❌ EMAIL ERROR", err);
    res.status(500).json({ error: "Email send failed" });
  }
});

/* --------------------
   START SERVER
   -------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

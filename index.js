import 'dotenv/config';
import express from "express";
import rateLimit from "express-rate-limit";
import { Resend } from "resend";

const app = express();
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

// 🔒 Rate limit: 10 requests / minute / IP
app.use(
  "/share-cart",
  rateLimit({
    windowMs: 60 * 1000,
    max: 10
  })
);

// Health check (important for Render)
app.get("/", (req, res) => {
  res.send("Share Cart API is running");
});

app.post("/share-cart", async (req, res) => {
  try {
    const {
      recipientEmail,
      senderName,
      senderEmail,
      message,
      cartUrl
    } = req.body;

    // ---- Validation ----
    if (!recipientEmail || !senderName || !senderEmail || !cartUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ---- Send email ----
    await resend.emails.send({
      from: "onboarding@resend.dev", // OK for testing
      to: recipientEmail,
      replyTo: senderEmail,
      subject: `${senderName} shared a cart with you`,
      html: `
        <h2>${senderName} has shared their cart with you</h2>
        <p><strong>Message:</strong></p>
        <p>${message || ""}</p>
        <p>
          <a href="${cartUrl}"
             style="display:inline-block;padding:12px 20px;
                    background:#000;color:#fff;text-decoration:none;">
            View Cart
          </a>
        </p>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error("EMAIL ERROR", err);
    res.status(500).json({ error: "Email send failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

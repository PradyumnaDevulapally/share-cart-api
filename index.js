import 'dotenv/config';
import express from "express";
import rateLimit from "express-rate-limit";
import { Resend } from "resend";

const app = express();

/* 🔐 TRUST RENDER PROXY */
app.set("trust proxy", 1);

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

const { data, error } = await resend.emails.send({
  from: FROM_EMAIL,
  to: recipientEmail,
  replyTo: senderEmail,
  subject: `${senderName} shared a cart with you`,
html: `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0"
            style="max-width:560px;background:#ffffff;border-radius:6px;overflow:hidden;">

            <!-- BRAND HEADER -->
            <tr>
              <td style="padding:28px 32px;text-align:center;">
                <h1 style="margin:0;font-size:26px;letter-spacing:2px;color:#111;">
                  NIVARA
                </h1>
                <p style="margin:6px 0 0;font-size:12px;letter-spacing:1px;color:#777;">
                  DIAMONDS
                </p>
              </td>
            </tr>

            <!-- DIVIDER -->
            <tr>
              <td style="height:1px;background:#eee;"></td>
            </tr>

            <!-- MAIN MESSAGE -->
            <tr>
              <td style="padding:32px 36px;color:#333;font-size:14px;line-height:1.7;text-align:center;">
                <p style="margin-top:0;">
                  <strong>${senderName}</strong> has shared a bag with you from
                  <strong>Nivara Diamonds</strong>.
                </p>

                ${
                  message
                    ? `
                  <div style="
                    margin:24px 0;
                    padding:16px 18px;
                    background:#fafafa;
                    border:1px solid #eee;
                    border-radius:4px;
                    color:#555;
                    text-align:left;
                  ">
                    <strong style="display:block;margin-bottom:6px;">
                      Personal note from ${senderName}:
                    </strong>
                    ${message}
                  </div>
                `
                    : ""
                }

                <p style="margin:26px 0 34px;">
                  Click below to view the bag and explore the selected pieces.
                </p>

                <!-- CTA -->
                <a href="${cartUrl}"
                   style="
                     display:inline-block;
                     padding:14px 26px;
                     background:#b58b5c;
                     color:#ffffff;
                     text-decoration:none;
                     font-size:14px;
                     letter-spacing:0.5px;
                     border-radius:2px;
                   ">
                  View Shared Bag
                </a>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:22px 28px;background:#fafafa;color:#777;font-size:12px;line-height:1.5;text-align:center;">
                <p style="margin:0;">
                  You received this email because someone shared a shopping bag from
                  <strong>nivaradiamonds.com</strong>.
                </p>
                <p style="margin:8px 0 0;">
                  If this wasn’t intended for you, you may safely ignore this email.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

});

if (error) {
  console.error("❌ Resend error:", error);
  return res.status(500).json({ error: "Email send failed" });
}

console.log("📧 Resend message ID:", data.id);


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



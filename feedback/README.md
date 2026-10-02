# Avantis PC Assist - Feedback Web Page & Mailer

This folder contains the standalone, static feedback web page and PHP email handler for Avantis PC Assist.

## Files
- `index.html`: Modern, responsive HTML5 feedback interface matching Avantis brand styling and the Microsoft Bing-inspired layout.
- `styles.css`: Clean styles featuring Avantis teal (`#13A3AF`), smooth transitions, responsive card layout, and accessible states.
- `script.js`: Interactive client-side logic for real-time validation, character counting, category selection, and AJAX submission.
- `send_feedback.php`: Backend mail script that sanitizes user input, logs every response to `feedback_submissions.log`, and dispatches formatted HTML emails to **`jayden.mapasure@avantis.co.zw`**.
- `assets/`: Contains `avantis-logo.png` and `favicon.png`.

---

## How to Test Locally

If you have PHP installed:
1. Open a terminal in this folder:
   ```bash
   cd feedback
   php -S 127.0.0.1:8080
   ```
2. Open your browser to `http://127.0.0.1:8080`.
3. Submit a test feedback message. The submission will be logged to `feedback_submissions.log` and dispatched via PHP's `mail()` service.

---

## Deployment to Production (e.g., avantis.co.zw)

Upload this entire `feedback/` directory to your web server (e.g., cPanel `public_html/feedback` or Nginx/Apache document root).
Ensure PHP mail service or an SMTP relay (like SendGrid, Mailgun, or Postfix) is enabled on the server to send emails to `jayden.mapasure@avantis.co.zw`.

Once deployed, the live URL will be:
`https://avantis.co.zw/feedback/`

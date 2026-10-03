# PC Assist feedback page

A separate HTML/CSS/JavaScript form with a PHP submission handler. It is hosted independently from the desktop application.

## Files

- `index.html`: feedback form.
- `styles.css`: layout and brand styling.
- `script.js`: validation and submission.
- `send_feedback.php`: input handling, log writing, and email delivery.
- `assets/`: logo and favicon.

## Local preview

From this directory:

```bash
php -S 127.0.0.1:8080
```

Open http://127.0.0.1:8080. A PHP server previews the form and handler; successful email delivery additionally requires a configured mail transport.

## Hosting

Deploy the directory to a PHP-capable web server. Review the recipient address in `send_feedback.php`, configure server mail delivery, and give the handler an appropriate writable log location. Feedback submissions may contain personal information, so keep logs outside public file access and set a retention policy.

The desktop application's feedback navigation is currently disabled; deploying this page does not enable that integration.

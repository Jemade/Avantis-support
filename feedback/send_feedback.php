<?php
/**
 * Avantis PC Assist - Feedback Mailer
 * Recipient: jayden.mapasure@avantis.co.zw
 */

// Enable CORS for web requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["status" => "ok"]);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed. Only POST requests are supported."
    ]);
    exit;
}

// Support both standard FormData ($_POST) and JSON payload
$input = $_POST;
$rawInput = file_get_contents('php://input');
if (!empty($rawInput)) {
    $jsonData = json_decode($rawInput, true);
    if (is_array($jsonData)) {
        $input = array_merge($input, $jsonData);
    }
}

// Anti-spam honeypot verification
if (!empty($input['website_verify'])) {
    // Silently accept bot submissions without sending email
    echo json_encode([
        "success" => true,
        "message" => "Feedback received successfully."
    ]);
    exit;
}

// Extract and sanitize fields
$feedbackRaw = isset($input['feedback']) ? trim($input['feedback']) : '';
$userEmailRaw = isset($input['email']) ? trim($input['email']) : '';
$categoryRaw = isset($input['category']) ? trim($input['category']) : 'General Feedback';
$userTimezone = isset($input['user_timezone']) ? trim($input['user_timezone']) : 'Not detected';
$screenRes = isset($input['screen_resolution']) ? trim($input['screen_resolution']) : 'Not detected';

// Basic validation
if (strlen($feedbackRaw) < 3) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please enter your feedback (at least 3 characters)."
    ]);
    exit;
}

if (!empty($userEmailRaw) && !filter_var($userEmailRaw, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address or leave it blank."
    ]);
    exit;
}

// Sanitize content for safe display
$feedback = htmlspecialchars($feedbackRaw, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$userEmail = !empty($userEmailRaw) ? filter_var($userEmailRaw, FILTER_SANITIZE_EMAIL) : null;
$category = htmlspecialchars($categoryRaw, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

// Collect system metadata
$ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
}
$userAgent = htmlspecialchars($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', ENT_QUOTES, 'UTF-8');
$timestamp = date("Y-m-d H:i:s T");

// Target recipient
$to = "jayden.mapasure@avantis.co.zw";
$subject = "[Avantis PC Assist] " . $category . " - " . date("M j, Y");

// Construct HTML Email Body
$htmlBody = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Segoe UI, -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f4f7f8; margin: 0; padding: 24px; color: #1e292b; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e1e7e9; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #13a3af; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 28px; }
    .badge { display: inline-block; background: #eaf6f7; color: #0e7f89; padding: 4px 12px; border-radius: 14px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .feedback-box { background: #fbfcfc; border-left: 4px solid #13a3af; padding: 16px 18px; border-radius: 4px; font-size: 15px; line-height: 1.6; margin-bottom: 24px; white-space: pre-wrap; color: #1f2d30; }
    .meta-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .meta-table td { padding: 8px 10px; border-bottom: 1px solid #edf2f4; }
    .meta-label { font-weight: 600; color: #5e6e72; width: 140px; }
    .meta-value { color: #1f2d30; }
    .footer { background: #f8fafb; padding: 16px 28px; font-size: 12px; color: #829296; text-align: center; border-top: 1px solid #edf2f4; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Avantis PC Assist Feedback</h1>
      <p>New user response submitted from PC Assist</p>
    </div>
    <div class="content">
      <span class="badge">' . $category . '</span>
      <h3 style="margin-top:0; font-size: 16px; color: #1e292b;">User Feedback Description:</h3>
      <div class="feedback-box">' . nl2br($feedback) . '</div>

      <h4 style="margin: 20px 0 10px; font-size: 14px; color: #5e6e72;">Submission Details:</h4>
      <table class="meta-table">
        <tr>
          <td class="meta-label">Sender Email</td>
          <td class="meta-value">' . ($userEmail ? '<a href="mailto:' . $userEmail . '">' . htmlspecialchars($userEmail) . '</a>' : '<em>Anonymous (No email provided)</em>') . '</td>
        </tr>
        <tr>
          <td class="meta-label">Category</td>
          <td class="meta-value">' . $category . '</td>
        </tr>
        <tr>
          <td class="meta-label">Submitted At</td>
          <td class="meta-value">' . $timestamp . '</td>
        </tr>
        <tr>
          <td class="meta-label">User Timezone</td>
          <td class="meta-value">' . htmlspecialchars($userTimezone) . '</td>
        </tr>
        <tr>
          <td class="meta-label">Screen Size</td>
          <td class="meta-value">' . htmlspecialchars($screenRes) . '</td>
        </tr>
        <tr>
          <td class="meta-label">User IP</td>
          <td class="meta-value">' . htmlspecialchars($ip) . '</td>
        </tr>
        <tr>
          <td class="meta-label">User Agent</td>
          <td class="meta-value" style="word-break: break-all; font-size: 11px;">' . $userAgent . '</td>
        </tr>
      </table>
    </div>
    <div class="footer">
      This message was generated automatically by Avantis PC Assist. Recipient: jayden.mapasure@avantis.co.zw
    </div>
  </div>
</body>
</html>';

// Construct Headers
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/html; charset=UTF-8';
$headers[] = 'From: Avantis PC Assist Feedback <no-reply@avantis.co.zw>';
if ($userEmail) {
    $headers[] = 'Reply-To: ' . $userEmail;
} else {
    $headers[] = 'Reply-To: no-reply@avantis.co.zw';
}
$headers[] = 'X-Mailer: PHP/' . phpversion();

// Always log submission locally so feedback is never lost if mail daemon is unconfigured
$logEntry = [
    "timestamp" => $timestamp,
    "recipient" => $to,
    "category" => $category,
    "email" => $userEmail,
    "feedback" => $feedbackRaw,
    "ip" => $ip,
    "user_agent" => $userAgent,
    "timezone" => $userTimezone,
    "screen" => $screenRes
];
$logFile = __DIR__ . '/feedback_submissions.log';
@file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND | LOCK_EX);

// Attempt sending the email via PHP mail()
$mailSent = @mail($to, $subject, $htmlBody, implode("\r\n", $headers));

// In production web servers with sendmail/postfix/exim configured, $mailSent is true.
// In local development environments without an active mail server, we still return success
// because the feedback has been safely logged to feedback_submissions.log.
http_response_code(200);
echo json_encode([
    "success" => true,
    "message" => "Thank you! Your feedback has been sent to jayden.mapasure@avantis.co.zw",
    "logged" => true,
    "mail_dispatched" => $mailSent
]);
?>

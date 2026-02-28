<?php

namespace Omekan\Service;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    private $mailer;
    private $templates;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);
        $this->setupMailer();
        $this->loadTemplates();
    }

    private function setupMailer()
    {
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->Host = $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com';
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = $_ENV['MAIL_USERNAME'] ?? '';
            $this->mailer->Password = $_ENV['MAIL_PASSWORD'] ?? '';
            $this->mailer->SMTPSecure = $_ENV['MAIL_ENCRYPTION'] ?? PHPMailer::ENCRYPTION_STARTTLS;
            $this->mailer->Port = $_ENV['MAIL_PORT'] ?? 587;

            // Default sender
            $this->mailer->setFrom(
                $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@omekan.com',
                $_ENV['MAIL_FROM_NAME'] ?? 'Omekan Platform'
            );

            // Enable HTML
            $this->mailer->isHTML(true);
            
            // Character set
            $this->mailer->CharSet = 'UTF-8';

        } catch (Exception $e) {
            error_log("Email configuration error: " . $e->getMessage());
        }
    }

    private function loadTemplates()
    {
        // Load email templates from database
        try {
            $db = \Omekan\Database\Connection::getInstance();
            $stmt = $db->prepare("SELECT * FROM email_templates WHERE is_active = 1");
            $stmt->execute();
            
            $this->templates = [];
            while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                $this->templates[$row['name']] = $row;
            }
        } catch (\Exception $e) {
            error_log("Error loading email templates: " . $e->getMessage());
            $this->templates = [];
        }
    }

    public function sendWelcomeEmail($userEmail, $userName)
    {
        $template = $this->templates['welcome'] ?? null;
        if (!$template) {
            return false;
        }

        $variables = [
            'name' => $userName,
            'email' => $userEmail,
            'site_url' => $_ENV['APP_URL'] ?? 'http://localhost',
            'login_url' => ($_ENV['APP_URL'] ?? 'http://localhost') . '/frontend/events.html'
        ];

        return $this->sendTemplatedEmail($userEmail, $template, $variables);
    }

    public function sendEventReminder($userEmail, $userName, $event)
    {
        $template = $this->templates['event_reminder'] ?? null;
        if (!$template) {
            return false;
        }

        $eventDate = new \DateTime($event['start_datetime']);
        
        $variables = [
            'name' => $userName,
            'event_title' => $event['title'],
            'event_date' => $eventDate->format('d.m.Y'),
            'event_time' => $eventDate->format('H:i'),
            'location' => $event['location_name'] ?? 'TBA',
            'event_url' => ($_ENV['APP_URL'] ?? 'http://localhost') . '/frontend/event-detail.html?slug=' . $event['slug']
        ];

        return $this->sendTemplatedEmail($userEmail, $template, $variables);
    }

    public function sendPasswordReset($userEmail, $userName, $resetToken)
    {
        $template = $this->templates['password_reset'] ?? null;
        if (!$template) {
            return false;
        }

        $variables = [
            'name' => $userName,
            'reset_url' => ($_ENV['APP_URL'] ?? 'http://localhost') . '/frontend/reset-password.html?token=' . $resetToken
        ];

        return $this->sendTemplatedEmail($userEmail, $template, $variables);
    }

    public function sendCustomEmail($to, $subject, $htmlBody, $textBody = null)
    {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($to);
            
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $htmlBody;
            $this->mailer->AltBody = $textBody ?? strip_tags($htmlBody);

            $result = $this->mailer->send();
            
            // Log email sent
            $this->logEmailSent($to, $subject, $result);
            
            return $result;
            
        } catch (Exception $e) {
            error_log("Email send error: " . $e->getMessage());
            return false;
        }
    }

    private function sendTemplatedEmail($to, $template, $variables)
    {
        $subject = $this->replaceVariables($template['subject'], $variables);
        $htmlBody = $this->replaceVariables($template['body_html'], $variables);
        $textBody = $this->replaceVariables($template['body_text'], $variables);

        return $this->sendCustomEmail($to, $subject, $htmlBody, $textBody);
    }

    private function replaceVariables($content, $variables)
    {
        foreach ($variables as $key => $value) {
            $content = str_replace("{{$key}}", $value, $content);
        }
        return $content;
    }

    private function logEmailSent($to, $subject, $success)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            $stmt = $db->prepare("
                INSERT INTO email_logs (recipient, subject, status, sent_at) 
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$to, $subject, $success ? 'sent' : 'failed']);
        } catch (\Exception $e) {
            error_log("Error logging email: " . $e->getMessage());
        }
    }

    // Bulk email sending
    public function sendBulkEmail($recipients, $subject, $htmlBody, $textBody = null)
    {
        $results = [];
        
        foreach ($recipients as $recipient) {
            $email = is_array($recipient) ? $recipient['email'] : $recipient;
            $name = is_array($recipient) ? $recipient['name'] : '';
            
            try {
                $this->mailer->clearAddresses();
                $this->mailer->addAddress($email, $name);
                
                $this->mailer->Subject = $subject;
                $this->mailer->Body = $htmlBody;
                $this->mailer->AltBody = $textBody ?? strip_tags($htmlBody);

                $success = $this->mailer->send();
                $results[$email] = $success;
                
                // Small delay to avoid overwhelming SMTP server
                usleep(100000); // 0.1 second
                
            } catch (Exception $e) {
                error_log("Bulk email error for {$email}: " . $e->getMessage());
                $results[$email] = false;
            }
        }
        
        return $results;
    }

    // Newsletter functionality
    public function sendNewsletter($subject, $content, $segment = 'all')
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            // Get recipients based on segment
            $sql = "SELECT email, name FROM users WHERE is_active = 1";
            
            if ($segment === 'marketing_enabled') {
                $sql .= " AND id IN (SELECT user_id FROM notification_preferences WHERE marketing_emails = 1)";
            }
            
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $recipients = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            return $this->sendBulkEmail($recipients, $subject, $content);
            
        } catch (\Exception $e) {
            error_log("Newsletter send error: " . $e->getMessage());
            return false;
        }
    }

    // Event notification system
    public function sendEventNotifications($eventId, $notificationType = 'reminder')
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            // Get event details
            $eventStmt = $db->prepare("
                SELECT e.*, et.title, et.description, et.location_name, eo.start_datetime
                FROM events e
                LEFT JOIN event_translations et ON e.id = et.event_id AND et.language = 'de'
                LEFT JOIN event_occurrences eo ON e.id = eo.event_id
                WHERE e.id = ?
            ");
            $eventStmt->execute([$eventId]);
            $event = $eventStmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$event) {
                return false;
            }
            
            // Get users who favorited this event
            $usersStmt = $db->prepare("
                SELECT u.email, u.name 
                FROM users u
                INNER JOIN user_favorites uf ON u.id = uf.user_id
                INNER JOIN notification_preferences np ON u.id = np.user_id
                WHERE uf.event_id = ? AND np.event_reminders = 1 AND u.is_active = 1
            ");
            $usersStmt->execute([$eventId]);
            $users = $usersStmt->fetchAll(\PDO::FETCH_ASSOC);
            
            $results = [];
            foreach ($users as $user) {
                $success = $this->sendEventReminder($user['email'], $user['name'], $event);
                $results[$user['email']] = $success;
            }
            
            return $results;
            
        } catch (\Exception $e) {
            error_log("Event notification error: " . $e->getMessage());
            return false;
        }
    }

    // Queue system for better performance
    public function queueEmail($to, $subject, $htmlBody, $textBody = null, $priority = 'normal')
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            $stmt = $db->prepare("
                INSERT INTO email_queue (recipient, subject, html_body, text_body, priority, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending', NOW())
            ");
            
            return $stmt->execute([$to, $subject, $htmlBody, $textBody, $priority]);
            
        } catch (\Exception $e) {
            error_log("Email queue error: " . $e->getMessage());
            return false;
        }
    }

    public function processEmailQueue($limit = 10)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            // Get pending emails
            $stmt = $db->prepare("
                SELECT * FROM email_queue 
                WHERE status = 'pending' 
                ORDER BY priority DESC, created_at ASC 
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            $emails = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            foreach ($emails as $email) {
                // Mark as processing
                $updateStmt = $db->prepare("UPDATE email_queue SET status = 'processing' WHERE id = ?");
                $updateStmt->execute([$email['id']]);
                
                // Send email
                $success = $this->sendCustomEmail(
                    $email['recipient'],
                    $email['subject'],
                    $email['html_body'],
                    $email['text_body']
                );
                
                // Update status
                $status = $success ? 'sent' : 'failed';
                $updateStmt = $db->prepare("
                    UPDATE email_queue 
                    SET status = ?, processed_at = NOW(), attempts = attempts + 1 
                    WHERE id = ?
                ");
                $updateStmt->execute([$status, $email['id']]);
                
                // Small delay
                usleep(200000); // 0.2 seconds
            }
            
            return count($emails);
            
        } catch (\Exception $e) {
            error_log("Email queue processing error: " . $e->getMessage());
            return 0;
        }
    }
}

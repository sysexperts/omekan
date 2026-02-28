<?php

namespace Omekan\Service;

class NotificationService
{
    private $emailService;
    private $pushService;

    public function __construct()
    {
        $this->emailService = new EmailService();
        $this->pushService = new PushNotificationService();
    }

    public function sendEventReminders()
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            // Get events starting in 24 hours
            $stmt = $db->prepare("
                SELECT e.id, e.slug, et.title, et.location_name, eo.start_datetime
                FROM events e
                LEFT JOIN event_translations et ON e.id = et.event_id AND et.language = 'de'
                LEFT JOIN event_occurrences eo ON e.id = eo.event_id
                WHERE eo.start_datetime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
                AND e.id NOT IN (
                    SELECT event_id FROM event_notifications 
                    WHERE notification_type = 'reminder' 
                    AND sent_at > DATE_SUB(NOW(), INTERVAL 23 HOUR)
                )
            ");
            $stmt->execute();
            $events = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $results = [];
            foreach ($events as $event) {
                // Send email reminders
                $emailResults = $this->emailService->sendEventNotifications($event['id'], 'reminder');
                
                // Send push notifications
                $pushResults = $this->pushService->sendEventReminder($event);
                
                $results[$event['id']] = [
                    'email' => $emailResults,
                    'push' => $pushResults
                ];
                
                // Mark as sent
                $this->markNotificationSent($event['id'], 'reminder');
            }
            
            return $results;
            
        } catch (\Exception $e) {
            error_log("Event reminder error: " . $e->getMessage());
            return false;
        }
    }

    public function sendNewEventNotification($eventId)
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

            // Get users interested in this event's communities/categories
            $usersStmt = $db->prepare("
                SELECT DISTINCT u.email, u.name, u.id
                FROM users u
                INNER JOIN notification_preferences np ON u.id = np.user_id
                WHERE np.push_notifications = 1 
                AND u.is_active = 1
                AND (
                    u.id IN (
                        SELECT DISTINCT uf.user_id 
                        FROM user_favorites uf
                        INNER JOIN event_communities ec1 ON uf.event_id = ec1.event_id
                        INNER JOIN event_communities ec2 ON ec1.community_id = ec2.community_id
                        WHERE ec2.event_id = ?
                    )
                    OR u.id IN (
                        SELECT DISTINCT uf.user_id 
                        FROM user_favorites uf
                        INNER JOIN event_categories ecat1 ON uf.event_id = ecat1.event_id
                        INNER JOIN event_categories ecat2 ON ecat1.category_id = ecat2.category_id
                        WHERE ecat2.event_id = ?
                    )
                )
            ");
            $usersStmt->execute([$eventId, $eventId]);
            $users = $usersStmt->fetchAll(\PDO::FETCH_ASSOC);

            // Send push notifications
            $pushResults = $this->pushService->sendNewEventNotification($event, $users);
            
            // Send email notifications (optional, based on user preferences)
            $emailResults = [];
            foreach ($users as $user) {
                if ($this->shouldSendEmailNotification($user['id'], 'new_event')) {
                    $success = $this->sendNewEventEmail($user['email'], $user['name'], $event);
                    $emailResults[$user['email']] = $success;
                }
            }
            
            return [
                'push' => $pushResults,
                'email' => $emailResults
            ];
            
        } catch (\Exception $e) {
            error_log("New event notification error: " . $e->getMessage());
            return false;
        }
    }

    private function sendNewEventEmail($userEmail, $userName, $event)
    {
        $eventDate = new \DateTime($event['start_datetime']);
        
        $subject = "Neues Event: " . $event['title'];
        $htmlBody = "
            <h1>Neues Event verfügbar!</h1>
            <h2>{$event['title']}</h2>
            <p><strong>Datum:</strong> {$eventDate->format('d.m.Y')} um {$eventDate->format('H:i')}</p>
            <p><strong>Ort:</strong> {$event['location_name']}</p>
            <p>{$event['description']}</p>
            <a href=\"" . ($_ENV['APP_URL'] ?? 'http://localhost') . "/frontend/event-detail.html?slug={$event['slug']}\" 
               style=\"background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;\">
                Event ansehen
            </a>
        ";
        
        return $this->emailService->sendCustomEmail($userEmail, $subject, $htmlBody);
    }

    private function shouldSendEmailNotification($userId, $type)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            $stmt = $db->prepare("
                SELECT email_notifications 
                FROM notification_preferences 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $prefs = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            return $prefs && $prefs['email_notifications'];
            
        } catch (\Exception $e) {
            return false;
        }
    }

    private function markNotificationSent($eventId, $type)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            $stmt = $db->prepare("
                INSERT INTO event_notifications (event_id, notification_type, sent_at)
                VALUES (?, ?, NOW())
                ON DUPLICATE KEY UPDATE sent_at = NOW()
            ");
            $stmt->execute([$eventId, $type]);
        } catch (\Exception $e) {
            error_log("Error marking notification sent: " . $e->getMessage());
        }
    }

    // In-app notifications
    public function createInAppNotification($userId, $title, $message, $type = 'info', $actionUrl = null)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            $stmt = $db->prepare("
                INSERT INTO in_app_notifications (user_id, title, message, type, action_url, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            
            return $stmt->execute([$userId, $title, $message, $type, $actionUrl]);
            
        } catch (\Exception $e) {
            error_log("In-app notification error: " . $e->getMessage());
            return false;
        }
    }

    public function getUserNotifications($userId, $limit = 20, $unreadOnly = false)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            $sql = "
                SELECT * FROM in_app_notifications 
                WHERE user_id = ?
            ";
            
            if ($unreadOnly) {
                $sql .= " AND read_at IS NULL";
            }
            
            $sql .= " ORDER BY created_at DESC LIMIT ?";
            
            $stmt = $db->prepare($sql);
            $stmt->execute([$userId, $limit]);
            
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
        } catch (\Exception $e) {
            error_log("Get notifications error: " . $e->getMessage());
            return [];
        }
    }

    public function markNotificationRead($notificationId, $userId)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            $stmt = $db->prepare("
                UPDATE in_app_notifications 
                SET read_at = NOW() 
                WHERE id = ? AND user_id = ?
            ");
            
            return $stmt->execute([$notificationId, $userId]);
            
        } catch (\Exception $e) {
            error_log("Mark notification read error: " . $e->getMessage());
            return false;
        }
    }

    // Notification preferences management
    public function updateNotificationPreferences($userId, $preferences)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            $stmt = $db->prepare("
                INSERT INTO notification_preferences 
                (user_id, email_notifications, push_notifications, event_reminders, marketing_emails)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                email_notifications = VALUES(email_notifications),
                push_notifications = VALUES(push_notifications),
                event_reminders = VALUES(event_reminders),
                marketing_emails = VALUES(marketing_emails),
                updated_at = NOW()
            ");
            
            return $stmt->execute([
                $userId,
                $preferences['email_notifications'] ?? true,
                $preferences['push_notifications'] ?? true,
                $preferences['event_reminders'] ?? true,
                $preferences['marketing_emails'] ?? false
            ]);
            
        } catch (\Exception $e) {
            error_log("Update notification preferences error: " . $e->getMessage());
            return false;
        }
    }
}

// Push Notification Service
class PushNotificationService
{
    private $vapidPublicKey;
    private $vapidPrivateKey;
    private $vapidSubject;

    public function __construct()
    {
        $this->vapidPublicKey = $_ENV['VAPID_PUBLIC_KEY'] ?? '';
        $this->vapidPrivateKey = $_ENV['VAPID_PRIVATE_KEY'] ?? '';
        $this->vapidSubject = $_ENV['VAPID_SUBJECT'] ?? 'mailto:admin@omekan.com';
    }

    public function sendEventReminder($event)
    {
        $payload = [
            'title' => 'Event Erinnerung',
            'body' => $event['title'] . ' startet bald!',
            'icon' => '/frontend/images/icon-192.png',
            'badge' => '/frontend/images/badge-72.png',
            'data' => [
                'url' => '/frontend/event-detail.html?slug=' . $event['slug'],
                'eventId' => $event['id']
            ],
            'actions' => [
                [
                    'action' => 'view',
                    'title' => 'Event ansehen'
                ],
                [
                    'action' => 'dismiss',
                    'title' => 'Schließen'
                ]
            ]
        ];

        return $this->sendToEventSubscribers($event['id'], $payload);
    }

    public function sendNewEventNotification($event, $users)
    {
        $payload = [
            'title' => 'Neues Event verfügbar!',
            'body' => $event['title'],
            'icon' => '/frontend/images/icon-192.png',
            'badge' => '/frontend/images/badge-72.png',
            'data' => [
                'url' => '/frontend/event-detail.html?slug=' . $event['slug'],
                'eventId' => $event['id']
            ]
        ];

        $results = [];
        foreach ($users as $user) {
            $result = $this->sendToUser($user['id'], $payload);
            $results[$user['id']] = $result;
        }

        return $results;
    }

    private function sendToEventSubscribers($eventId, $payload)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            // Get subscribers for this event
            $stmt = $db->prepare("
                SELECT ps.* FROM push_subscriptions ps
                INNER JOIN user_favorites uf ON ps.user_id = uf.user_id
                WHERE uf.event_id = ? AND ps.is_active = 1
            ");
            $stmt->execute([$eventId]);
            $subscriptions = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $results = [];
            foreach ($subscriptions as $subscription) {
                $result = $this->sendPushNotification($subscription, $payload);
                $results[$subscription['id']] = $result;
            }

            return $results;
            
        } catch (\Exception $e) {
            error_log("Push notification error: " . $e->getMessage());
            return false;
        }
    }

    private function sendToUser($userId, $payload)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            $stmt = $db->prepare("
                SELECT * FROM push_subscriptions 
                WHERE user_id = ? AND is_active = 1
            ");
            $stmt->execute([$userId]);
            $subscriptions = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $results = [];
            foreach ($subscriptions as $subscription) {
                $result = $this->sendPushNotification($subscription, $payload);
                $results[$subscription['id']] = $result;
            }

            return $results;
            
        } catch (\Exception $e) {
            error_log("Send to user error: " . $e->getMessage());
            return false;
        }
    }

    private function sendPushNotification($subscription, $payload)
    {
        // Mock implementation - would use web-push library in production
        try {
            $endpoint = $subscription['endpoint'];
            $p256dh = $subscription['p256dh_key'];
            $auth = $subscription['auth_key'];
            
            // Log the notification (in production, send actual push)
            error_log("Push notification sent to: " . substr($endpoint, 0, 50) . "...");
            error_log("Payload: " . json_encode($payload));
            
            return true;
            
        } catch (\Exception $e) {
            error_log("Push send error: " . $e->getMessage());
            return false;
        }
    }

    public function subscribeUser($userId, $subscription)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            $stmt = $db->prepare("
                INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, user_agent)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                p256dh_key = VALUES(p256dh_key),
                auth_key = VALUES(auth_key),
                is_active = TRUE,
                updated_at = NOW()
            ");
            
            return $stmt->execute([
                $userId,
                $subscription['endpoint'],
                $subscription['keys']['p256dh'],
                $subscription['keys']['auth'],
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
            
        } catch (\Exception $e) {
            error_log("Push subscription error: " . $e->getMessage());
            return false;
        }
    }

    public function unsubscribeUser($userId, $endpoint = null)
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            if ($endpoint) {
                $stmt = $db->prepare("
                    UPDATE push_subscriptions 
                    SET is_active = FALSE 
                    WHERE user_id = ? AND endpoint = ?
                ");
                return $stmt->execute([$userId, $endpoint]);
            } else {
                $stmt = $db->prepare("
                    UPDATE push_subscriptions 
                    SET is_active = FALSE 
                    WHERE user_id = ?
                ");
                return $stmt->execute([$userId]);
            }
            
        } catch (\Exception $e) {
            error_log("Push unsubscribe error: " . $e->getMessage());
            return false;
        }
    }

    // Broadcast notifications to all users
    public function broadcastNotification($title, $body, $url = null, $segment = 'all')
    {
        try {
            $db = \Omekan\Database\Connection::getInstance();
            
            $sql = "SELECT ps.* FROM push_subscriptions ps INNER JOIN users u ON ps.user_id = u.id WHERE ps.is_active = 1 AND u.is_active = 1";
            
            if ($segment === 'premium') {
                $sql .= " AND u.role IN ('admin', 'premium')";
            } elseif ($segment === 'admin') {
                $sql .= " AND u.role = 'admin'";
            }
            
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $subscriptions = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $payload = [
                'title' => $title,
                'body' => $body,
                'icon' => '/frontend/images/icon-192.png',
                'badge' => '/frontend/images/badge-72.png',
                'data' => ['url' => $url ?? '/frontend/events.html']
            ];

            $results = [];
            $successCount = 0;
            
            foreach ($subscriptions as $subscription) {
                $result = $this->sendPushNotification($subscription, $payload);
                $results[$subscription['id']] = $result;
                if ($result) $successCount++;
            }

            return [
                'total_sent' => count($subscriptions),
                'successful' => $successCount,
                'failed' => count($subscriptions) - $successCount,
                'results' => $results
            ];
            
        } catch (\Exception $e) {
            error_log("Broadcast notification error: " . $e->getMessage());
            return false;
        }
    }
}

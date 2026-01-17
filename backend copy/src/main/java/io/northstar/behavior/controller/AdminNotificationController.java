package io.northstar.behavior.controller;

import io.northstar.behavior.dto.AdminNotificationDTO;
import io.northstar.behavior.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admins/{adminId}/notifications")
public class AdminNotificationController {

    private final NotificationService notifications;

    public AdminNotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }


    @GetMapping("/unread")
    public List<AdminNotificationDTO> unread(@PathVariable Long adminId) {
        return notifications.unreadForAdmin(adminId);
    }


    @PostMapping("/{notificationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@PathVariable Long adminId,
                         @PathVariable Long notificationId) {
        notifications.markAsRead(adminId, notificationId);
    }
}
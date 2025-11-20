package io.northstar.behavior.service;

import io.northstar.behavior.dto.AdminNotificationDTO;
import io.northstar.behavior.model.Incident;

import java.util.List;

public interface NotificationService {
    void evaluateEscalationsForIncident(Incident incident);
    List<AdminNotificationDTO> unreadForAdmin(Long adminId);
    void markAsRead(Long adminId, Long notificationId);
}
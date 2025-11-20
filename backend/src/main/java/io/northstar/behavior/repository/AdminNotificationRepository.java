package io.northstar.behavior.repository;

import io.northstar.behavior.model.AdminNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminNotificationRepository extends JpaRepository<AdminNotification, Long> {

    List<AdminNotification> findByAdminIdAndReadFalseOrderByCreatedAtDesc(Long adminId);

    List<AdminNotification> findByAdminIdOrderByCreatedAtDesc(Long adminId);
}
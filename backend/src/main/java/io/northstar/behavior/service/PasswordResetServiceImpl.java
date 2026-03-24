package io.northstar.behavior.service;

import io.northstar.behavior.model.Admin;
import io.northstar.behavior.model.PasswordResetToken;
import io.northstar.behavior.model.Teacher;
import io.northstar.behavior.repository.AdminRepository;
import io.northstar.behavior.repository.PasswordResetTokenRepository;
import io.northstar.behavior.repository.TeacherRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    private final AdminRepository adminRepo;
    private final TeacherRepository teacherRepo;
    private final PasswordResetTokenRepository tokenRepo;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.reset-token.expiry-minutes:60}")
    private int expiryMinutes;

    @Value("${app.reset-token.base-url:http://localhost:5173}")
    private String baseUrl;

    @Value("${spring.mail.username:noreply@northstar.app}")
    private String fromAddress;

    public PasswordResetServiceImpl(AdminRepository adminRepo,
                                    TeacherRepository teacherRepo,
                                    PasswordResetTokenRepository tokenRepo,
                                    PasswordEncoder passwordEncoder,
                                    JavaMailSender mailSender) {
        this.adminRepo = adminRepo;
        this.teacherRepo = teacherRepo;
        this.tokenRepo = tokenRepo;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    @Override
    @Transactional
    public void initiateForgotPassword(String email) {
        String userType;
        String username;

        Optional<Admin> adminOpt = adminRepo.findByEmail(email);
        if (adminOpt.isPresent()) {
            userType = "Admin";
            username = adminOpt.get().getUserName();
        } else {
            Optional<Teacher> teacherOpt = teacherRepo.findByEmail(email);
            if (teacherOpt.isPresent()) {
                userType = "Teacher";
                username = teacherOpt.get().getUserName();
            } else {
                // Never reveal whether the email is registered
                return;
            }
        }

        tokenRepo.invalidatePreviousTokens(username, userType);

        String uuid = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(expiryMinutes);
        PasswordResetToken resetToken = new PasswordResetToken(uuid, userType, username, expiry);
        tokenRepo.save(resetToken);

        String resetLink = baseUrl + "/reset-password?token=" + uuid;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(email);
        message.setSubject("NorthStar — Reset your password");
        message.setText(
                "Hello,\n\n" +
                "You requested a password reset for your NorthStar account.\n\n" +
                "Click the link below to set a new password (expires in " + expiryMinutes + " minutes):\n\n" +
                resetLink + "\n\n" +
                "If you did not request this, you can safely ignore this email.\n\n" +
                "— The NorthStar Team"
        );
        mailSender.send(message);
    }

    @Override
    @Transactional
    public boolean resetPassword(String token, String newPassword) {
        Optional<PasswordResetToken> opt = tokenRepo.findByToken(token);
        if (opt.isEmpty()) return false;

        PasswordResetToken resetToken = opt.get();
        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }

        String encoded = passwordEncoder.encode(newPassword);

        if ("Admin".equals(resetToken.getUserType())) {
            Optional<Admin> adminOpt = adminRepo.findByUserName(resetToken.getUsername());
            if (adminOpt.isEmpty()) return false;
            Admin admin = adminOpt.get();
            admin.setPasswordHash(encoded);
            admin.setMustChangePassword(false);
            adminRepo.save(admin);
        } else {
            Optional<Teacher> teacherOpt = teacherRepo.findByUserName(resetToken.getUsername());
            if (teacherOpt.isEmpty()) return false;
            Teacher teacher = teacherOpt.get();
            teacher.setPasswordHash(encoded);
            teacher.setMustChangePassword(false);
            teacherRepo.save(teacher);
        }

        resetToken.setUsed(true);
        tokenRepo.save(resetToken);
        return true;
    }
}

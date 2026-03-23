package io.northstar.behavior.service;

public interface PasswordResetService {
    void initiateForgotPassword(String email);
    boolean resetPassword(String token, String newPassword);
}

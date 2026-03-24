package io.northstar.behavior.dto;

public record ResetPasswordRequest(String token, String newPassword) {}

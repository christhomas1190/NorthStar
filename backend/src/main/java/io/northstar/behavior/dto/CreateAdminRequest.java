package io.northstar.behavior.dto;


public record CreateAdminRequest(
        String firstName,
        String lastName,
        String email
) {}



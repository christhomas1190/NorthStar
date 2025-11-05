// src/main/java/io/northstar/behavior/tenant/TenantFilter.java
package io.northstar.behavior.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(1) // run early
public class TenantFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-District-Id";
    private static final String QUERY  = "districtId";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Skip preflight and infra paths
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        return path.startsWith("/actuator")
                || path.startsWith("/h2-console")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/error")
                || path.equals("/favicon.ico");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try {
            Long districtId = resolveDistrictId(request);
            if (districtId != null) {
                TenantContext.setDistrictId(districtId);
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private Long resolveDistrictId(HttpServletRequest request) {
        // Prefer header
        String fromHeader = request.getHeader(HEADER);
        if (fromHeader != null && !fromHeader.isBlank()) {
            try {
                return Long.parseLong(fromHeader.trim());
            } catch (NumberFormatException ignored) {}
        }
        // Fallback to query param for local testing
        String fromQuery = request.getParameter(QUERY);
        if (fromQuery != null && !fromQuery.isBlank()) {
            try {
                return Long.parseLong(fromQuery.trim());
            } catch (NumberFormatException ignored) {}
        }
        return null; // none provided
    }
}

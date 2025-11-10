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
@Order(1)
public class TenantFilter extends OncePerRequestFilter {

    private static final String H_DISTRICT = "X-District-Id";
    private static final String Q_DISTRICT = "districtId";
    private static final String H_SCHOOL   = "X-School-Id";
    private static final String Q_SCHOOL   = "schoolId";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String p = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        return p.startsWith("/actuator")
                || p.startsWith("/h2-console")
                || p.startsWith("/swagger-ui")
                || p.startsWith("/v3/api-docs")
                || p.startsWith("/error")
                || "/favicon.ico".equals(p);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        try {
            Long districtId = resolveLong(req.getHeader(H_DISTRICT), req.getParameter(Q_DISTRICT));
            Long schoolId   = resolveLong(req.getHeader(H_SCHOOL),   req.getParameter(Q_SCHOOL));

            if (districtId != null) TenantContext.setDistrictId(districtId);
            if (schoolId   != null) TenantContext.setSchoolId(schoolId); // no-op if you haven't added this

            chain.doFilter(req, res);
        } finally {
            TenantContext.clear();
        }
    }

    private Long resolveLong(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            try { return Long.parseLong(primary.trim()); } catch (NumberFormatException ignored) {}
        }
        if (fallback != null && !fallback.isBlank()) {
            try { return Long.parseLong(fallback.trim()); } catch (NumberFormatException ignored) {}
        }
        return null;
    }
}

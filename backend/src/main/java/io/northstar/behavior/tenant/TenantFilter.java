package io.northstar.behavior.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Reads the current tenant (district) from the request and stores it in TenantContext.
 * - Primary: "X-District-Id" header (e.g., X-District-Id: 1)
 * - Fallback: "districtId" query parameter (e.g., ?districtId=1)
 *
 * NOTE: In production, you should set this from the authenticated user/JWT claim
 *       rather than letting clients provide it.
 */
@Component
@Order(1) // run early
public class TenantFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-District-Id";
    private static final String QUERY  = "districtId";

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
            // Always clear to avoid leaking between requests/threads
            TenantContext.clear();
        }
    }

    private Long resolveDistrictId(HttpServletRequest request) {
        // 1) Prefer header
        String fromHeader = request.getHeader(HEADER);
        if (fromHeader != null && !fromHeader.isBlank()) {
            try {
                return Long.parseLong(fromHeader.trim());
            } catch (NumberFormatException ignored) {}
        }

        // 2) Fallback to query param for easy local testing
        String fromQuery = request.getParameter(QUERY);
        if (fromQuery != null && !fromQuery.isBlank()) {
            try {
                return Long.parseLong(fromQuery.trim());
            } catch (NumberFormatException ignored) {}
        }

        return null; // no tenant provided
    }
}

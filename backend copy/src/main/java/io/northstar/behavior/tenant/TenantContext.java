package io.northstar.behavior.tenant;

/**
 * Simple thread-local context holder for multi-tenant (multi-district) data isolation.
 *
 * During each request, we store the current district’s ID here.
 * Controllers, filters, and services can then call TenantContext.getDistrictId()
 * to restrict queries and writes to that district.
 *
 * Later, you can replace this with a JWT or Spring Security authentication resolver.
 */
public final class TenantContext {

    // ThreadLocal ensures isolation between concurrent HTTP requests
    private static final ThreadLocal<Long> CURRENT_DISTRICT = new ThreadLocal<>();

    private TenantContext() {
        // utility class — no instances
    }

    /** Set the current district ID for this request thread. */
    public static void setDistrictId(Long districtId) {
        CURRENT_DISTRICT.set(districtId);
    }

    /** Retrieve the current district ID for this request thread. */
    public static Long getDistrictId() {
        return CURRENT_DISTRICT.get();
    }

    /** Clear the district ID after the request is complete. */
    public static void clear() {
        CURRENT_DISTRICT.remove();
    }
}

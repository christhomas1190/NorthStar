package io.northstar.behavior.tenant;

import java.util.Optional;

public final class TenantContext {
    private static final ThreadLocal<Long> CURRENT_DISTRICT = new ThreadLocal<>();
    private static final ThreadLocal<Long> CURRENT_SCHOOL = new ThreadLocal<>();

    private TenantContext() {}

    public static void setDistrictId(Long districtId) {
        CURRENT_DISTRICT.set(districtId);
    }

    public static Long getDistrictId() {
        return CURRENT_DISTRICT.get();
    }

    public static void setSchoolId(Long schoolId) {
        CURRENT_SCHOOL.set(schoolId);
    }

    public static Optional<Long> getSchoolId() {
        return Optional.ofNullable(CURRENT_SCHOOL.get());
    }

    public static void clear() {
        CURRENT_DISTRICT.remove();
        CURRENT_SCHOOL.remove();
    }
}

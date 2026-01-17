package io.northstar.behavior.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity // keep if you'll use @PreAuthorize etc.
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {}) // picks up CorsConfigurationSource from WebCorsConfig
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/h2-console/**",
                                "/actuator/**",
                                "/error",
                                "/favicon.ico"
                        ).permitAll()
                        .anyRequest().permitAll()
                )
                .headers(h -> h.frameOptions(frame -> frame.sameOrigin())); // H2 console

        return http.build();
    }
}

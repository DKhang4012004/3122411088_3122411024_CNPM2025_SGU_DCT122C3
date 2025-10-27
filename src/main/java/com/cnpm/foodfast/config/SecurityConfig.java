package com.cnpm.foodfast.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; // Import này rất quan trọng

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // 💡 Thêm JwtAuthenticationFilter vào đây
    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - completely bypass security
                        .requestMatchers("/home/auth/**").permitAll()
                        .requestMatchers("/home/products/**").permitAll()
                        .requestMatchers("/home/category/**").permitAll()
                        .requestMatchers("/home/stores/**").permitAll()
                        .requestMatchers("/home/storesaddresses/**").permitAll()
                        .requestMatchers("/home/users/userCreated").permitAll()
                        .requestMatchers("/home/cart/**").permitAll() // For testing cart endpoints

                        // Admin only endpoints
                        .requestMatchers("/users/getAllUser").hasRole("ADMIN")
                        .requestMatchers("/users/deleteUser/**").hasRole("ADMIN")

                        // Authenticated user endpoints
                        .requestMatchers("/users/**").authenticated()

                        // All other requests are permitted for now
                        .anyRequest().permitAll()
                )
                // 🎯 Bổ sung dòng này để đăng ký JWT Filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
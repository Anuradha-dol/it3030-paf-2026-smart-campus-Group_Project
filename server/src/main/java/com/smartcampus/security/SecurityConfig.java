package com.smartcampus.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JWTAuthFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2UserService oAuth2UserService;
    private final HttpCookieOAuth2AuthorizationRequestRepository oAuth2AuthorizationRequestRepository;

    @Value("${app.frontend.login-url:http://localhost:5173/login}")
    private String loginRedirectUrl;

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            OAuth2AuthorizationRequestResolver oauth2AuthorizationRequestResolver
    ) throws Exception {

        http
                // Allow local frontend origins and credentials.
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration crf = new CorsConfiguration();
                    crf.setAllowedOriginPatterns(List.of("http://localhost:*"));
                    crf.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                    crf.setAllowedHeaders(List.of("*"));
                    crf.setAllowCredentials(true);
                    return crf;
                }))
                .csrf(AbstractHttpConfigurer::disable)

                .authorizeHttpRequests(auth -> auth
                        // Allow browser preflight requests.
                        .requestMatchers(request -> CorsUtils.isPreFlightRequest(request)).permitAll()

                        // Protect authenticated session endpoints.
                        .requestMatchers("/auth/me", "/auth/logout").authenticated()
                        // Keep auth and oauth entry points public.
                        .requestMatchers(
                                "/auth/**",
                                "/forgotpass/**",
                                "/oauth2/**",
                                "/login/**"
                        ).permitAll()

                        .anyRequest().authenticated()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write("{\"message\":\"Unauthorized\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(403);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write("{\"message\":\"Forbidden\"}");
                        })
                )

                .authenticationProvider(authenticationProvider)

                // Resolve JWT before username/password auth.
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                // Configure OAuth2 login and redirects.
                .oauth2Login(oauth -> oauth
                        .authorizationEndpoint(authorization -> authorization
                                .authorizationRequestResolver(oauth2AuthorizationRequestResolver)
                                .authorizationRequestRepository(oAuth2AuthorizationRequestRepository)
                        )
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(oAuth2UserService)
                        )
                        .failureHandler((request, response, exception) -> {
                            // Convert OAuth2 errors to frontend query param.
                            log.error("OAuth2 login failed", exception);

                            String message = "Google login failed. Please try again.";
                            if (exception instanceof OAuth2AuthenticationException oauth2Ex
                                    && oauth2Ex.getError() != null
                                    && "authorization_request_not_found".equals(oauth2Ex.getError().getErrorCode())) {
                                message = "Google login session expired. Please click Login with Google again.";
                            }

                            String errorMessage = URLEncoder.encode(
                                    message,
                                    StandardCharsets.UTF_8
                            );
                            response.sendRedirect(loginRedirectUrl + "?oauthError=" + errorMessage);
                        })
                        .successHandler(oAuth2SuccessHandler)
                );

        return http.build();
    }

    @Bean
    public OAuth2AuthorizationRequestResolver oauth2AuthorizationRequestResolver(
            ClientRegistrationRepository clientRegistrationRepository
    ) {
        // Resolve /oauth2/authorization/{provider} calls.
        DefaultOAuth2AuthorizationRequestResolver resolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository,
                        "/oauth2/authorization"
                );

        // Ask provider to show account chooser every time.
        resolver.setAuthorizationRequestCustomizer(customizer ->
                customizer.additionalParameters(params ->
                        params.put("prompt", "select_account")
                )
        );

        return resolver;
    }
}

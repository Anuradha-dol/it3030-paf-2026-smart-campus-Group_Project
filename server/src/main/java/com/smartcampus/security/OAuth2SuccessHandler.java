package com.smartcampus.security;

import com.smartcampus.enums.AuthProvider;
import com.smartcampus.enums.Role;
import com.smartcampus.enums.Token;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepo;
import com.smartcampus.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private static final Pattern SLIIT_EMAIL_PATTERN =
            Pattern.compile("^IT\\d+@my\\.sliit\\.lk$", Pattern.CASE_INSENSITIVE);
    private static final String SLIIT_EMAIL_ONLY_MESSAGE =
            "Only SLIIT email is allowed (example: IT23687882@my.sliit.lk).";
    private static final int NAME_MAX_LENGTH = 100;
    private static final int PROVIDER_ID_MAX_LENGTH = 100;

    private final UserRepo userRepo;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.frontend.login-url:http://localhost:5173/login}")
    private String loginRedirectUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        try {
            // OAuth profile from provider.
            OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

            // Normalize provider attributes.
            String email = normalizeEmail(oauthUser.getAttribute("email"));
            String name = oauthUser.getAttribute("name");
            String providerId = normalizeProviderId(oauthUser.getAttribute("sub"));

            if (!StringUtils.hasText(email)) {
                log.warn("Blocked OAuth2 login because provider email is missing");
                rejectOAuthLogin(response, SLIIT_EMAIL_ONLY_MESSAGE);
                return;
            }
            if (!isAllowedSliitEmail(email)) {
                log.warn("Blocked OAuth2 login for non-SLIIT email: {}", email);
                rejectOAuthLogin(response, SLIIT_EMAIL_ONLY_MESSAGE);
                return;
            }

            // Create new OAuth user or reuse existing account.
            User existingUser = userRepo.findByEmailIgnoreCase(email).orElse(null);
            boolean newUser = existingUser == null;
            User user = newUser ? createOAuthUser(email, name, providerId) : existingUser;
            normalizeUserForOAuthLogin(user, name, providerId);

            Map<String, Object> claims = new HashMap<>();
            claims.put("email", user.getEmail());
            claims.put("role", user.getRole().name());

            // Rotate auth cookies for this login.
            jwtUtils.removeToken(response, Token.ACCESS);
            jwtUtils.removeToken(response, Token.REFRESH);

            jwtUtils.generateToken(claims, user, response, Token.ACCESS);
            String refreshToken = jwtUtils.generateToken(claims, user, response, Token.REFRESH);

            user.setRefreshToken(refreshToken);
            userRepo.save(user);

            String redirectPath = resolveRedirectPath(user, newUser);
            log.info("OAuth2 login success for {} (newUser={}, role={})", user.getEmail(), newUser, user.getRole());
            response.sendRedirect(buildFrontendUrl(redirectPath));
        } catch (Exception ex) {
            log.error("OAuth2 login success handler failed", ex);
            // Clear cookies on OAuth2 failure.
            jwtUtils.removeToken(response, Token.ACCESS);
            jwtUtils.removeToken(response, Token.REFRESH);
            String errorMessage = URLEncoder.encode(
                    "Google login failed. Please try again.",
                    StandardCharsets.UTF_8
            );
            response.sendRedirect(loginRedirectUrl + "?oauthError=" + errorMessage);
        }
    }

    private User createOAuthUser(String email, String name, String providerId) {
        User user = new User();
        user.setEmail(email);
        user.setFirstname(safeName(name, "GoogleUser"));
        user.setLastName("");
        user.setRole(Role.USER);
        user.setIsVerified(true);
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setProvider(AuthProvider.GOOGLE);
        user.setProviderId(normalizeProviderId(providerId));
        return userRepo.save(user);
    }

    private void normalizeUserForOAuthLogin(User user, String name, String providerId) {
        if (!StringUtils.hasText(user.getFirstname())) {
            user.setFirstname(safeName(name, "GoogleUser"));
        } else {
            user.setFirstname(safeName(user.getFirstname(), "GoogleUser"));
        }

        if (user.getLastName() == null) {
            user.setLastName("");
        } else if (user.getLastName().length() > NAME_MAX_LENGTH) {
            user.setLastName(user.getLastName().substring(0, NAME_MAX_LENGTH));
        }

        if (!StringUtils.hasText(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        }

        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }

        if (user.getProvider() == null) {
            user.setProvider(AuthProvider.GOOGLE);
            user.setProviderId(normalizeProviderId(providerId));
        }

        if (user.getProvider() == AuthProvider.GOOGLE
                && !StringUtils.hasText(user.getProviderId())
                && StringUtils.hasText(providerId)) {
            user.setProviderId(normalizeProviderId(providerId));
        }

        if (user.getIsVerified() == null || !user.getIsVerified()) {
            user.setIsVerified(true);
        }
    }

    private boolean isAllowedSliitEmail(String email) {
        return StringUtils.hasText(email)
                && SLIIT_EMAIL_PATTERN.matcher(email).matches();
    }

    private void rejectOAuthLogin(HttpServletResponse response, String message) throws IOException {
        // Clear auth cookies to prevent partial login state.
        jwtUtils.removeToken(response, Token.ACCESS);
        jwtUtils.removeToken(response, Token.REFRESH);

        String errorMessage = URLEncoder.encode(message, StandardCharsets.UTF_8);
        response.sendRedirect(loginRedirectUrl + "?oauthError=" + errorMessage);
    }

    private String normalizeEmail(Object emailAttribute) {
        if (emailAttribute == null) {
            return null;
        }

        String value = String.valueOf(emailAttribute).trim();
        if (value.isEmpty()) {
            return null;
        }

        return value.toLowerCase(Locale.ROOT);
    }

    private String normalizeProviderId(Object providerIdAttr) {
        if (providerIdAttr == null) {
            return null;
        }
        String value = String.valueOf(providerIdAttr).trim();
        if (value.isEmpty()) {
            return null;
        }
        return value.length() <= PROVIDER_ID_MAX_LENGTH
                ? value
                : value.substring(0, PROVIDER_ID_MAX_LENGTH);
    }

    private String safeName(String value, String fallback) {
        String candidate = StringUtils.hasText(value) ? value.trim() : fallback;
        if (!StringUtils.hasText(candidate)) {
            candidate = fallback;
        }
        return candidate.length() <= NAME_MAX_LENGTH
                ? candidate
                : candidate.substring(0, NAME_MAX_LENGTH);
    }

    private String resolveRedirectPath(User user, boolean newUser) {
        if (newUser) {
            return "/home";
        }

        if (user.getRole() == Role.ADMIN) {
            return "/dashboard";
        }

        if (user.getRole() == Role.TECHNICIAN) {
            return "/techhome";
        }

        return "/home";
    }

    private String buildFrontendUrl(String path) {
        String base = StringUtils.hasText(frontendBaseUrl) ? frontendBaseUrl.trim() : "http://localhost:5173";
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }

        if (!StringUtils.hasText(path)) {
            return base;
        }

        if (path.startsWith("/")) {
            return base + path;
        }

        return base + "/" + path;
    }
}


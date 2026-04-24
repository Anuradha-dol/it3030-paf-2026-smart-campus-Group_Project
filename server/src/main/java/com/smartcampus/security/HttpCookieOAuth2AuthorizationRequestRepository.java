package com.smartcampus.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.Base64;
import java.util.Optional;

@Component
@Slf4j
@SuppressWarnings("DuplicatedCode")
public class HttpCookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    private static final String OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "OAUTH2_AUTH_REQUEST";
    private static final int COOKIE_EXPIRE_SECONDS = 180;

    @Value("${spring.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${spring.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return getCookieValue(request, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME)
                .map(this::deserialize)
                .orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(
            OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (authorizationRequest == null) {
            removeAuthorizationRequest(request, response);
            return;
        }

        String serializedRequest = serialize(authorizationRequest);
        if (serializedRequest == null) {
            removeAuthorizationRequest(request, response);
            return;
        }

        addCookie(response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, serializedRequest, COOKIE_EXPIRE_SECONDS);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        OAuth2AuthorizationRequest authRequest = loadAuthorizationRequest(request);
        removeCookie(response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
        return authRequest;
    }

    private Optional<String> getCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) {
            return Optional.empty();
        }

        String latestValue = null;
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())
                    && cookie.getValue() != null
                    && !cookie.getValue().isBlank()) {
                latestValue = cookie.getValue();
            }
        }

        return Optional.ofNullable(latestValue);
    }

    private String serialize(OAuth2AuthorizationRequest authorizationRequest) {
        try {
            byte[] serialized = toBytes(authorizationRequest);
            if (serialized == null || serialized.length == 0) {
                return null;
            }
            return Base64.getUrlEncoder().encodeToString(serialized);
        } catch (Exception ex) {
            log.warn("Failed to serialize OAuth2 authorization request: {}", ex.getMessage());
            return null;
        }
    }

    private OAuth2AuthorizationRequest deserialize(String cookieValue) {
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(cookieValue);
            Object object = fromBytes(decoded);
            if (object instanceof OAuth2AuthorizationRequest request) {
                return request;
            }
            return null;
        } catch (Exception ex) {
            log.warn("Failed to deserialize OAuth2 authorization request cookie: {}", ex.getMessage());
            return null;
        }
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite(resolveSameSite())
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void removeCookie(HttpServletResponse response, String name) {
        addCookie(response, name, "", 0);
    }

    private String resolveSameSite() {
        if (cookieSameSite == null || cookieSameSite.isBlank()) {
            return "Lax";
        }

        String normalized = cookieSameSite.trim().toLowerCase();

        if (!cookieSecure && "none".equals(normalized)) {
            return "Lax";
        }

        return switch (normalized) {
            case "strict" -> "Strict";
            case "none" -> "None";
            default -> "Lax";
        };
    }

    private byte[] toBytes(Object value) throws IOException {
        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
             ObjectOutputStream objectOutputStream = new ObjectOutputStream(byteArrayOutputStream)) {
            objectOutputStream.writeObject(value);
            objectOutputStream.flush();
            return byteArrayOutputStream.toByteArray();
        }
    }

    private Object fromBytes(byte[] value) throws IOException, ClassNotFoundException {
        try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(value);
             ObjectInputStream objectInputStream = new ObjectInputStream(byteArrayInputStream)) {
            return objectInputStream.readObject();
        }
    }
}

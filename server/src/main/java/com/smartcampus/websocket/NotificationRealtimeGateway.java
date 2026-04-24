package com.smartcampus.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.dto.NotificationResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Collections;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationRealtimeGateway {

    private final ObjectMapper objectMapper;

    private final ConcurrentHashMap<String, Set<WebSocketSession>> sessionsByUser = new ConcurrentHashMap<>();

    public void registerSession(String username, WebSocketSession session) {
        String key = normalizeUsername(username);
        if (key == null || session == null) {
            return;
        }

        sessionsByUser.computeIfAbsent(
                key,
                ignored -> Collections.newSetFromMap(new ConcurrentHashMap<>())
        ).add(session);
    }

    public void unregisterSession(String username, WebSocketSession session) {
        String key = normalizeUsername(username);
        if (key == null || session == null) {
            return;
        }

        Set<WebSocketSession> sessions = sessionsByUser.get(key);
        if (sessions == null) {
            return;
        }

        sessions.remove(session);
        if (sessions.isEmpty()) {
            sessionsByUser.remove(key);
        }
    }

    public void pushToUser(String username, NotificationResponseDTO payload) {
        String key = normalizeUsername(username);
        if (key == null || payload == null) {
            return;
        }

        Set<WebSocketSession> sessions = sessionsByUser.get(key);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        String jsonMessage = toJson(payload);
        if (jsonMessage == null) {
            return;
        }

        for (WebSocketSession session : sessions) {
            if (session == null || !session.isOpen()) {
                unregisterSession(username, session);
                continue;
            }

            try {
                session.sendMessage(new TextMessage(jsonMessage));
            } catch (IOException ex) {
                log.warn("Failed to push real-time notification to session {}: {}", session.getId(), ex.getMessage());
                unregisterSession(username, session);
                closeQuietly(session);
            }
        }
    }

    private String normalizeUsername(String username) {
        if (username == null) {
            return null;
        }

        String value = username.trim();
        if (value.isBlank()) {
            return null;
        }
        return value.toLowerCase(Locale.ROOT);
    }

    private String toJson(NotificationResponseDTO payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            log.warn("Failed to serialize notification payload: {}", ex.getMessage());
            return null;
        }
    }

    private void closeQuietly(WebSocketSession session) {
        if (session == null) {
            return;
        }
        try {
            session.close();
        } catch (IOException ignored) {
            // Ignore close errors.
        }
    }
}

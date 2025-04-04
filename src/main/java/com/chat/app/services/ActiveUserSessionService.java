package com.chat.app.services;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

// This service manages the list of active user sessions
@Service
public class ActiveUserSessionService {
    private final Map<String, String> activeSessions = new ConcurrentHashMap<>();

    public void addSession(String sessionId, String username) {
        activeSessions.put(sessionId, username);
    }

    public void removeSession(String sessionId) {
        activeSessions.remove(sessionId);
    }

    public Collection<String> getActiveUsers() {
        return activeSessions.values();
    }

    public Map<String, String> getActiveSessions() {
        return activeSessions;
    }


}

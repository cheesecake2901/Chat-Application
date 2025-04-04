package com.chat.app.listener;

import com.chat.app.services.ActiveUserSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;


// Handles WebSocket events such as connection and disconnection. This is where we manage the active user sessions and add them to the ActiveUserSessionService.
@Component
public class WebSocketEventListener {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);
    private final ActiveUserSessionService activeUserSessionService;

    public WebSocketEventListener(ActiveUserSessionService activeUserSessionService) {
        this.activeUserSessionService = activeUserSessionService;
    }


    // Listens to the WebSocket connection event and adds the user session to the active sessions. This is not entirely trivial as we use a STOMP socket, which masks some of the usual websocket features we would use to do this.
    // It seems the native headers (the "username" in our case) are no longer available when the connect event is fired.
    // Instead we use the CustomChannelInterceptor to grab the CONNECT message, extract the username and explicitly store it in the session attributes.
    // Since the session attributes of the original CONNECT message are not available in the SessionConnectedEvent (it wraps the original message in a CONNECT_ACK message), we extract it from there.
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        // Get the original CONNECT message
        Message<?> connectMessage = (Message<?>) headerAccessor.getHeader("simpConnectMessage");
        if (connectMessage != null) {
            StompHeaderAccessor connectAccessor = StompHeaderAccessor.wrap(connectMessage);
            Map<String, Object> sessionAttributes = connectAccessor.getSessionAttributes();
            String username = null;
            // Extract the username from the session attributes
            if (sessionAttributes != null) {
                username = (String) sessionAttributes.get("username");
            }
            String sessionId = headerAccessor.getSessionId();

            // Add the session ID and username to the ActiveUserSessionService
            if (username != null && sessionId != null) {
                activeUserSessionService.addSession(sessionId, username);
                logger.info("User connected: " + username + " with session ID: " + sessionId);
            } else {
                logger.warn("Session ID or username is null");
            }

        } else {
            logger.warn("Original connect message not found");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        activeUserSessionService.removeSession(sessionId);
        logger.info("User disconnected with session ID: " + sessionId);
    }
}

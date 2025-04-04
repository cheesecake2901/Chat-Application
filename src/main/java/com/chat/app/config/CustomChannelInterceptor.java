package com.chat.app.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;


// Intercepts the CONNECT message from out STOMP socket and adds the username to the session attributes.
public class CustomChannelInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(CustomChannelInterceptor.class);

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String username = accessor.getFirstNativeHeader("username");
            // Set the user in the accessor so it's available throughout the session.
            logger.info("User connected via Interceptor: " + username);
            accessor.getSessionAttributes().put("username", username);

            //accessor.setUser(new UsernamePasswordAuthenticationToken(username, null));
        }
        return message;
    }
}

package com.chat.app.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;


public class ChatWebSocketHandler extends TextWebSocketHandler {


    private static final Logger logger = LoggerFactory.getLogger(ChatWebSocketHandler.class);


    private final Set<WebSocketSession> sessions = ConcurrentHashMap.<WebSocketSession>newKeySet();
    private final Set<String> users = ConcurrentHashMap.<String>newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        logger.info("Added Session " + session.getId());


        //Wir schreiben den username in die URI der session rein, und retrieven den username wenn wir die connection establishen.
        String username = "";
        if(session.getUri() != null){
            String query = session.getUri().getQuery();
            if(query.startsWith("username=")){
                username = query.substring("username=".length());
            }
        }
        session.getAttributes().put("username", username);
        logger.info("Added Session " + session.getId() + " with username " + username);
        users.add(username);
        logger.info("Active users: " + users);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String username = "";
        username = (String) session.getAttributes().get("username");
        users.remove(username);
        logger.info("Removed Session " + session.getId() + " with username " + username);
        logger.info("Active users: " + users);
        sessions.remove(session);
        logger.info("Removed Session " + session.getId());
    }

    public Set<WebSocketSession> getSessions(){
        return sessions;
    }
}

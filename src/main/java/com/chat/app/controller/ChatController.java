package com.chat.app.controller;

import com.chat.app.model.Message;
import com.chat.app.services.ActiveUserSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.HashSet;
import java.util.Set;


@Controller
public class ChatController {


    @Autowired
    private ActiveUserSessionService activeUserSessionService;

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/sendMessage")
    public void sendMessage(Message message){
        logger.info("Message received: " + message);
        logger.info("Sending message to: " + message.getRecipientName());
        messagingTemplate.convertAndSendToUser(message.getRecipientName(), "/queue/messages", message);
        logger.info("Sending message to: " + message.getSenderName());
        messagingTemplate.convertAndSendToUser(message.getSenderName(), "/queue/messages", message);
    }

    @MessageMapping("/sendGroupchat")
    @SendTo("/groupchat")
    public Message sendGroupchatMessage(Message message){
        logger.info("Sending Groupchat");
        return message;
    }



    @GetMapping("/chat")
    public String chat(){
        return "chat1";
    }

    @GetMapping("/activeUsers")
    public ResponseEntity<Set<String>> getActiveUsers(){
        return ResponseEntity.ok(new HashSet<>(activeUserSessionService.getActiveUsers()));
    }

}

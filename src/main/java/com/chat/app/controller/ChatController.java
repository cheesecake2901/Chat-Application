package com.chat.app.controller;

import com.chat.app.model.Message;
import com.chat.app.services.ActiveUserSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.HashSet;
import java.util.Set;


@Controller
public class ChatController {


    @Autowired
    private ActiveUserSessionService activeUserSessionService;

    @MessageMapping("/sendMessage")
    @SendTo("/topic/messages")
    public Message sendMessage(Message message){
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

package com.chat.app.controller;

import com.chat.app.handler.ChatWebSocketHandler;
import com.chat.app.model.Message;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;


@Controller
public class ChatController {

    private final ChatWebSocketHandler chatWebSocketHandler;

    public ChatController(ChatWebSocketHandler chatWebSocketHandler) {
        this.chatWebSocketHandler = chatWebSocketHandler;
    }


    @MessageMapping("/sendMessage")
    @SendTo("/topic/messages")
    public Message sendMessage(Message message){
        return message;
    }

    @GetMapping("/chat")
    public String chat(){
        return "chat1";
    }




    @GetMapping("/session")
    public ResponseEntity<Integer> getActiveSessionCount(){
        return ResponseEntity.ok(chatWebSocketHandler.getSessions().size());
    }

    @GetMapping("/activeUsers")
    public ResponseEntity<Set<String>> getActiveUsers(){
        return ResponseEntity.ok(chatWebSocketHandler.getActiveUsers());
    }

}

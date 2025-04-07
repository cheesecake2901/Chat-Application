package com.chat.app.model;


import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
@Getter
public class Message {
    private Long id;
    private String senderName;
    private String recipientName;
    private String content;
}

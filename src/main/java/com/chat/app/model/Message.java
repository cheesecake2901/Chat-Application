package com.chat.app.model;


import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class Message {
    private Long id;
    private String SenderName;
    private String Message;
}

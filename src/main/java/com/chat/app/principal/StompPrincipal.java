package com.chat.app.principal;

import java.security.Principal;
import java.util.logging.Logger;

public class StompPrincipal implements Principal {
    public final String name;

    private static final Logger logger = Logger.getLogger(StompPrincipal.class.getName());

    public StompPrincipal(String name) {
        this.name = name;
        logger.info("StompPrincipal user created with name: " + name);
    }

    @Override
    public String getName() {
        return name;
    }
}

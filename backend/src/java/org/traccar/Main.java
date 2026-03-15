package org.traccar;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.traccar.config.Config;

public class Main {

    private static final Logger LOGGER = LoggerFactory.getLogger(Main.class);

    public static void main(String[] args) {
        try {
            Config config = new Config();
            Context.init(config);
        } catch (Exception e) {
            LOGGER.error("Startup failed", e);
            System.exit(1);
        }
    }
}

// Minimal Context class for demonstration
class Context {
    public static void init(Config config) throws Exception {
        // Initialization logic
    }
}

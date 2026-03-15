package org.traccar.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.traccar.model.Position;

import jakarta.websocket.Session;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

public class ConnectionManager {

    private static final Logger LOGGER = LoggerFactory.getLogger(ConnectionManager.class);
    private final ObjectMapper json = new ObjectMapper();
    private final Set<jakarta.websocket.Session> sessions = new CopyOnWriteArraySet<>();

    public void addSession(jakarta.websocket.Session session) {
        sessions.add(session);
    }

    public void removeSession(jakarta.websocket.Session session) {
        sessions.remove(session);
    }

    public void broadcast(Position position) {
        for (jakarta.websocket.Session session : sessions) {
            try {
                session.getBasicRemote().sendText(json.writeValueAsString(position));
            } catch (Exception e) {
                LOGGER.warn("WebSocket error", e);
            }
        }
    }
}

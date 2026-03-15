package org.traccar.websocket;

import jakarta.websocket.*;
import jakarta.websocket.CloseReason;
import jakarta.websocket.server.ServerEndpoint;
import org.traccar.security.TokenManager;
import java.io.IOException;

@ServerEndpoint("/api/socket")
public class TrackerSocket {

    private final ConnectionManager connectionManager;

    public TrackerSocket() {
        this.connectionManager = new ConnectionManager(); // In real app, this should be injected
    }

    @OnOpen
    public void onOpen(Session session) {
        String query = session.getQueryString();
        // Simple token check in query param for demo
        if (query == null || !query.contains("token=")) {
            try {
                session.close();
                return;
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        connectionManager.addSession(session);
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        // Handle incoming messages if needed
    }

    @OnClose
    public void onClose(Session session) {
        connectionManager.removeSession(session);
    }
}

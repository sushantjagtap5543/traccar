package org.traccar.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;

public class DatabaseStorage {

    private static final Logger LOGGER = LoggerFactory.getLogger(DatabaseStorage.class);

    // Placeholder for actual query logic to demonstrate the fix
    public Object executeQuery(QueryBuilder queryBuilder) {
        try {
            return queryBuilder.executeQuery();
        } catch (SQLException e) {
            LOGGER.error("Database query failed", e);
            throw new RuntimeException(e);
        }
    }
    
    // Interface/Class for QueryBuilder would be needed in a real scenario
    public interface QueryBuilder {
        Object executeQuery() throws SQLException;
    }
}

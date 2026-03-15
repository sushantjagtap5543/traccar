package org.traccar.storage.query;

public class Request {

    private final Columns columns;
    private final Condition condition;

    public Request(Columns columns) {
        this(columns, null);
    }

    public Request(Columns columns, Condition condition) {
        this.columns = columns;
        this.condition = condition;
    }

    public Columns getColumns() {
        return columns;
    }

    public Condition getCondition() {
        return condition;
    }
}

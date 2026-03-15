package org.traccar.storage.query;

public abstract class Condition {

    public static class Equals extends Condition {
        private final String column;
        private final Object value;

        public Equals(String column, Object value) {
            this.column = column;
            this.value = value;
        }

        public String getColumn() { return column; }
        public Object getValue() { return value; }
    }
}

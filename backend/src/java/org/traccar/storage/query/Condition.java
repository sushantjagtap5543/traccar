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

    public static class Greater extends Condition {
        private final String column;
        private final Object value;

        public Greater(String column, Object value) {
            this.column = column;
            this.value = value;
        }

        public String getColumn() { return column; }
        public Object getValue() { return value; }
    }

    public static class Lesser extends Condition {
        private final String column;
        private final Object value;

        public Lesser(String column, Object value) {
            this.column = column;
            this.value = value;
        }

        public String getColumn() { return column; }
        public Object getValue() { return value; }
    }

    public static class Between extends Condition {
        private final String column;
        private final Object from;
        private final Object to;

        public Between(String column, Object from, Object to) {
            this.column = column;
            this.from = from;
            this.to = to;
        }

        public String getColumn() { return column; }
        public Object getFrom() { return from; }
        public Object getTo() { return to; }
    }
}

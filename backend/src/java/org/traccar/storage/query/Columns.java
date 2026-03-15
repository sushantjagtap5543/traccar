package org.traccar.storage.query;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class Columns {

    private final Collection<String> columns;
    private final Collection<String> exclude;

    public Columns() {
        this(new HashSet<>(), new HashSet<>());
    }

    private Columns(Collection<String> columns, Collection<String> exclude) {
        this.columns = columns;
        this.exclude = exclude;
    }

    public static class All extends Columns {}

    public static class Include extends Columns {
        public Include(String... columns) {
            super(Set.of(columns), new HashSet<>());
        }
    }

    public static class Exclude extends Columns {
        public Exclude(String... columns) {
            super(new HashSet<>(), Set.of(columns));
        }
    }
}

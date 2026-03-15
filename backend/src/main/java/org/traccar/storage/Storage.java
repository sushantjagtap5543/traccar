package org.traccar.storage;

import org.traccar.storage.query.Request;
import java.util.List;

public interface Storage {

    <T> List<T> getObjects(Class<T> clazz, Request request);

    <T> T getObject(Class<T> clazz, Request request);

    void addObject(Object object, Request request);

    void updateObject(Object object, Request request);

    void removeObject(Class<?> clazz, Request request);

}

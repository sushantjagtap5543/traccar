package org.traccar.repository;

import org.traccar.model.User;
import org.traccar.storage.Storage;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;

import jakarta.inject.Inject;
import java.util.List;

public class UserRepository {

    @Inject
    private Storage storage;

    public User findByEmail(String email) {
        return storage.getObject(
            User.class,
            new Request(
                new Columns.All(),
                new Condition.Equals("email", email)
            )
        );
    }

    public List<User> getAllUsers() {
        return storage.getObjects(User.class, new Request(new Columns.All()));
    }

    public User createUser(User user) {
        storage.addObject(user, new Request(new Columns.Exclude("id")));
        return user;
    }

}

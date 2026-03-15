package org.traccar.service;

import org.traccar.model.User;
import org.traccar.repository.UserRepository;
import jakarta.inject.Inject;
import java.util.List;

public class UserService {

    @Inject
    private UserRepository userRepository;

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> getAllUsers() {
        return userRepository.getAllUsers();
    }

    public User createUser(User user) {
        return userRepository.createUser(user);
    }

}

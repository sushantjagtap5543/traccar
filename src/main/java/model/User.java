package model;

public class User {

    private Long id;
    private String email;
    private String password;
    private Role role;

    public Long getId() {
        return id;
    }

    public Role getRole() {
        return role;
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}

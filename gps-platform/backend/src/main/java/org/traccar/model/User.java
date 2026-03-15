package org.traccar.model;

public class User {

    private Long id;
    private String name;
    private String email;
    private String password;
    private boolean administrator;
    private long groupId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public long getGroupId() {
        return groupId;
    }

    public void setGroupId(long groupId) {
        this.groupId = groupId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isAdministrator() {
        return administrator;
    }

    public void setAdministrator(boolean administrator) {
        this.administrator = administrator;
    }

    public void validate() {

        if (email == null || email.isEmpty())
            throw new IllegalArgumentException("Email required");

        if (password == null || password.length() < 6)
            throw new IllegalArgumentException("Password too short");

    }
}

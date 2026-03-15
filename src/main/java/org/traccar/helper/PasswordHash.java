package org.traccar.helper;

import org.mindrot.jbcrypt.BCrypt;

public class PasswordHash {

    public static String hash(String password) {
        return BCrypt.hashpw(password, BCrypt.gensalt());
    }

    public static boolean verify(String password, String hash) {
        if (hash == null) {
            return false;
        }
        try {
            return BCrypt.checkpw(password, hash);
        } catch (Exception e) {
            return false;
        }
    }
}

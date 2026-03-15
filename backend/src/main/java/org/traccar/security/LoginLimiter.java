package org.traccar.security;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class LoginLimiter {

    private static final Map<String, Integer> attempts = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;

    public static boolean allow(String ip) {
        int count = attempts.getOrDefault(ip, 0);
        if (count >= MAX_ATTEMPTS) {
            return false;
        }
        attempts.put(ip, count + 1);
        return true;
    }

    public static void reset(String ip) {
        attempts.remove(ip);
    }

}

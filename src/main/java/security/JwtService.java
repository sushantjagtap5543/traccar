package security;

import io.jsonwebtoken.*;
import java.util.Date;

public class JwtService {

    private static final String SECRET = "CHANGE_THIS_SECRET";

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .signWith(SignatureAlgorithm.HS256, SECRET)
                .compact();
    }

    public boolean validate(String token) {
        try {
            Jwts.parser()
                .setSigningKey(SECRET)
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

package security;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;

public class AuthFilter implements Filter {

    private JwtService jwtService = new JwtService();

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(
        ServletRequest request,
        ServletResponse response,
        FilterChain chain
    ) throws java.io.IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        String token = req.getHeader("Authorization");

        if (token != null && jwtService.validate(token)) {
            chain.doFilter(request, response);
        } else {
            throw new ServletException("Unauthorized request");
        }
    }

    @Override
    public void destroy() {}
}

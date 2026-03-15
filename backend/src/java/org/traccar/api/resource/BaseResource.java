package org.traccar.api.resource;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.Context;

public class BaseResource {

    @Context
    private HttpServletRequest request;

    protected long getUserId() {
        return (Long) request.getAttribute("userId");
    }
}

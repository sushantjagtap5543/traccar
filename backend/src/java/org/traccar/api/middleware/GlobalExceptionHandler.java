package org.traccar.api.middleware;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.traccar.api.util.ApiResponse;

@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {

    @Override
    public Response toResponse(Exception e) {
        return Response.status(500)
                .entity(new ApiResponse<>(false, e.getMessage(), null))
                .build();
    }

}

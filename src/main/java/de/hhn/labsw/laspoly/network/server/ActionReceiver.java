package de.hhn.labsw.laspoly.network.server;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Response;
import java.io.InputStream;

/**
 * Receives all data that is send from the client during a game.
 */
@Path ("/action")
public class ActionReceiver {

    /**
     * Adds an action to a game.
     *
     * @param incomingData Containing the action.
     *
     * @return {@link javax.ws.rs.core.Response}.
     */
    @POST
    @Path ("/add/{a}")
    @Consumes
    public Response add(@PathParam ("a") int gameId, InputStream incomingData) {
        return Response.status(200).build();
    }

    /**
     * Requests an update of the list of actions.
     *
     * @param actionCount Count of actions the client has.
     *
     * @return List of actions that the user dont has.
     */
    @GET
    @Path ("/update/{a}")
    @Produces ("application/json")
    public String update(@PathParam ("a") int actionCount) {
        return "";
    }
}

package de.hhn.labsw.laspoly.network.server;

import com.google.gson.Gson;
import de.hhn.labsw.laspoly.exception.UserNotKnownException;
import de.hhn.labsw.laspoly.model.User;
import org.json.JSONObject;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Locale;
import java.util.logging.Logger;


/**
 * This class handles all requests for the {@link de.hhn.labsw.laspoly.model.User}. For example login or logout.
 */
@Path ("/user")
public class UserReceiver {

    /**
     * Global instance of {@link com.google.gson.Gson}.
     */
    private static Gson gson = new Gson();

    /**
     * {@link java.util.logging.Logger} of this class.
     */
    private static Logger logger = Logger.getAnonymousLogger(); // TODO

    /**
     * Adds a {@link de.hhn.labsw.laspoly.model.User} to the server.
     *
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.User}.
     *
     * @return The received {@link de.hhn.labsw.laspoly.model.User}.
     */
    @POST
    @Path ("/add")
    @Consumes
    public Response add(InputStream incomingData) {
        logger.info("/user/add");
        User user = readUser(incomingData);
        user.setId(Server.getInstance().generateUserId());
        Server.getInstance().addUser(user);
        return Response.status(200).entity(gson.toJson(user)).build();
    }

    /**
     * Removes a {@link de.hhn.labsw.laspoly.model.User} from the server.
     *
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.User}.
     *
     * @return The received {@link de.hhn.labsw.laspoly.model.User}.
     */
    @POST
    @Path ("/remove")
    @Consumes
    public Response remove(InputStream incomingData) {
        logger.info("/user/remove");
        User user = readUser(incomingData);
        Server.getInstance().removeUser(user);
        return Response.status(200).entity(gson.toJson(user)).build();
    }


    /**
     * Logs in an existing {@link de.hhn.labsw.laspoly.model.User} to the server.
     *
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.User}.
     *
     * @return The received {@link de.hhn.labsw.laspoly.model.User} or an error message if the {@link
     * de.hhn.labsw.laspoly.model.User} was not found.
     *
     * @throws UserNotKnownException if the user was not found on the server.
     */
    @POST
    @Path ("/login")
    @Consumes
    public Response login(InputStream incomingData) throws UserNotKnownException {
        logger.info("/user/login");
        User user = readUser(incomingData);
        try {
            Server.getInstance().login(user);
        } catch (UserNotKnownException e) {
            user.setId(Server.getInstance().generateUserId());
            Server.getInstance().addUser(user);
            Server.getInstance().login(user);
        }
        return Response.status(200).entity(gson.toJson(user)).build();
    }

    /**
     * Logs out an existing {@link de.hhn.labsw.laspoly.model.User} from the server.
     *
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.User}.
     *
     * @return The received {@link de.hhn.labsw.laspoly.model.User}.
     *
     * @throws UserNotKnownException if the user was not found on the server.
     */
    @POST
    @Path ("/logout")
    @Consumes
    public Response logout(InputStream incomingData) throws UserNotKnownException {
        logger.info("/user/logout");
        User user = readUser(incomingData);
        try {
            Server.getInstance().logout(user);
        } catch (UserNotKnownException e) {
            user.setId(Server.getInstance().generateUserId());
            Server.getInstance().addUser(user);
            Server.getInstance().logout(user);
        }

        return Response.status(200).entity(gson.toJson(user)).build();
    }

    /**
     * Changes the data of a {@link de.hhn.labsw.laspoly.model.User} on the server.
     *
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.User}.
     *
     * @return The received {@link de.hhn.labsw.laspoly.model.User}.
     */
    @POST
    @Path ("/dataChanged")
    @Consumes
    public Response dataChanged(InputStream incomingData) throws UserNotKnownException {
        logger.info("/user/dataChanged");
        JSONObject object = new JSONObject(readJson(incomingData));
        User user = Server.getInstance().getUser((Integer) object.get("id"));
        user.setImageID((Integer) object.get("imageID"));
        user.setName((String) object.get("name"));
        user.setLocale(gson.fromJson((String) object.get("locale"), Locale.class));
        return Response.status(200).entity(gson.toJson(user)).build();
    }


    /**
     * Reads user from the {@link java.io.InputStream}.
     *
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.User}.
     *
     * @return Read {@link de.hhn.labsw.laspoly.model.User}.
     */
    private User readUser(InputStream incomingData) {
        String json = readJson(incomingData);
        return gson.fromJson(json, User.class);
    }

    /**
     * Reads a json string from the {@link java.io.InputStream}.
     *
     * @param incomingData {@link java.io.InputStream} containing the json string.
     *
     * @return The read json string.
     */
    private String readJson(InputStream incomingData) {
        StringBuilder json = new StringBuilder();
        try {
            BufferedReader in = new BufferedReader(new InputStreamReader(incomingData));
            String line = null;
            while ((line = in.readLine()) != null) {
                json.append(line);
            }
        } catch (Exception e) {
            System.out.println("Error Parsing: - ");
        }
        logger.info("Got JSON: " + json.toString());
        return json.toString();
    }
}

package de.hhn.labsw.laspoly.network.server;

import com.google.gson.Gson;
import de.hhn.labsw.laspoly.exception.GameNotKnownException;
import de.hhn.labsw.laspoly.model.Game;
import de.hhn.labsw.laspoly.model.User;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Response;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.logging.Logger;

/**
 * This class handles all requests for {@link de.hhn.labsw.laspoly.model.Game}.
 */
@Path ("/game")
public class GameReceiver {

    /**
     * Global instance of {@link com.google.gson.Gson}.
     */
    private static Gson gson = new Gson();

    /**
     * {@link java.util.logging.Logger} of this class.
     */
    private static Logger logger = Logger.getAnonymousLogger(); // TODO

    /**
     * Adds a {@link de.hhn.labsw.laspoly.model.Game} to the server.
     *
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.Game}.
     *
     * @return The read {@link de.hhn.labsw.laspoly.model.Game}.
     */
    @POST
    @Path ("/add")
    @Consumes
    public Response add (InputStream incomingData) {
        logger.info("/game/add");
        Game game = readGame(incomingData);
        game.setId(Server.getInstance().generateGameId());
        Server.getInstance().addGame(game);

        return Response.status(200).entity(gson.toJson(game)).build();
    }

    /**
     * Removes a {@link de.hhn.labsw.laspoly.model.Game} from the server.
     *
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.Game}.
     *
     * @return The read {@link de.hhn.labsw.laspoly.model.Game}.
     */
    @POST
    @Path ("/remove")
    @Consumes
    public Response remove (InputStream incomingData) {
        logger.info("/game/remove");
        Game game = readGame(incomingData);
        Server.getInstance().removeGame(game);
        return Response.status(200).entity(gson.toJson(game)).build();
    }

    /**
     * @return A list of all active {@link de.hhn.labsw.laspoly.model.Game}.
     */
    @GET
    @Path ("/getAll")
    @Produces ("application/json")
    public String getAll () {
        logger.info("/game/getAll");
        return new Gson().toJson(Server.getInstance().getAllActiveGames());
    }

    /**
     * Changes the data of a {@link de.hhn.labsw.laspoly.model.Game} on the server.
     *
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.Game}.
     *
     * @return The read {@link de.hhn.labsw.laspoly.model.Game}.
     */
    @POST
    @Path ("/dataChanged")
    @Consumes
    public Response dataChanged(InputStream incomingData) throws GameNotKnownException {
        logger.info("/game/dataChanged");
        JSONObject object = new JSONObject(readJson(incomingData));
        Game game = Server.getInstance().getGame((Integer) object.get("id"));
        game.setName((String) object.get("name"));
        if ((Boolean) object.get("started")) {
            game.start(); // TODO
        }
        return Response.status(200).entity(new Gson().toJson(game)).build();
    }

    /**
     * @return {@link de.hhn.labsw.laspoly.model.Game}.
     */
    @POST   // TODO in GET umwandeln
    @Path ("/update")
    @Consumes
    public Response update(InputStream incomingData) throws GameNotKnownException {
        logger.info("/game/update");
        JSONObject object = new JSONObject(readJson(incomingData));
        Game game = Server.getInstance().getGame((Integer) object.get("id"));
        if (game == null) {
            return Response.status(400).entity("{}").build();
        }
        return Response.status(200).entity(new Gson().toJson(game)).build();
    }


    /**
     * Adds a {@link de.hhn.labsw.laspoly.model.User} to a {@link de.hhn.labsw.laspoly.model.Game}.
     *
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.User} and {@link
     *                     de.hhn.labsw.laspoly.model.Game}.
     *
     * @return {@link de.hhn.labsw.laspoly.model.Game} the user was added.
     */
    @POST
    @Path ("/addUser")
    @Consumes
    public Response addUser(InputStream incomingData) throws GameNotKnownException {
        logger.info("/game/addUser");
        JSONArray array = new JSONArray(readJson(incomingData));
        Gson gson = new Gson();
        JSONObject objectGame = new JSONObject(array.get(0).toString());
        User user = gson.fromJson(array.get(1).toString(), User.class);
        Game game = Server.getInstance().getGame((Integer) objectGame.get("id"));
        game.addUser(user);
        return Response.status(200).entity(gson.toJson(game)).build();
    }

    @POST
    @Path ("/removeUser")
    @Consumes
    public Response removeUser(InputStream incomingData) throws GameNotKnownException {
        logger.info("/game/removeUser");
        JSONArray array = new JSONArray(readJson(incomingData));
        Gson gson = new Gson();
        JSONObject objectGame = new JSONObject(array.get(0).toString());
        User user = gson.fromJson(array.get(1).toString(), User.class);
        Game game = Server.getInstance().getGame((Integer) objectGame.get("id"));
        game.removeUser(user);
        return Response.status(200).entity(gson.toJson(game)).build();
    }

    /**
     * Called when a {@link de.hhn.labsw.laspoly.model.Game} is started.
     *
     * @param incomingData {@link java.io.InputStream} containing the game.
     *
     * @return The game that was started.
     *
     * @throws GameNotKnownException Thrown if the game is not known by the server.
     */
    @POST
    @Path ("/start")
    @Consumes
    public Response start(InputStream incomingData) throws GameNotKnownException {
        logger.info("/game/start");
        JSONObject object = new JSONObject(readJson(incomingData));
        int id = (int) object.get("id");
        Game game = Server.getInstance().getGame(id);
        Server.getInstance().startGame(game);
        return Response.status(200).entity(gson.toJson(game)).build();
    }

    /**
     * Reads a {@link de.hhn.labsw.laspoly.model.Game} from the {@link java.io.InputStream}.
     * @param incomingData {@link java.io.InputStream} containing the {@link de.hhn.labsw.laspoly.model.Game}.
     * @return Read {@link de.hhn.labsw.laspoly.model.Game}.
     */
    private Game readGame (InputStream incomingData) {
        String json = readJson(incomingData);
        return gson.fromJson(json, Game.class);
    }

    /**
     * Reads a json string from the {@link java.io.InputStream}.
     *
     * @param incomingData {@link java.io.InputStream} containing the json string.
     *
     * @return The read json string.
     */
    private String readJson (InputStream incomingData) {
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

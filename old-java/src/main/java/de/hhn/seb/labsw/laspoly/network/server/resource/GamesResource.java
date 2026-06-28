/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.network.server.resource;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import de.hhn.seb.labsw.laspoly.System;
import de.hhn.seb.labsw.laspoly.exception.GameNotKnownException;
import de.hhn.seb.labsw.laspoly.exception.InvalidActionException;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.ServerGame;
import de.hhn.seb.labsw.laspoly.model.ServerPlayer;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import de.hhn.seb.labsw.laspoly.model.action.StartGameAction;
import de.hhn.seb.labsw.laspoly.network.server.dao.DaoFactory;
import de.hhn.seb.labsw.laspoly.network.server.dao.GameDao;
import de.hhn.seb.labsw.laspoly.network.server.dao.GameDaoCache;
import de.hhn.seb.labsw.laspoly.network.server.resource.UsersResource;
import de.hhn.seb.labsw.laspoly.utils.DateTimeConverter;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.function.BiConsumer;
import java.util.logging.Logger;
import javax.inject.Singleton;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.glassfish.jersey.media.sse.EventOutput;
import org.glassfish.jersey.media.sse.OutboundEvent;
import org.glassfish.jersey.media.sse.SseBroadcaster;
import org.joda.time.DateTime;
import org.json.JSONArray;
import org.json.JSONObject;

@Path(value="/games")
@Singleton
public class GamesResource {
    private final Gson gson;
    private final Logger logger = Logger.getLogger(UsersResource.class.getName());
    private final SseBroadcaster broadcaster;
    private final HashMap<Game, ServerGame> games;
    private final GameDao gameDao;

    public GamesResource() {
        this.gson = new GsonBuilder().registerTypeAdapter((Type)(DateTime.class), new DateTimeConverter()).create();
        this.broadcaster = new SseBroadcaster();
        this.games = new HashMap();
        this.gameDao = DaoFactory.getGameDao("cache");
    }

    @GET
    @Produces(value={"text/event-stream"})
    @Path(value="/listenToGames")
    public EventOutput listenToBroadcast() {
        EventOutput eventOutput = new EventOutput();
        this.broadcaster.add(eventOutput);
        return eventOutput;
    }

    @GET
    @Produces(value={"text/event-stream"})
    @Path(value="/listenToGame/{id}")
    public EventOutput listenToGame(@PathParam(value="id") int gameId) throws GameNotKnownException {
        Game game = this.gameDao.getGame(gameId);
        ServerGame serverGame = this.games.get(game);
        if (serverGame == null) {
            throw new GameNotKnownException(game);
        }
        EventOutput eventOutput = new EventOutput();
        serverGame.getBroadcaster().add(eventOutput);
        serverGame.startKeepalive();
        return eventOutput;
    }

    @GET
    @Produces(value={"application/json"})
    public final String getGames() {
        List<Game> gameList = this.gameDao.getOpenGames();
        return this.gson.toJson(gameList);
    }

    @GET
    @Path(value="/clearAll")
    @Produces(value={"application/json"})
    public final String clearAll() {
        List<Game> gamesList = this.gameDao.getModel();
        for (Game game : gamesList.toArray(new Game[gamesList.size()])) {
            this.gameDao.remove(game);
            this.games.remove(game);
        }
        this.notifyGamesListUpdate();
        return "Success";
    }

    @POST
    @Path(value="/add")
    public final Response addGame(String gameJson) {
        this.logger.info("/games/add: " + gameJson);
        JSONArray array = new JSONArray(gameJson);
        User user = this.gson.fromJson(array.get(1).toString(), User.class);
        Game game = new Game(array.get(0).toString(), user);
        this.gameDao.add(game);
        this.logger.info("Game created: " + String.valueOf(game));
        this.notifyGamesListUpdate();
        this.games.put(game, new ServerGame(game));
        this.games.get(game).addUser(game.getHost());
        return Response.status(Response.Status.OK).entity(this.gson.toJson(game)).build();
    }

    @POST
    @Path(value="/remove")
    public final Response removeGame(String gameJson) {
        this.logger.info("/games/remove: " + gameJson);
        Game game = this.gson.fromJson(gameJson, Game.class);
        this.gameDao.remove(game);
        this.notifyGamesListUpdate();
        this.games.remove(game);
        return Response.status(Response.Status.OK).build();
    }

    @POST
    @Path(value="/addUser")
    public final Response addUser(String gameUserJson) {
        this.logger.info("/games/addUser");
        JSONArray array = new JSONArray(gameUserJson);
        JSONObject object = new JSONObject(array.get(0).toString());
        int id = object.getInt("id");
        try {
            Game game = this.gameDao.getGame(id);
            User user = this.gson.fromJson(array.get(1).toString(), User.class);
            this.gameDao.addUser(game, user);
            this.games.get(game).addUser(user);
            this.broadcast(this.games.get(game).getBroadcaster(), "game", this.gson.toJson(game));
            final StringBuilder builder = new StringBuilder(100);
            builder.append("[");
            this.games.get(game).getPlayers().forEach(new BiConsumer<User, ServerPlayer>(){

                @Override
                public void accept(User user, ServerPlayer player) {
                    builder.append("[");
                    builder.append(GamesResource.this.gson.toJson(user));
                    builder.append(",");
                    builder.append(GamesResource.this.gson.toJson(player.getFigureSource()));
                    builder.append("],");
                }
            });
            builder.append("]");
            this.logger.info(builder.toString());
            return Response.status(Response.Status.OK).entity(builder.toString()).build();
        }
        catch (GameNotKnownException e) {
            return Response.status(1337).build();
        }
    }

    @POST
    @Path(value="/removeUser")
    public final Response removeUser(String gameUserJson) {
        Game game;
        this.logger.info("/games/removeUser");
        JSONArray array = new JSONArray(gameUserJson);
        JSONObject object = new JSONObject(array.get(0).toString());
        int id = object.getInt("id");
        try {
            game = this.gameDao.getGame(id);
        }
        catch (GameNotKnownException e) {
            return Response.status(1337).build();
        }
        User user = this.gson.fromJson(array.get(1).toString(), User.class);
        Game changedGame = this.gameDao.removeUser(game, user);
        if (changedGame == null) {
            this.games.remove(game);
            this.notifyGamesListUpdate();
            return Response.status(Response.Status.OK).build();
        }
        this.games.get(changedGame).removeUser(user);
        this.broadcast(this.games.get(changedGame).getBroadcaster(), "game", this.gson.toJson(changedGame));
        return Response.status(200).build();
    }

    @POST
    @Path(value="/start")
    public final Response start(String gameJson) {
        Game game;
        JSONObject object = new JSONObject(gameJson);
        int id = object.getInt("id");
        try {
            game = this.gameDao.getGame(id);
        }
        catch (GameNotKnownException e) {
            return Response.status(1337).build();
        }
        this.gameDao.start(game);
        this.games.get(game).start();
        this.notifyGamesListUpdate();
        StartGameAction start = new StartGameAction(System.SYSTEM_USER);
        String jsonArray = "[" + this.gson.toJson(ActionType.START_GAME) + "," + this.gson.toJson(start) + "]";
        this.broadcast(this.games.get(game).getBroadcaster(), "gameRunning", jsonArray);
        new Thread(){

            @Override
            public void run() {
                final Timer timer = new Timer();
                timer.schedule(new TimerTask(){

                    @Override
                    public void run() {
                        ((ServerGame)GamesResource.this.games.get(game)).nextUser();
                        timer.cancel();
                    }
                }, 2500L);
            }
        }.start();
        return Response.status(Response.Status.OK).build();
    }

    @POST
    @Path(value="/getgame")
    public final Response getGame(String gameJson) {
        Game game;
        this.logger.fine("/games/getgame");
        JSONObject object = new JSONObject(gameJson);
        int id = object.getInt("id");
        try {
            game = this.gameDao.getGame(id);
        }
        catch (GameNotKnownException e) {
            return Response.status(1337).build();
        }
        return Response.status(Response.Status.OK).entity(this.gson.toJson(game)).build();
    }

    @POST
    @Path(value="/gameAction")
    public final Response gameAction(String gameActionJson) {
        Game game;
        this.logger.info("/games/gameAction");
        JSONArray array = new JSONArray(gameActionJson);
        JSONObject gameObject = new JSONObject(array.get(0).toString());
        try {
            game = this.gameDao.getGame(gameObject.getInt("id"));
        }
        catch (GameNotKnownException e) {
            return Response.status(1337).build();
        }
        try {
            if (!this.notifyGameAction(game, array.get(1).toString())) {
                return Response.status(1337).build();
            }
        }
        catch (InvalidActionException e) {
            this.logger.warning("Rejected game action: " + e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST).entity(e.getMessage()).build();
        }
        return Response.status(Response.Status.OK).build();
    }

    private void notifyGamesListUpdate() {
        this.logger.info("Open games");
        for (Game game : this.gameDao.getOpenGames()) {
            this.logger.info(game.toString());
        }
        this.broadcast(this.broadcaster, "gameslist", this.gson.toJson(this.gameDao.getOpenGames()));
    }

    private boolean notifyGameAction(Game game, String actionJson) {
        this.logger.info("/game/notifyGameAction with " + actionJson);
        JSONArray array = new JSONArray(actionJson);
        ActionType type = this.gson.fromJson(array.get(0).toString(), ActionType.class);
        this.logger.info("/game/notifyGameAction with type: " + String.valueOf(type));
        ServerGame serverGame = this.games.get(game);
        if (serverGame == null) {
            this.logger.warning("Ignoring game action for ended or unknown server game: " + String.valueOf(game));
            return false;
        }
        try {
            serverGame.notifyAction(type, array.get(1).toString(), this);
        }
        catch (InvalidActionException e) {
            throw e;
        }
        if (this.games.get(game) != null && !type.equals(ActionType.PING)) {
            this.broadcast(this.games.get(game).getBroadcaster(), "gameRunning", actionJson);
        }
        return true;
    }

    private void broadcast(SseBroadcaster sseBroadcaster, String name, String message) {
        try {
            OutboundEvent.Builder eventBuilder = new OutboundEvent.Builder();
            OutboundEvent event = eventBuilder.name(name).mediaType(MediaType.APPLICATION_JSON_TYPE).data(String.class, message).build();
            sseBroadcaster.broadcast(event);
        }
        catch (Exception e) {
            this.logger.warning("Broadcast failed for event '" + name + "': " + e.getMessage());
        }
    }

    public void endGame(Game game) {
        GameDaoCache.instance.remove(game);
        this.games.remove(game);
    }
}


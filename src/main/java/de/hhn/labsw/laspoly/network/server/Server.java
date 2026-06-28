package de.hhn.labsw.laspoly.network.server;

import com.sun.jersey.api.container.httpserver.HttpServerFactory;
import com.sun.jersey.api.core.PackagesResourceConfig;
import com.sun.jersey.api.core.ResourceConfig;
import com.sun.net.httpserver.HttpServer;
import de.hhn.labsw.laspoly.exception.GameNotKnownException;
import de.hhn.labsw.laspoly.exception.UserNotKnownException;
import de.hhn.labsw.laspoly.model.Actor;
import de.hhn.labsw.laspoly.model.Game;
import de.hhn.labsw.laspoly.model.User;
import de.hhn.labsw.laspoly.model.action.Action;
import de.hhn.labsw.laspoly.utils.IOUtils;
import de.hhn.labsw.laspoly.utils.StorageUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Random;
import java.util.logging.Logger;

/**
 * Class representing the server of this program.
 */
public class Server implements Actor{


    /**
     * Port of the {@link de.hhn.labsw.laspoly.network.server.Server}.
     */
    public static final Integer PORT = 6789;

    /**
     * IP-Address of the {@link de.hhn.labsw.laspoly.network.server.Server}.
     */
    public static final String IP_ADDRESS = "127.0.0.1";

    /**
     * HTTP-Address of the {@link de.hhn.labsw.laspoly.network.server.Server}.
     */
    public static final String HTTP_ADDRESS = "http://" + IP_ADDRESS + ":" + PORT;

    /**
     * {@link java.util.logging.Logger} of this class.
     */
    private Logger logger;

    /**
     * List of all {@link Game}.
     */
    private List<Game> games;

    /**
     * List of all {@link de.hhn.labsw.laspoly.model.User}.
     */
    private List<User> users;

    /**
     * {@link java.util.HashMap} containing a {@link de.hhn.labsw.laspoly.model.User} and boolean that states whether
     * the user is online or not.
     */
    private HashMap<User, Boolean> onlineUser;

    /**
     * {@link java.util.HashMap} containing a {@link de.hhn.labsw.laspoly.model.Game} and boolean that states whether
     * the {@link de.hhn.labsw.laspoly.model.Game} is active or not.
     */
    private HashMap<Game, Boolean> activeGames;

    /**
     * Singleton instance.
     */
    private static Server instance = null;

    /**
     * List of all ids used for {@link de.hhn.labsw.laspoly.model.Game}.
     */
    private List<Integer> gameIds;

    /**
     * List of all ids used for {@link de.hhn.labsw.laspoly.model.User}.
     */
    private List<Integer> userIds;

    /**
     * Server this class is running.
     */
    private HttpServer server;

    /**
     * HashMap containg a game and the associated list of actions in that game.
     */
    private HashMap<Game, List<Action>> gameActionList;

    /**
     * Main method to start the server.
     *
     * @param args Console parameters.
     */
    public static void main(String[] args) {
        Server.getInstance();
    }

    /**
     * Constructor.
     */
    private Server() {
        logger = IOUtils.initializeLogger(Server.class, "de/hhn/labsw/laspoly/network/server/server_logging" + "" +
                ".properties");
        games = new ArrayList<>();
        users = StorageUtils.getServerData();
        gameIds = new ArrayList<>();
        userIds = new ArrayList<>();
        onlineUser = new HashMap<>();
        activeGames = new HashMap<>();
        gameActionList = new HashMap<>();
        for (User user : users) {
            userIds.add(user.getId());
            onlineUser.put(user, false);
        }

        try {
            ResourceConfig resourceConfig = new PackagesResourceConfig("de.hhn.labsw.laspoly.network.server");
            server = HttpServerFactory.create(HTTP_ADDRESS + "/", resourceConfig);
            server.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
        Thread input = new Thread(new InputRunnable());
        input.start();

    }

    /**
     * Generates a new id for a {@link de.hhn.labsw.laspoly.model.Game}.
     *
     * @return Id for the {@link de.hhn.labsw.laspoly.model.Game}.
     */
    public int generateGameId() {
        Random rand = new Random();
        int id;
        while (true) {
            id = rand.nextInt(Integer.MAX_VALUE) + 1;
            if (!gameIds.contains(id)) {
                break;
            }
        }
        gameIds.add(id);
        return id;
    }

    /**
     * Generates a new id for a {@link de.hhn.labsw.laspoly.model.User}.
     *
     * @return Id for the {@link de.hhn.labsw.laspoly.model.User}.
     */
    public int generateUserId() {
        Random rand = new Random();
        int id;
        while (true) {
            id = rand.nextInt(Integer.MAX_VALUE) + 1;
            if (!userIds.contains(id)) {
                break;
            }
        }
        userIds.add(id);
        return id;
    }

    /**
     * Logs in a {@link de.hhn.labsw.laspoly.model.User}.
     *
     * @param user {@link de.hhn.labsw.laspoly.model.User} that is logged in.
     *
     * @throws UserNotKnownException Thrown if the user is not known by the server.
     */
    public void login(User user) throws UserNotKnownException {
        if (users.contains(user) && onlineUser.containsKey(user)) {
            onlineUser.replace(user, true);
        } else {
            throw new UserNotKnownException("This user is not known by the server (" + String.valueOf(user) + ")");
        }
    }

    /**
     * Logs out a {@link de.hhn.labsw.laspoly.model.User}.
     *
     * @param user {@link de.hhn.labsw.laspoly.model.User} that is logged out.
     *
     * @throws UserNotKnownException Thrown if the user is not known by the server.
     */
    public void logout(User user) throws UserNotKnownException {
        if (users.contains(user) && onlineUser.containsKey(user)) {
            onlineUser.replace(user, false);
        } else {
            throw new UserNotKnownException("This user is not known by the server (" + String.valueOf(user) + ")");
        }
    }

    /**
     * Called when the server is shutdown. Saves all necessary items of the server.
     */
    public void onShutdown() {
        StorageUtils.writeServerData(this);
        try {
            server.stop(0);
        } catch (NullPointerException e) {
            logger.severe(e.getMessage());
        }
        System.exit(0);
    }

    /**
     * Singleton method. Creates an instance of {@link de.hhn.labsw.laspoly.network.server.Server} if there isn't one.
     *
     * @return Instance of {@link de.hhn.labsw.laspoly.network.server.Server}.
     */
    public static Server getInstance() {
        if (instance == null) {
            instance = new Server();
        }
        return instance;
    }

    /**
     * @return {@link #games}
     */
    public List<Game> getGames() {
        return games;
    }


    /**
     * @return {@link #users}
     */
    public List<User> getUsers() {
        return users;
    }

    /**
     * @param id Id of the {@link de.hhn.labsw.laspoly.model.User} that is requested.
     *
     * @return {@link de.hhn.labsw.laspoly.model.User} with the given id.
     *
     * @thrown UserNotKnownException Thrown if the id is not known by the server.
     */
    public User getUser(int id) throws UserNotKnownException {
        for (User user : users) {
            if (user.getId() == id) {
                return user;
            }
        }
        throw new UserNotKnownException("There is no user with the id " + id);
    }

    /**
     * @param id Id of the {@link de.hhn.labsw.laspoly.model.Game} that is requested.
     *
     * @return {@link de.hhn.labsw.laspoly.model.Game} with the given id.
     *
     * @thrown GameNotKnownException Thrown if the game is not known by the server.
     */
    public Game getGame(int id) throws GameNotKnownException {
        for (Game game : games) {
            if (game.getId() == id) {
                return game;
            }
        }
        throw new GameNotKnownException("There is no game with the id " + id);
    }

    /**
     * Adds a {@link de.hhn.labsw.laspoly.model.User} to the server.
     *
     * @param user {@link de.hhn.labsw.laspoly.model.User} that is added.
     */
    public void addUser(User user) {
        users.add(user);
        onlineUser.put(user, true);
    }

    /**
     * Removes a {@link de.hhn.labsw.laspoly.model.User} from the server.
     *
     * @param user {@link de.hhn.labsw.laspoly.model.User} that is removed.
     */
    public void removeUser(User user) {
        users.remove(user);
        onlineUser.remove(user);
    }

    /**
     * Adds a {@link de.hhn.labsw.laspoly.model.Game} to the server.
     *
     * @param game {@link de.hhn.labsw.laspoly.model.Game} that is added.
     */
    public void addGame(Game game) {
        games.add(game);
        activeGames.put(game, true);
    }

    /**
     * Removes a {@link de.hhn.labsw.laspoly.model.Game} from the server.
     *
     * @param game {@link de.hhn.labsw.laspoly.model.Game} that is removed.
     */
    public void removeGame(Game game) {
        games.remove(game);
        activeGames.remove(game);
    }

    /**
     * @return {@link #gameIds}
     */
    public List<Integer> getGameIds() {
        return gameIds;
    }

    /**
     * @return {@link #userIds}
     */
    public List<Integer> getUserIds() {
        return userIds;
    }

    /**
     * @return A list of all {@link de.hhn.labsw.laspoly.model.Game} that are active.
     */
    public List<Game> getAllActiveGames() {
        // TODO
        return games;
    }

    /**
     * Returns whether the user is online or not.
     *
     * @param user User that is checked.
     *
     * @return Whether the user is online or not.
     */
    public boolean isOnline(User user) {
        return onlineUser.get(user);
    }

    /**
     * Returns a list of all {@link de.hhn.labsw.laspoly.model.User} that are online.
     *
     * @return
     */
    public List<User> getOnlineUsers() {
        List<User> users = new ArrayList<>();
        onlineUser.entrySet().stream().forEach(u -> {
            if (u.getValue()) {
                users.add(u.getKey());
            }
        });
        return users;
    }

    @Override
    public void transactMoney(Actor actor, int amount) {
        // TODO
    }

    @Override
    public void sendMessage(String message) {
        // TODO

    }

    @Override
    public int getMoneyAmount() {
        return Integer.MAX_VALUE;
    }

    /**
     * Starts the game on the server.
     *
     * @param game Game that is started.
     */
    public void startGame(Game game) {
        game.start();
        gameActionList.put(game, new ArrayList<>());
    }
}
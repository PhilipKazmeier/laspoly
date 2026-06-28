/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 *  javafx.collections.FXCollections
 *  javafx.collections.ObservableList
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Alert
 *  javafx.scene.control.Alert$AlertType
 *  javafx.scene.control.Button
 *  javafx.scene.control.ButtonType
 *  javafx.scene.image.ImageView
 */
package de.hhn.seb.labsw.laspoly.network.client;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import de.hhn.seb.labsw.laspoly.main.Main;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import de.hhn.seb.labsw.laspoly.network.client.Client;
import de.hhn.seb.labsw.laspoly.network.client.listeners.GameListListener;
import de.hhn.seb.labsw.laspoly.network.client.listeners.GameListener;
import de.hhn.seb.labsw.laspoly.network.client.listeners.HeartbeatListener;
import de.hhn.seb.labsw.laspoly.network.client.listeners.RunningGameListener;
import de.hhn.seb.labsw.laspoly.utils.DateTimeConverter;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FigureSource;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.BaseController;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import de.hhn.seb.labsw.laspoly.view.lobby.LobbyController;
import de.hhn.seb.labsw.laspoly.model.Player;
import java.lang.reflect.Type;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.ResourceBundle;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.image.ImageView;
import javax.ws.rs.ProcessingException;
import javax.ws.rs.ServiceUnavailableException;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriBuilder;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.client.authentication.HttpAuthenticationFeature;
import org.glassfish.jersey.media.sse.EventSource;
import org.glassfish.jersey.media.sse.SseFeature;
import org.joda.time.DateTime;
import org.json.JSONArray;
import org.json.JSONException;

public class ServerClient
implements Client {
    public static final String PRODUCTION_SERVER = "https://laspoly.brianwirth.de/laspoly/";
    private static final String PRODUCTION_BASIC_USER = "laspoly";
    private static final String PRODUCTION_BASIC_PASSWORD = "sbpp";
    public static final String[] SERVER_ADDRESSES = new String[]{"http://localhost:8080/laspoly/", "http://localhost:8090/laspoly/", PRODUCTION_SERVER};
    private static final String JSON_MEDIA_TYPE = "application/json";
    public static final String CURRENT_SERVER_ADDRESS = Main.getServerAddress();
    private final WebTarget target;
    private final ObservableList<Game> gamesList;
    private final Gson gson;
    private final Logger logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/network/client/client_logging.properties");
    private final User user;
    private static final long SSE_STALE_TIMEOUT_MS = 45_000L;
    private static final long SSE_WATCHDOG_INTERVAL_MS = 5_000L;
    private static final long SSE_RECONNECT_DELAY_MS = 1_000L;
    private static final int ACTION_MAX_RETRIES = 3;
    private static final long ACTION_RETRY_DELAY_MS = 1_000L;
    private boolean errorAlertShown;
    private EventSource eventSource;
    private javax.ws.rs.client.Client sseClient;
    private BaseController controller;
    private Client.ServerUpdate currentUpdate;
    private volatile boolean intentionalStop;
    private volatile boolean reconnecting;
    private volatile long lastEventTime;
    private Timer connectionWatchdog;
    private final ExecutorService actionExecutor = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "game-action-queue");
        thread.setDaemon(true);
        return thread;
    });

    public ServerClient(User clientUser) {
        this.user = clientUser;
        ClientConfig configuration = this.configureClient(new ClientConfig());
        javax.ws.rs.client.Client client = ((ClientBuilder)ClientBuilder.newBuilder().register(SseFeature.class)).withConfig(configuration).build();
        this.target = client.target(UriBuilder.fromUri(CURRENT_SERVER_ADDRESS).build(new Object[0]));
        this.logger.finest("Connected to " + String.valueOf(this.target));
        this.gamesList = FXCollections.observableArrayList();
        this.gson = new GsonBuilder().registerTypeAdapter((Type)(DateTime.class), new DateTimeConverter()).create();
        this.register(this.user);
        this.login();
    }

    @Override
    public final User getUser() {
        return this.user;
    }

    @Override
    public final void register(User userToRegister) {
        try (Response response = this.target.path("users").path("register").request().accept("application/json").post(Entity.entity(this.gson.toJson(userToRegister), JSON_MEDIA_TYPE))) {
            if (response.getStatus() == Response.Status.OK.getStatusCode()) {
                User temp = this.gson.fromJson(response.readEntity(String.class), User.class);
                this.user.setId(temp.getId());
            } else {
                this.logger.severe("Registering failed: " + response.readEntity(String.class));
            }
            this.logger.fine("Successfully registered user: " + userToRegister);
        }
        catch (ProcessingException e) {
            this.showErrorMessage(e.getCause());
        }
        catch (ServiceUnavailableException e) {
            this.showErrorMessage(e);
        }
    }

    @Override
    public final void login() {
        try (Response response = this.target.path("users").path("login").request().accept("application/json").post(Entity.entity(this.gson.toJson(this.user), JSON_MEDIA_TYPE))) {
            if (response.getStatus() == Response.Status.INTERNAL_SERVER_ERROR.getStatusCode()) {
                this.logger.severe("Login failed: " + response.readEntity(String.class));
            }
            this.logger.fine("Successfully logged in user");
        }
        catch (ProcessingException e) {
            this.showErrorMessage(e.getCause());
        }
        catch (ServiceUnavailableException e) {
            this.showErrorMessage(e);
        }
    }

    @Override
    public final void logout() {
        try (Response response = this.target.path("users").path("logout").request().accept("application/json").post(Entity.entity(this.gson.toJson(this.user), JSON_MEDIA_TYPE))) {
            if (response.getStatus() != Response.Status.OK.getStatusCode()) {
                this.logger.severe("Logout failed: " + response.readEntity(String.class));
            }
            this.logger.fine("Successfully logged out user");
        }
        catch (ProcessingException e) {
            this.showErrorMessage(e.getCause());
        }
        catch (ServiceUnavailableException e) {
            this.showErrorMessage(e);
        }
    }

    @Override
    public void notifyUserDataChanged() {
        try (Response response = this.target.path("users").path("changeData").request().accept("application/json").post(Entity.entity(this.gson.toJson(this.user), JSON_MEDIA_TYPE))) {
            if (response.getStatus() != Response.Status.OK.getStatusCode()) {
                this.logger.severe("User data change failed: " + response.readEntity(String.class));
            }
            this.logger.fine("Successfully changed data of user on the server");
        }
        catch (ProcessingException e) {
            this.showErrorMessage(e.getCause());
        }
        catch (ServiceUnavailableException e) {
            this.showErrorMessage(e);
        }
    }

    @Override
    public final ObservableList<Game> getGamesList() {
        this.logger.fine("Return " + String.valueOf(this.gamesList));
        return this.gamesList;
    }

    @Override
    public final Game addGame(String name, User host) {
        try (Response response = this.target.path("games").path("add").request().accept("application/json").post(Entity.entity("[" + this.gson.toJson(name) + ", " + this.gson.toJson(host) + "]", JSON_MEDIA_TYPE))) {
            if (response.getStatus() == Response.Status.OK.getStatusCode()) {
                Game game = this.gson.fromJson(response.readEntity(String.class), Game.class);
                this.gamesList.add(game);
                this.logger.fine("Successfully added game to the server: " + game.toString());
                return game;
            }
            this.logger.severe("Adding game failed:" + response.readEntity(String.class));
        }
        catch (ProcessingException e) {
            this.showErrorMessage(e.getCause());
        }
        catch (ServiceUnavailableException e) {
            this.showErrorMessage(e);
        }
        return null;
    }

    @Override
    public final void removeGame(Game game) {
        try (Response response = this.target.path("games").path("remove").request().accept("application/json").post(Entity.entity(this.gson.toJson(game), JSON_MEDIA_TYPE))) {
            if (response.getStatus() != Response.Status.OK.getStatusCode()) {
                this.logger.severe("Removing game failed: " + response.readEntity(String.class));
            }
            this.logger.fine("Successfully removed game from the server: " + game.toString());
        }
        catch (ProcessingException e) {
            this.showErrorMessage(e.getCause());
        }
        catch (ServiceUnavailableException e) {
            this.showErrorMessage(e);
        }
    }

    @Override
    public final HashMap<User, FigureSource> notifyGameLobbyOpened(Game game) {
        this.logger.info("Game: " + String.valueOf(game));
        this.logger.info("User: " + String.valueOf(this.getUser()));
        try (Response response = this.target.path("games").path("addUser").request().accept("application/json").post(Entity.entity("[" + this.gson.toJson(game) + ", " + this.gson.toJson(this.getUser()) + "]", JSON_MEDIA_TYPE))) {
            if (response.getStatus() == Response.Status.OK.getStatusCode()) {
                HashMap<User, FigureSource> figures = new HashMap<User, FigureSource>();
                String json = response.readEntity(String.class);
                JSONArray array = new JSONArray(json);
                for (int i = 0; i < array.length(); ++i) {
                    JSONArray temp = new JSONArray(array.get(i).toString());
                    User tempUser = this.gson.fromJson(temp.get(0).toString(), User.class);
                    if (!temp.isNull(1)) {
                        FigureSource source = this.gson.fromJson(temp.get(1).toString(), FigureSource.class);
                        figures.put(tempUser, source);
                    }
                }
                this.logger.fine("Successfully notified server that gamelobby was opened");
                return figures;
            }
            this.logger.severe("Adding user failed: " + response.getStatus() + " / " + response.readEntity(String.class));
        }
        catch (ProcessingException e) {
            this.showErrorMessage(e.getCause());
        }
        catch (ServiceUnavailableException e) {
            this.showErrorMessage(e);
        }
        catch (JSONException e) {
            this.logger.severe("Couldn't parse addUser response: " + e.getMessage());
        }
        return new HashMap<User, FigureSource>();
    }

    @Override
    public final void notifyGameLobbyClosed(Game game) {
        this.removeUserFromGame(game, this.getUser());
        this.logger.fine("Successfully notified server that game lobby was closed");
    }

    @Override
    public final void initializeGame(Game game) {
        try (Response response = this.target.path("games").path("start").request().accept("application/json").post(Entity.entity(this.gson.toJson(game), JSON_MEDIA_TYPE))) {
            this.logger.fine("Successfully initialized game: " + game.toString());
            this.logger.fine("Initialize Game: " + response.getStatus());
        }
        catch (ProcessingException e) {
            this.showErrorMessage(e.getCause());
        }
        catch (ServiceUnavailableException e) {
            this.showErrorMessage(e);
        }
    }

    @Override
    public void removeUserFromGame(Game game, User userToRemove) {
        try (Response response = this.target.path("games").path("removeUser").request().accept("application/json").post(Entity.entity("[" + this.gson.toJson(game) + ", " + this.gson.toJson(userToRemove) + "]", JSON_MEDIA_TYPE))) {
            if (response.getStatus() != Response.Status.OK.getStatusCode()) {
                this.logger.severe("Removing user failed: " + response.getStatus() + " / " + response.getStatusInfo().toString());
            }
        }
        catch (ProcessingException e) {
            this.showErrorMessage(e.getCause());
        }
        catch (ServiceUnavailableException e) {
            this.showErrorMessage(e);
        }
    }

    @Override
    public void listenToServer(BaseController baseController, Client.ServerUpdate update) {
        this.logger.fine("Starting new event source");
        this.intentionalStop = false;
        this.controller = baseController;
        this.currentUpdate = update;
        this.lastEventTime = System.currentTimeMillis();
        try {
            this.openEventSource(update);
            this.startConnectionWatchdog();
        }
        catch (ProcessingException e) {
            this.showErrorMessage(e.getCause());
        }
        catch (ServiceUnavailableException e) {
            this.showErrorMessage(e);
        }
    }

    @Override
    public void stopListening() {
        this.logger.fine("Stopping event source");
        this.intentionalStop = true;
        this.stopConnectionWatchdog();
        this.controller = null;
        this.currentUpdate = null;
        ThreadRunner.run(new EventSourceCloser(this.eventSource, this.sseClient));
        this.eventSource = null;
        this.sseClient = null;
    }

    public void notifySseEventReceived() {
        this.lastEventTime = System.currentTimeMillis();
    }

    private void openEventSource(Client.ServerUpdate update) {
        this.closeEventSourceQuietly();
        this.sseClient = ((ClientBuilder)ClientBuilder.newBuilder().register(SseFeature.class)).withConfig(this.configureClient(new ClientConfig())).build();
        if (update.equals(Client.ServerUpdate.GAME)) {
            Game game = this.controller.getMainWindowController().getGame();
            WebTarget sseTarget = this.sseClient.target(CURRENT_SERVER_ADDRESS + "games/listenToGame/" + game.getId());
            this.eventSource = EventSource.target(sseTarget).usePersistentConnections().build();
            GameListener listener = new GameListener(this);
            RunningGameListener gameListener = new RunningGameListener(this);
            HeartbeatListener heartbeatListener = new HeartbeatListener(this);
            this.eventSource.register(listener, "game", new String[0]);
            this.eventSource.register(gameListener, "gameRunning", new String[0]);
            this.eventSource.register(heartbeatListener, "heartbeat", new String[0]);
            this.eventSource.open();
            this.logger.info("SSE game stream opened for game " + game.getId());
        } else if (update.equals(Client.ServerUpdate.GAMES_LIST)) {
            WebTarget sseTarget = this.sseClient.target(CURRENT_SERVER_ADDRESS + "games/listenToGames");
            this.eventSource = EventSource.target(sseTarget).usePersistentConnections().build();
            GameListListener gamesListListener = new GameListListener(this);
            this.eventSource.register(gamesListListener, "gameslist", new String[0]);
            this.eventSource.open();
            try (Response response = this.target.path("games").request().accept("application/json").get()) {
                this.updateGamesList(response.readEntity(String.class));
            }
            this.logger.info("SSE games list stream opened");
        }
        this.lastEventTime = System.currentTimeMillis();
    }

    private void closeEventSourceQuietly() {
        EventSource source = this.eventSource;
        javax.ws.rs.client.Client client = this.sseClient;
        this.eventSource = null;
        this.sseClient = null;
        if (source != null) {
            try {
                source.close();
            }
            catch (Exception e) {
                this.logger.fine("Error closing event source: " + e.getMessage());
            }
        }
        if (client != null) {
            try {
                client.close();
            }
            catch (Exception e) {
                this.logger.fine("Error closing SSE client: " + e.getMessage());
            }
        }
    }

    private void startConnectionWatchdog() {
        this.stopConnectionWatchdog();
        this.connectionWatchdog = new Timer("sse-watchdog", true);
        this.connectionWatchdog.scheduleAtFixedRate(new TimerTask(){

            @Override
            public void run() {
                ServerClient.this.checkConnectionHealth();
            }
        }, SSE_WATCHDOG_INTERVAL_MS, SSE_WATCHDOG_INTERVAL_MS);
    }

    private void stopConnectionWatchdog() {
        if (this.connectionWatchdog != null) {
            this.connectionWatchdog.cancel();
            this.connectionWatchdog = null;
        }
    }

    private void checkConnectionHealth() {
        if (this.intentionalStop || this.controller == null || this.currentUpdate == null) {
            return;
        }
        EventSource source = this.eventSource;
        if (source == null) {
            this.scheduleReconnect("SSE event source is null");
            return;
        }
        if (!source.isOpen()) {
            this.scheduleReconnect("SSE connection closed");
            return;
        }
        if (System.currentTimeMillis() - this.lastEventTime > SSE_STALE_TIMEOUT_MS) {
            this.scheduleReconnect("SSE stale (no heartbeat for " + SSE_STALE_TIMEOUT_MS / 1000 + "s)");
        }
    }

    private void scheduleReconnect(String reason) {
        if (this.intentionalStop || this.reconnecting || this.controller == null || this.currentUpdate == null) {
            return;
        }
        this.reconnecting = true;
        this.logger.warning("Scheduling SSE reconnect: " + reason);
        ThreadRunner.run(() -> {
            try {
                if (this.intentionalStop || this.controller == null || this.currentUpdate == null) {
                    return;
                }
                Client.ServerUpdate update = this.currentUpdate;
                this.closeEventSourceQuietly();
                Thread.sleep(SSE_RECONNECT_DELAY_MS);
                if (this.intentionalStop || this.controller == null) {
                    return;
                }
                this.openEventSource(update);
                this.logger.info("SSE reconnected successfully");
                if (update.equals(Client.ServerUpdate.GAME)) {
                    this.syncGameStateAfterReconnect();
                } else if (update.equals(Client.ServerUpdate.GAMES_LIST)) {
                    try (Response response = this.target.path("games").request().accept("application/json").get()) {
                        this.updateGamesList(response.readEntity(String.class));
                    }
                }
            }
            catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            catch (Exception e) {
                this.logger.severe("SSE reconnect failed: " + e.getMessage());
            }
            finally {
                this.reconnecting = false;
            }
        });
    }

    private void syncGameStateAfterReconnect() {
        BaseController ctrl = this.controller;
        if (!(ctrl instanceof GameController)) {
            return;
        }
        GameController gameController = (GameController)ctrl;
        Game game = ctrl.getMainWindowController().getGame();
        if (game == null) {
            return;
        }
        try (Response response = this.target.path("games").path("getgame").request().accept("application/json").post(Entity.entity(this.gson.toJson(game), "application/json"))) {
            if (response.getStatus() != Response.Status.OK.getStatusCode()) {
                this.logger.warning("Game no longer exists on server after reconnect");
                Platform.runLater(() -> gameController.showLostGameDialog("lostConnection"));
                return;
            }
            Game serverGame = this.gson.fromJson(response.readEntity(String.class), Game.class);
            User me = this.user;
            boolean stillInGame = serverGame.getUsers().stream().anyMatch(u -> u.equals(me));
            if (!stillInGame) {
                this.logger.warning("Player no longer in game after reconnect");
                Platform.runLater(() -> gameController.showLostGameDialog("lostConnection"));
                return;
            }
            ArrayList<User> localUsers = new ArrayList<User>();
            for (Player player : gameController.getPlayers()) {
                localUsers.add(player.getUser());
            }
            for (User localUser : localUsers) {
                boolean onServer = serverGame.getUsers().stream().anyMatch(u -> u.equals(localUser));
                if (!onServer) {
                    this.logger.info("Syncing missed player leave: " + localUser.getName());
                    Platform.runLater(() -> {
                        gameController.removePlayer(localUser, "leave");
                        gameController.checkIfWon("leave", localUser);
                    });
                }
            }
            if (serverGame.getUsers().size() == 1 && serverGame.getUsers().get(0).equals(me)) {
                User opponent = localUsers.stream().filter(u -> !u.equals(me)).findFirst().orElse(me);
                Platform.runLater(() -> gameController.checkIfWon("leave", opponent));
            }
        }
        catch (Exception e) {
            this.logger.severe("Failed to sync game state after reconnect: " + e.getMessage());
        }
    }

    @Override
    public void addAction(Action action, Game game) {
        this.actionExecutor.execute(() -> this.sendAction(action, game));
    }

    private void sendAction(Action action, Game game) {
        ActionType type = action.getType();
        String jsonArray = "[" + this.gson.toJson(game) + ",[" + this.gson.toJson(type) + "," + this.gson.toJson(action) + "]]";
        for (int attempt = 1; attempt <= ACTION_MAX_RETRIES; ++attempt) {
            try {
                try (Response response = this.target.path("games").path("gameAction").request().accept("application/json").post(Entity.entity(jsonArray, JSON_MEDIA_TYPE))) {
                    int status = response.getStatus();
                    if (status == Response.Status.OK.getStatusCode()) {
                        this.logger.info("Added action: " + action.toString());
                        return;
                    }
                    String body = response.readEntity(String.class);
                    if (status == Response.Status.BAD_REQUEST.getStatusCode()) {
                        this.logger.warning("Server rejected action: " + status + " / " + body);
                        if (this.isInRunningGame()) {
                            ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ERROR, this.getUser().getLocale());
                            this.showInGameNetworkWarning(bundle.getString("action_rejected_header"), bundle.getString("action_rejected_message"), bundle.getString("action_rejected_title"));
                        }
                        return;
                    }
                    this.logger.severe("Adding action failed: " + status + " / " + body);
                    if (attempt < ACTION_MAX_RETRIES) {
                        Thread.sleep(ACTION_RETRY_DELAY_MS);
                        continue;
                    }
                    if (this.isInRunningGame()) {
                        ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ERROR, this.getUser().getLocale());
                        this.showInGameNetworkWarning(bundle.getString("network_warning_header"), bundle.getString("network_warning_message"), bundle.getString("network_warning_title"));
                    }
                    return;
                }
            }
            catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
            catch (ProcessingException e) {
                this.logger.log(Level.SEVERE, "Adding action failed (attempt " + attempt + "/" + ACTION_MAX_RETRIES + ")", e);
                if (attempt < ACTION_MAX_RETRIES) {
                    try {
                        Thread.sleep(ACTION_RETRY_DELAY_MS);
                    }
                    catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                    continue;
                }
                if (this.isInRunningGame()) {
                    ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ERROR, this.getUser().getLocale());
                    this.showInGameNetworkWarning(bundle.getString("network_warning_header"), bundle.getString("network_warning_message"), bundle.getString("network_warning_title"));
                } else {
                    this.showErrorMessage(e.getCause() != null ? e.getCause() : e);
                }
                return;
            }
            catch (ServiceUnavailableException e) {
                this.logger.log(Level.SEVERE, "Adding action failed (attempt " + attempt + "/" + ACTION_MAX_RETRIES + ")", e);
                if (attempt < ACTION_MAX_RETRIES) {
                    try {
                        Thread.sleep(ACTION_RETRY_DELAY_MS);
                    }
                    catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                        return;
                    }
                    continue;
                }
                if (this.isInRunningGame()) {
                    ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ERROR, this.getUser().getLocale());
                    this.showInGameNetworkWarning(bundle.getString("network_warning_header"), bundle.getString("network_warning_message"), bundle.getString("network_warning_title"));
                } else {
                    this.showErrorMessage(e);
                }
                return;
            }
        }
    }

    private boolean isInRunningGame() {
        if (Client.ServerUpdate.GAME.equals(this.currentUpdate)) {
            return true;
        }
        BaseController ctrl = this.controller;
        return ctrl instanceof GameController;
    }

    @Override
    public void changeListeningController(BaseController baseController) {
        this.controller = baseController;
    }

    private void showErrorMessage(Throwable ex) {
        this.logger.severe(ex.getMessage());
        this.logger.severe(ex.getClass().toString());
        ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ERROR, this.getUser().getLocale());
        if (ex != null && ex.getMessage() != null) {
            this.logger.severe("An error occurred: " + ex.getMessage());
            if (this.isInRunningGame()) {
                if (ex instanceof UnknownHostException || ex instanceof ConnectException || ex instanceof SocketTimeoutException || ex instanceof ServiceUnavailableException || ex instanceof IllegalStateException) {
                    this.showInGameNetworkWarning(bundle.getString("network_warning_header"), bundle.getString("network_warning_message"), bundle.getString("network_warning_title"));
                } else {
                    this.showInGameNetworkWarning(bundle.getString("header"), ex.getMessage(), bundle.getString("title"));
                }
                return;
            }
            if (ex instanceof UnknownHostException) {
                this.showErrorMessage(bundle.getString("unknown_host_header"), bundle.getString("unknown_host_message"), bundle.getString("unknown_host_title"));
            } else if (ex instanceof JSONException) {
                this.showErrorMessage(bundle.getString("no_games_header"), bundle.getString("no_games_message"), bundle.getString("no_games_title"));
            } else if (ex instanceof SocketTimeoutException) {
                this.showErrorMessage(bundle.getString("timeout_header"), bundle.getString("timeout_message"), bundle.getString("timeout_title"));
            } else if (ex instanceof ServiceUnavailableException) {
                this.showErrorMessage(bundle.getString("service_header"), bundle.getString("service_message"), bundle.getString("service_title"));
            } else if (ex instanceof ConnectException) {
                this.showErrorMessage(bundle.getString("illigalstate_header"), bundle.getString("illigalstate_message"), bundle.getString("illigalstate_title"));
            } else if (ex instanceof IllegalStateException) {
                this.showErrorMessage(bundle.getString("illigalstate_header"), bundle.getString("illigalstate_message"), bundle.getString("illigalstate_title"));
            } else {
                this.showErrorMessage(ex.getMessage());
            }
            return;
        }
        this.showErrorMessage("Given exception is null");
    }

    private synchronized void showErrorMessage(String message) {
        ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ERROR, this.getUser().getLocale());
        if (!this.errorAlertShown) {
            this.errorAlertShown = true;
            boolean inGame = this.isInRunningGame();
            Platform.runLater(() -> {
                Alert errorAlert = new Alert(inGame ? Alert.AlertType.WARNING : Alert.AlertType.ERROR);
                errorAlert.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
                errorAlert.getDialogPane().getStyleClass().add("alertStyle");
                errorAlert.setHeaderText(bundle.getString("header"));
                errorAlert.setTitle(bundle.getString("title"));
                errorAlert.setContentText(message);
                Button okButton = (Button)errorAlert.getDialogPane().lookupButton(ButtonType.OK);
                ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
                checkView.setFitHeight(25.0);
                checkView.setFitWidth(25.0);
                okButton.setGraphic((Node)checkView);
                okButton.setCursor(Cursor.HAND);
                okButton.getStyleClass().add("greenActionButton");
                errorAlert.showAndWait().ifPresent(e -> {
                    this.errorAlertShown = false;
                    if (!inGame) {
                        System.exit(-1);
                    }
                });
            });
        }
    }

    private synchronized void showErrorMessage(String header, String message, String title) {
        if (!this.errorAlertShown) {
            this.errorAlertShown = true;
            boolean inGame = this.isInRunningGame();
            Platform.runLater(() -> {
                Alert errorAlert = new Alert(inGame ? Alert.AlertType.WARNING : Alert.AlertType.ERROR);
                errorAlert.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
                errorAlert.getDialogPane().getStyleClass().add("alertStyle");
                errorAlert.setHeaderText(header);
                errorAlert.setTitle(title);
                errorAlert.setContentText(message);
                Button okButton = (Button)errorAlert.getDialogPane().lookupButton(ButtonType.OK);
                ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
                checkView.setFitHeight(25.0);
                checkView.setFitWidth(25.0);
                okButton.setGraphic((Node)checkView);
                okButton.setCursor(Cursor.HAND);
                okButton.getStyleClass().add("greenActionButton");
                errorAlert.showAndWait().ifPresent(e -> {
                    this.errorAlertShown = false;
                    if (!inGame) {
                        System.exit(-1);
                    }
                });
            });
        }
    }

    private synchronized void showInGameNetworkWarning(String header, String message, String title) {
        if (!this.errorAlertShown) {
            this.errorAlertShown = true;
            Platform.runLater(() -> {
                Alert errorAlert = new Alert(Alert.AlertType.WARNING);
                errorAlert.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
                errorAlert.getDialogPane().getStyleClass().add("alertStyle");
                errorAlert.setHeaderText(header);
                errorAlert.setTitle(title);
                errorAlert.setContentText(message);
                Button okButton = (Button)errorAlert.getDialogPane().lookupButton(ButtonType.OK);
                ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
                checkView.setFitHeight(25.0);
                checkView.setFitWidth(25.0);
                okButton.setGraphic((Node)checkView);
                okButton.setCursor(Cursor.HAND);
                okButton.getStyleClass().add("greenActionButton");
                errorAlert.showAndWait().ifPresent(e -> {
                    this.errorAlertShown = false;
                });
            });
        }
    }

    public void updateGamesList(String gameJson) {
        block6: {
            try {
                if (this.updateIsRunning() && this.controller instanceof LobbyController) {
                    this.logger.fine("Update gameslist");
                    ArrayList<Game> games = new ArrayList<Game>();
                    JSONArray array = new JSONArray(gameJson);
                    for (int i = 0; i < array.length(); ++i) {
                        games.add(this.gson.fromJson(array.get(i).toString(), Game.class));
                    }
                    if (games.isEmpty()) {
                        this.gamesList.clear();
                    } else {
                        this.gamesList.setAll(games);
                    }
                }
            }
            catch (Exception e) {
                if ((!(e instanceof JSONException) || !gameJson.isEmpty()) && gameJson != null) break block6;
                this.logger.log(Level.SEVERE, "No games to update");
                this.showErrorMessage(e);
            }
        }
    }

    public void handleRunningGameEventFailure(ActionType type, Exception e) {
        String typeLabel = type != null ? type.name() : "unknown";
        this.logger.log(Level.SEVERE, "Failed to apply game event " + typeLabel, e);
        ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ERROR, this.getUser().getLocale());
        String message = type != null ? String.format(bundle.getString("game_event_failure_message"), typeLabel) : bundle.getString("game_event_failure_parse_message");
        this.showRunningGameEventError(bundle.getString("game_event_failure_header"), message, bundle.getString("game_event_failure_title"));
        ThreadRunner.run(this::syncGameStateAfterReconnect);
    }

    private synchronized void showRunningGameEventError(String header, String message, String title) {
        if (!this.errorAlertShown) {
            this.errorAlertShown = true;
            Platform.runLater(() -> {
                Alert errorAlert = new Alert(Alert.AlertType.WARNING);
                errorAlert.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
                errorAlert.getDialogPane().getStyleClass().add("alertStyle");
                errorAlert.setHeaderText(header);
                errorAlert.setTitle(title);
                errorAlert.setContentText(message);
                Button okButton = (Button)errorAlert.getDialogPane().lookupButton(ButtonType.OK);
                ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
                checkView.setFitHeight(25.0);
                checkView.setFitWidth(25.0);
                okButton.setGraphic((Node)checkView);
                okButton.setCursor(Cursor.HAND);
                okButton.getStyleClass().add("greenActionButton");
                errorAlert.showAndWait().ifPresent(e -> {
                    this.errorAlertShown = false;
                });
            });
        }
    }

    protected WebTarget getTarget() {
        return this.target;
    }

    private ClientConfig configureClient(ClientConfig configuration) {
        if (CURRENT_SERVER_ADDRESS.startsWith("https://laspoly.brianwirth.de")) {
            configuration.register(HttpAuthenticationFeature.basic(PRODUCTION_BASIC_USER, PRODUCTION_BASIC_PASSWORD));
        }
        return configuration;
    }

    public boolean updateIsRunning() {
        return this.eventSource != null;
    }

    public BaseController getController() {
        return this.controller;
    }

    private class EventSourceCloser
    implements Runnable {
        private EventSource eventSource;
        private javax.ws.rs.client.Client sseClient;

        public EventSourceCloser(EventSource source, javax.ws.rs.client.Client client) {
            this.eventSource = source;
            this.sseClient = client;
        }

        @Override
        public void run() {
            if (this.eventSource != null) {
                this.eventSource.close();
                this.eventSource = null;
            }
            if (this.sseClient != null) {
                this.sseClient.close();
                this.sseClient = null;
            }
        }
    }
}


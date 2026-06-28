package de.hhn.labsw.laspoly.network.client;

import com.google.gson.Gson;
import de.hhn.labsw.laspoly.main.Main;
import de.hhn.labsw.laspoly.model.Game;
import de.hhn.labsw.laspoly.model.User;
import de.hhn.labsw.laspoly.network.server.Server;
import de.hhn.labsw.laspoly.utils.IOUtils;
import de.hhn.labsw.laspoly.utils.StorageUtils;
import de.hhn.labsw.laspoly.view.game.GameWindow;
import de.hhn.labsw.laspoly.view.game.GameWindowController;
import de.hhn.labsw.laspoly.view.game.lobby.GameLobbyController;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.control.Alert;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.URL;
import java.net.URLConnection;
import java.util.Optional;
import java.util.ResourceBundle;
import java.util.logging.Logger;

/**
 * Class representing the client of a client-server-connection. This class connects to a running instance of {@link
 * de.hhn.labsw.laspoly.network.server.Server}.
 */
public class Client {

    /**
     * Boolean whether the user is known by the server or not.
     */
    public static boolean NEW_USER = true;

    /**
     * {@link java.util.logging.Logger} of this class.
     */
    private Logger logger;

    /**
     * {@link User} that is using this client.
     */
    private User user;


    /**
     * {@link javafx.collections.ObservableList} of all {@link Game} that are requested from the {@link
     * de.hhn.labsw.laspoly.network.server.Server}. There could be more active {@link Game} on the {@link
     * de.hhn.labsw.laspoly.network.server.Server}.
     */
    private ObservableList<Game> gamesList;

    /**
     * The Controller of the {@link de.hhn.labsw.laspoly.view.game.lobby.GameLobby}. Null if there is no {@link
     * de.hhn.labsw.laspoly.view.game.lobby.GameLobby} open.
     */
    private GameLobbyController gameLobbyController = null;

    /**
     * The Controller of the {@link de.hhn.labsw.laspoly.view.game.GameWindow}. Null if there is no {@link
     * de.hhn.labsw.laspoly.view.game.GameWindow}.
     */
    private GameWindowController gameWindowController = null;

    /**
     * Global instance of {@link com.google.gson.Gson}.
     */
    private Gson gson;

    /**
     * Constructor.
     *
     * @param user {@link User} that will use this client.
     */
    public Client(User user) {
        logger = IOUtils.initializeLogger(Client.class, "de/hhn/labsw/laspoly/network/client/client_logging" + "" +
                ".properties");
        gson = new Gson();
        gamesList = FXCollections.observableArrayList();
        addUser(user);
    }

    /**
     * Method called if connection was refused by the server.
     */
    private void connectionRefused() {
        logger.info("Connection was refused by the server.");
        ResourceBundle bundle = ResourceBundle.getBundle("de.hhn.labsw.laspoly.network.client.ErrorNotConnected",
                Main.getLocale());
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(bundle.getString("title"));
        alert.setHeaderText(bundle.getString("header"));
        alert.setContentText(bundle.getString("content"));
        Optional o = alert.showAndWait();
        o.ifPresent(e -> System.exit(0));
    }


    /**
     * Adds a user to the server.
     *
     * @param user {@link de.hhn.labsw.laspoly.model.User} that is added.
     */
    private void addUser(User user) {
        logger.info("addUser");
        this.user = user;
        try {
            URLConnection connection;
            if (NEW_USER) {
                connection = standardOutputConnection(Server.HTTP_ADDRESS + "/user/add");
            } else {
                connection = standardOutputConnection(Server.HTTP_ADDRESS + "/user/login");
            }

            writeToOutput(connection.getOutputStream(), gson.toJson(user));

            String response = readResponse(connection.getInputStream());
            JSONObject object = new JSONObject(response);
            int id = (int) object.get("id");
            if (user.getId() != id) {
                user.setId(id);
                StorageUtils.writeUserData(user);
            }
        } catch (Exception e) {
            logger.severe(e.getMessage());
            if (e.getMessage().equals("Connection refused")) {
                connectionRefused();
            }
        }
    }

    /**
     * Creates a game and sends it to the server.
     *
     * @param name Name of the {@link de.hhn.labsw.laspoly.model.Game}.
     *
     * @return Created {@link de.hhn.labsw.laspoly.model.Game}.
     */
    public Game createGame(String name) {
        logger.info("createGame: " + name);
        Game game = new Game(name, user);
        try {
            URLConnection connection = standardOutputConnection(Server.HTTP_ADDRESS + "/game/add");

            writeToOutput(connection.getOutputStream(), gson.toJson(user));

            String response = readResponse(connection.getInputStream());
            logger.fine("Succesfully sended game to server.");
            JSONObject object = new JSONObject(response);
            int id = (int) object.get("id");
            game.setId(id);
        } catch (Exception e) {
            logger.severe(e.getMessage());
            if (e.getMessage().equals("Connection refused")) {
                connectionRefused();
            }
        }
        return game;
    }

    /**
     * Requests a list of all {@link de.hhn.labsw.laspoly.model.Game} from the server.
     *
     * @return List of all {@link de.hhn.labsw.laspoly.model.Game}
     */
    public ObservableList<Game> getAllGames() {
        logger.info("getAllGames");
        try {
            URLConnection connection = standardConnection(Server.HTTP_ADDRESS + "/game/getAll");
            String response = readResponse(connection.getInputStream());
            JSONArray array = new JSONArray(response);
            gamesList.clear();
            for (int i = 0; i < array.length(); i++) {
                gamesList.add(gson.fromJson(array.get(i).toString(), Game.class));
            }
        } catch (Exception e) {
            logger.severe(e.getMessage());
            if (e.getMessage().equals("Connection refused")) {
                connectionRefused();
            }
        }
        return gamesList;
    }

    /**
     * Notifies the server that the gamelobby was opened by a user (only if user is not host)
     *
     * @param controller {@link de.hhn.labsw.laspoly.view.game.lobby.GameLobbyController} of the game.
     */
    public void notifyGameLobbyOpened(GameLobbyController controller) {
        logger.info("notifyGameLobbyOpened: " + String.valueOf(controller));
        gameLobbyController = controller;
        if (gameLobbyController.getGameLobby().getGame().getHost() != getUser()) {
            try {
                URLConnection connection = standardOutputConnection(Server.HTTP_ADDRESS + "/game/addUser");
                connection.setDoOutput(true);

                Game game = controller.getGameLobby().getGame();
                String gameJson = gson.toJson(game);
                String userJson = gson.toJson(user);
                String json = "[" + gameJson + userJson + "]";

                writeToOutput(connection.getOutputStream(), json);

                String response = readResponse(connection.getInputStream());
                JSONObject object = new JSONObject(response);
                game.setName((String) object.get("name"));
                JSONArray array = new JSONArray(object.get("users").toString());
                for (int i = 0; i < array.length(); i++) {
                    User user = gson.fromJson((String) array.get(i), User.class);
                    if (!game.getUsers().contains(user)) {
                        game.getUsers().add(user);
                    }
                }

            } catch (Exception e) {
                logger.severe(e.getMessage());
                if (e.getMessage().equals("Connection refused")) {
                    connectionRefused();
                }
            }
        }
        // TODO es muss nun alle paar Sekunden updateGame aufgerufen werden und damit muss das Game aktualisiert werden
        // sollte beim aktualisieren ein leerer json string zurück kommen wurde das spiel vom host beendet
    }

    /**
     * Notifies the server that user left the game.
     *
     * @param game {@link de.hhn.labsw.laspoly.model.Game} the user left.
     */
    public void notifyGameLobbyClosed(Game game) {
        logger.info("notifyGameLobbyClosed: " + String.valueOf(game));
        try {
            URLConnection connection;
            if (game.getHost() == getUser()) {
                connection = standardOutputConnection(Server.HTTP_ADDRESS + "/game/remove");
            } else {
                connection = standardOutputConnection(Server.HTTP_ADDRESS + "/game/removeUser");
            }
            writeToOutput(connection.getOutputStream(), gson.toJson(game));
            readResponse(connection.getInputStream());
        } catch (Exception e) {
            logger.severe(e.getMessage());
            if (e.getMessage().equals("Connection refused")) {
                connectionRefused();
            }
        }
    }

    /**
     * Notifies the server when the user closes the program.
     */
    public void notifyExited() {
        logger.info("notifyExited");
        try {
            URLConnection connection = standardOutputConnection(Server.HTTP_ADDRESS + "/user/logout");
            writeToOutput(connection.getOutputStream(), gson.toJson(user));
            String response = readResponse(connection.getInputStream());
            JSONObject object = new JSONObject(response);
            int id = (int) object.get("id");
            if (user.getId() != id) {
                user.setId(id);
                StorageUtils.writeUserData(user);
            }
        } catch (Exception e) {
            logger.severe(e.getMessage());
            if (e.getMessage().equals("Connection refused")) {
                connectionRefused();
            }
        }
        System.exit(0);
    }

    /**
     * Notifies the server that data of the user has changed.
     */
    public void notifyUserDataChanged() {
        logger.info("notifyUserDataChanged");
        try {
            URLConnection connection = standardOutputConnection(Server.HTTP_ADDRESS + "/user/dataChanged");
            writeToOutput(connection.getOutputStream(), gson.toJson(user));
            readResponse(connection.getInputStream());
        } catch (Exception e) {
            logger.severe(e.getMessage());
            if (e.getMessage().equals("Connection refused")) {
                connectionRefused();
            }
        }
    }

    /**
     * Creates a standard output connection to the given address. {@link #standardConnection}.
     *
     * @param s Address that is connected to.
     *
     * @return Connected {@link java.net.URLConnection}.
     *
     * @throws IOException Thrown by {@link #standardConnection(String)}.
     */
    private URLConnection standardOutputConnection(String s) throws IOException {
        logger.info("standardOutputConnection: " + s);
        URLConnection connection = standardConnection(s);
        connection.setDoOutput(true);
        return connection;
    }

    /**
     * Creates a standard connection to the given address. <br> Standard connection has json as content-type, a
     * connect-timeout of 5000 and a read-timeout of 5000.
     *
     * @param address Address that is connected to.
     *
     * @return Connected {@link java.net.URLConnection}.
     *
     * @throws IOException Thrown by connection problems.
     */
    private URLConnection standardConnection(String address) throws IOException {
        logger.info("standardConnection: " + address);
        URL url = new URL(address);
        URLConnection connection = url.openConnection();
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(5000);
        return connection;
    }


    /**
     * Reads a response from the {@link java.io.InputStream}.
     *
     * @param stream {@link java.io.InputStream} the response is read from.
     *
     * @return Read response string.
     *
     * @throws IOException Thrown by the {@link java.io.BufferedReader}.
     */
    private String readResponse(InputStream stream) throws IOException {
        logger.info("readResponse: " + String.valueOf(stream));
        BufferedReader in = new BufferedReader(new InputStreamReader(stream));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = in.readLine()) != null) {
            response.append(line);
        }
        logger.fine("Succesfully sended game to server.");
        in.close();
        return response.toString();
    }

    /**
     * Writes the given json string to the {@link java.io.OutputStream}.
     *
     * @param stream {@link java.io.OutputStream} the string is written on.
     * @param json   String that is written
     *
     * @throws IOException Thrown by {@link java.io.OutputStreamWriter}.
     */
    private void writeToOutput(OutputStream stream, String json) throws IOException {
        logger.info("writeToOutput: " + String.valueOf(stream) + " // " + json);
        OutputStreamWriter out = new OutputStreamWriter(stream);
        out.write(json);
        out.close();
    }

    /**
     * Initializes the {@link de.hhn.labsw.laspoly.model.Game}.
     */
    public void initializeGame() {
        logger.info("initializeGame");
        Game game = gameLobbyController.getGameLobby().getGame();
        game.start();
        try {
            URLConnection connection = standardOutputConnection(Server.HTTP_ADDRESS + "/game/start");
            writeToOutput(connection.getOutputStream(), gson.toJson(game));
            readResponse(connection.getInputStream());
        } catch (IOException e) {
            logger.severe(e.getMessage());
        }
        GameWindow gameWindow = new GameWindow(game, this);
        gameWindowController = gameWindow.getController();
        gameWindow.show();
        gameLobbyController.getGameLobby().close();
    }

    /**
     * @return {@link #user}.
     */
    public User getUser() {
        return user;
    }

    /**
     * @return {@link #gamesList}.
     */
    public ObservableList<Game> getGamesList() {
        return gamesList;
    }

}
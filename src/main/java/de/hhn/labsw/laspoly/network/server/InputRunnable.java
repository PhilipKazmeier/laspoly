package de.hhn.labsw.laspoly.network.server;

import de.hhn.labsw.laspoly.model.Game;
import de.hhn.labsw.laspoly.model.User;
import de.hhn.labsw.laspoly.utils.IOUtils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.logging.Logger;

import static de.hhn.labsw.laspoly.network.server.Commands.CLEAR_ALL_USERS;
import static de.hhn.labsw.laspoly.network.server.Commands.HELP;
import static de.hhn.labsw.laspoly.network.server.Commands.SHOW_ALL_GAMES;
import static de.hhn.labsw.laspoly.network.server.Commands.SHOW_ALL_ONLINE_USERS;
import static de.hhn.labsw.laspoly.network.server.Commands.SHOW_ALL_USERS;
import static de.hhn.labsw.laspoly.network.server.Commands.SHUTDOWN;

/**
 * Reads the command line input from the server.
 */
public class InputRunnable implements Runnable {

    /**
     * Reader that reads from the command line.
     */
    private BufferedReader reader;

    /**
     * Logger of this class.
     */
    private Logger logger;

    /**
     * Constructor.
     */
    public InputRunnable () {
        reader = new BufferedReader(new InputStreamReader(System.in));
        logger = IOUtils.initializeLogger(Server.class, "de/hhn/labsw/laspoly/network/server/server_logging" + "" +
                ".properties");
    }

    @Override
    public void run () {
        while (true) {
            try {
                String command = reader.readLine();
                switch (command) {
                    case SHUTDOWN:
                        Server.getInstance().onShutdown();
                        break;
                    case SHOW_ALL_GAMES:
                        List<Game> games = Server.getInstance().getGames();
                        logger.info(games.toString());
                        break;
                    case SHOW_ALL_USERS:
                        List<User> users = Server.getInstance().getUsers();
                        logger.info(users.toString());
                        break;
                    case SHOW_ALL_ONLINE_USERS:
                        List<User> onlineUsers = Server.getInstance().getOnlineUsers();
                        logger.info(onlineUsers.toString());
                        break;
                    case CLEAR_ALL_USERS:
                        Server.getInstance().getUsers().clear();
                        break;
                    case HELP:
                        logger.info("Known commands: \n\t" + SHUTDOWN + "\n\t" + SHOW_ALL_GAMES + "\n\t" +
                                SHOW_ALL_USERS + "\n\t" + CLEAR_ALL_USERS);
                        break;
                    default:
                        logger.info("Command not known");
                        break;
                }
                Thread.sleep(500);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}

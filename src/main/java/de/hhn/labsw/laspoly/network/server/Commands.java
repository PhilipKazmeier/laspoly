package de.hhn.labsw.laspoly.network.server;

/**
 * Console commands for the {@link de.hhn.labsw.laspoly.network.server.Server}.
 */
public class Commands {

    /**
     * Private constructor that prevents instantiation.
     */
    private Commands() {
    }

    /**
     * Command that shutdowns the {@link de.hhn.labsw.laspoly.network.server.Server}.
     */
    public static final String SHUTDOWN = "/shutdown";

    /**
     * Command that shows a list of all {@link de.hhn.labsw.laspoly.model.Game} that are registered at the {@link
     * de.hhn.labsw.laspoly.network.server.Server}.
     */
    public static final String SHOW_ALL_GAMES = "/list games";

    /**
     * Command that shows a list of all {@link de.hhn.labsw.laspoly.model.User} that are registered at the {@link
     * de.hhn.labsw.laspoly.network.server.Server}.
     */
    public static final String SHOW_ALL_USERS = "/list users";

    /**
     * Command that shows a list of all {@link de.hhn.labsw.laspoly.model.User} that are online.
     */
    public static final String SHOW_ALL_ONLINE_USERS = "/list users online";

    /**
     * Command that clears the list of all {@link de.hhn.labsw.laspoly.model.User} that are registered at the {@link
     * de.hhn.labsw.laspoly.network.server.Server}.
     */
    public static final String CLEAR_ALL_USERS = "/clear users";

    /**
     * Shows a list of all commands that are available.
     */
    public static final String HELP = "/help";

}

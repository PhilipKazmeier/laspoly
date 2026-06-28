package de.hhn.labsw.laspoly.main;

import de.hhn.labsw.laspoly.model.User;
import de.hhn.labsw.laspoly.network.client.Client;
import de.hhn.labsw.laspoly.utils.StorageUtils;
import de.hhn.labsw.laspoly.view.lobby.LobbyWindow;
import javafx.application.Application;
import javafx.scene.image.Image;
import javafx.stage.Stage;

import java.net.URL;
import java.util.Locale;

/**
 * This class is the instance of {@link javafx.application.Application} that is needed by every JavaFX application.
 */
public class Main extends Application {

    /**
     * The user who starts and plays the game.
     */
    private static User theGlobalUser;

    /**
     * Creates new instance of {@link de.hhn.labsw.laspoly.main.Main}.
     *
     * @param args Start parameters.
     */
    public static void main (String[] args) {
        launch(args);
    }

    /**
     * @return The user who starts and plays the game.
     */
    public static User getTheGlobalUser () {
        return theGlobalUser;
    }

    @Override
    public void start (Stage primaryStage) throws Exception {
        fetchUserData();
    }

    // TODO DEBUGGING
    public boolean DEBUG_MODE = false;

    /**
     * Checks if any user data is stored on the local storage. If so, this data
     */
    public void fetchUserData () {
        if (StorageUtils.isUserDataAlreadyOnDisk() && !DEBUG_MODE) {
            /* read the existing user account information from the local storage */
            User user = StorageUtils.getUserData(/*default image index*/);
            if (user != null) {
                Client.NEW_USER = false;
                Main.theGlobalUser = user;
                startLobby();
                return;
            } // else : do the following block as if there was no local storage info.
        }
        /* need to ask for user's account data: */
        UserDialogSetup userDialogSetup = new UserDialogSetup(theGlobalUser);
        Image[] images = new Image[12];
        for (int i = 0; i < images.length; i++) {
            Image image = getImage(i);
            images[i] = image;
        }
        userDialogSetup.setOnOKListener(user -> {
            /* when the user submits the dialog */
            theGlobalUser = user;
            StorageUtils.writeUserData(user);
            startLobby();
        });
        userDialogSetup.setUpAccount(images);
    }

    private Image getImage (int imageIndex) {
        final URL imgResURL = this.getClass().getResource("UserIcon" + (imageIndex + 1) + ".png");
        return new Image(imgResURL.toString());
    }

    /**
     * Method create a new user and client and start the LobbyWindow.
     */
    public void startLobby () {
        Client client = new Client(theGlobalUser);
        LobbyWindow lobbyWindow = new LobbyWindow(client);
        lobbyWindow.show();
    }

    /**
     * If there is a user available, his locale is returned.
     * @return the users' locale or the default locale if user is unavailable.
     */
    public static Locale getLocale() {
        if(theGlobalUser == null || theGlobalUser.getLocale() == null){
            return Locale.ENGLISH;
        }
        return theGlobalUser.getLocale();
    }
}
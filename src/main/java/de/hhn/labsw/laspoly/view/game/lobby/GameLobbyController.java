package de.hhn.labsw.laspoly.view.game.lobby;

import com.sun.javafx.scene.control.skin.ListViewSkin;
import de.hhn.labsw.laspoly.main.Main;
import de.hhn.labsw.laspoly.model.Game;
import de.hhn.labsw.laspoly.model.User;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.geometry.Pos;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ListCell;
import javafx.scene.control.ListView;
import javafx.scene.image.ImageView;
import javafx.scene.layout.HBox;
import javafx.scene.text.Text;
import javafx.util.Callback;

import java.net.URL;
import java.util.Locale;
import java.util.ResourceBundle;
import java.util.logging.Logger;

/**
 * Controller for {@link GameLobby}.
 */
public class GameLobbyController implements Initializable {


    /**
     * Instance of {@link GameLobby} that this class is controlling.
     */
    private GameLobby gameLobby;

    /**
     * {@link javafx.scene.control.ListView} containing the list of players that are part of this {@link
     * de.hhn.labsw.laspoly.model.Game}.
     */
    @FXML
    protected ListView<User> playerList;

    /**
     * Name of this {@link de.hhn.labsw.laspoly.model.Game}
     */
    @FXML
    protected Label gameName;

    /**
     * Button that starts the {@link de.hhn.labsw.laspoly.model.Game} on click.
     */
    @FXML
    protected Button startGameButton;

    /**
     * When a user clicks this button the user leaves or if the user is the host closes the game.
     */
    @FXML
    protected Button leaveGameButton;

    @Override
    public void initialize (URL location, ResourceBundle resources) {
        playerList.setCellFactory(new Callback<ListView<User>, ListCell<User>>() {

            @Override
            public ListCell<User> call (ListView<User> p) {

                return new ListCell<User>() {

                    @Override
                    protected void updateItem (User user, boolean bln) {
                        super.updateItem(user, bln);
                        if (user != null) {
                            HBox box = new HBox(10);
                            box.setAlignment(Pos.CENTER_LEFT);
                            Text name = new Text(user.getName());
                            ImageView flag;
                            if (user.getLocale() == Locale.GERMAN) {
                                flag = new ImageView(this.getClass().getResource("Germany-Flag.png").toString());
                            } else {
                                flag = new ImageView(this.getClass().getResource("United-States-Flag.png").toString());
                            }
                            ImageView test = new ImageView("de/hhn/labsw/laspoly/view/game/figures/figure1.jpg");
                            test.setFitHeight(30);
                            test.setFitWidth(30);

                            flag.setFitHeight(30);
                            flag.setFitWidth(30);
                            box.getChildren().addAll(flag, name);
                            setGraphic(box);
                        }
                    }


                };
            }
        });
    }

    /**
     * This method is called by clicking on {@link #startGameButton}. This class opens a new window with the game and
     * hides {@link #gameLobby}.
     * @param event {@link javafx.event.ActionEvent}.
     */
    @FXML
    protected void startGame (ActionEvent event) {
        if (playerList.getItems().size() > 1) {
            boolean firstRelease = true;
            if (firstRelease) {
                ResourceBundle bundle = ResourceBundle.getBundle("de.hhn.labsw.laspoly.NextRelease", Main.getLocale());
                Alert alert = new Alert(Alert.AlertType.INFORMATION);
                alert.setTitle(bundle.getString("title"));
                alert.setHeaderText(bundle.getString("header"));
                alert.setContentText(bundle.getString("content"));
                alert.showAndWait();
            } else { // TODO will come after first release
                gameLobby.getClient().initializeGame();
            }
        } else {
            ResourceBundle bundle = ResourceBundle.getBundle("de.hhn.labsw.laspoly.view.game.lobby.ErrorNotEnoughPlayers", Main.getLocale());
            Alert alert = new Alert(Alert.AlertType.ERROR);
            alert.setTitle(bundle.getString("errorstartgametitle"));
            alert.setHeaderText(bundle.getString("errorstartgameheader"));
            alert.setContentText(bundle.getString("errorstartgamecontent"));
            alert.showAndWait();
        }
    }

    /**
     * Sets {@link #gameLobby}. Binds data of {@link de.hhn.labsw.laspoly.model.Game} to the userinterface.
     *
     * @param lobby {@link GameLobby} instance.
     */
    public void setGameLobby (GameLobby lobby) {
        gameLobby = lobby;
        gameName.setText(gameLobby.getGame().getName());
        playerList.setItems(FXCollections.observableArrayList(gameLobby.getGame().getUsers()));
        playerList.setSkin(new Skin(playerList));
        gameLobby.getClient().notifyGameLobbyOpened(this);
        if (gameLobby.getClient().getUser().getId().intValue() == gameLobby.getGame().getHost().getId().intValue()) {
            startGameButton.setVisible(true);
        }
        ResourceBundle bundle = ResourceBundle.getBundle("de.hhn.labsw.laspoly.view.game.lobby.GameLobby", Main.getLocale());
        startGameButton.setText(bundle.getString("start"));
        if (getGameLobby().getGame().getHost().getId().intValue() == getGameLobby().getClient().getUser().getId().intValue()) {
            leaveGameButton.setText(bundle.getString("close"));
        } else {
            leaveGameButton.setText(bundle.getString("leave"));
        }
    }

    /**
     * This class is called when the game data has been changed by the server.
     *
     * @param game {@link de.hhn.labsw.laspoly.model.Game} that contains the changed data.
     */
    public void changeData (Game game) {
        Platform.runLater(() -> {
            playerList.setItems(FXCollections.observableArrayList(game.getUsers()));
            Logger.getAnonymousLogger().info(game.getUsersCount());
            Logger.getAnonymousLogger().info(String.valueOf(playerList.getItems().size()));
            gameName.setText(game.getName());
            gameLobby.setGame(game);
            ((Skin) playerList.getSkin()).refresh();
        });
    }

    /**
     * @return The instance of {@link GameLobby} this class is controlling.
     */
    public GameLobby getGameLobby () {
        return gameLobby;
    }

    /**
     * Called when the user presses the "Leave Game"-Button
     *
     * @param actionEvent {@link javafx.event.ActionEvent}.
     */
    @FXML
    public void closeGame (ActionEvent actionEvent) {
        getGameLobby().close();
        getGameLobby().getClient().notifyGameLobbyClosed(gameLobby.getGame());
        getGameLobby().getLobbyWindow().show();
    }

    /**
     * Skin used for {@link #playerList}.
     */
    private class Skin extends ListViewSkin {

        /**
         * Constructor.
         *
         * @param listView {@link javafx.scene.control.ListView} that uses this skin.
         */
        public Skin (ListView listView) {
            super(listView);
        }

        /**
         * Method called to manually refresh the listview.
         */
        public void refresh () {
            super.flow.recreateCells();
        }
    }
}

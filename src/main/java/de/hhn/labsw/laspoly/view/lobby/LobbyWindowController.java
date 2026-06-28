package de.hhn.labsw.laspoly.view.lobby;

import de.hhn.labsw.laspoly.main.Main;
import de.hhn.labsw.laspoly.main.UserDialogSetup;
import de.hhn.labsw.laspoly.model.Game;
import de.hhn.labsw.laspoly.network.client.Client;
import de.hhn.labsw.laspoly.utils.StorageUtils;
import de.hhn.labsw.laspoly.view.game.lobby.GameLobby;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.value.ChangeListener;
import javafx.beans.value.ObservableValue;
import javafx.collections.ListChangeListener;
import javafx.collections.ObservableList;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.Cursor;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Label;
import javafx.scene.control.SelectionMode;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextInputDialog;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.MouseEvent;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;

import java.net.URL;
import java.util.Optional;
import java.util.ResourceBundle;

/**
 * Controller for {@link LobbyWindow}.
 */
public class LobbyWindowController implements Initializable {

    /**
     * {@link javafx.scene.control.TableView} containing all available {@link de.hhn.labsw.laspoly.model.Game}.
     */
    @FXML
    private TableView<Game> gamesTable;

    /**
     * {@link javafx.scene.control.TableColumn} of {@link #gamesTable} that contains the name of the {@link
     * de.hhn.labsw.laspoly.model.Game}.
     */
    @FXML
    private TableColumn<Game, String> gamesTableColName;

    /**
     * {@link javafx.scene.control.TableColumn} of {@link #gamesTable} that contains the quantity of players in the
     * {@link de.hhn.labsw.laspoly.model.Game}.
     */
    @FXML
    private TableColumn<Game, String> gamesTableColQuantity;

    /**
     * {@link javafx.scene.control.Label} that contains the username of the {@link de.hhn.labsw.laspoly.model.User}.
     */
    @FXML
    private Label usernameLabel;

    /**
     * Instance of {@link LobbyWindow} that this class is controlling.
     */
    private LobbyWindow lobbyWindow;

    /**
     * {@link de.hhn.labsw.laspoly.network.client.Client} that is using this program.
     */
    private Client client;

    /**
     * {@link javafx.collections.ObservableList} of all available {@link de.hhn.labsw.laspoly.model.Game}.
     */
    private ObservableList<Game> games;

    /**
     * Buttons used for adding a {@link de.hhn.labsw.laspoly.model.Game} and refreshing {@link #gamesTable}.
     */
    @FXML
    private Button refresh, addgame;

    /**
     * Text representing the name of the user.
     */
    private Text textName;

    /**
     * Text representing the welcome text for the user.
     */
    private Text textWelcome;

    /**
     * Method called when {@link #usernameLabel} is clicked.
     *
     * @param event {@link javafx.scene.input.MouseEvent}.
     */
    @FXML
    protected void onUserNameClicked (MouseEvent event) {
        UserDialogSetup userDialogSetup = new UserDialogSetup(Main.getTheGlobalUser());
        Image[] images = new Image[12];
        for (int i = 0; i < images.length; i++) {
            Image image = getImage(i);
            images[i] = image;
        }
        userDialogSetup.setOnOKListener(user -> {
            StorageUtils.writeUserData(user);
            ResourceBundle lobbyBundle = ResourceBundle.getBundle("de.hhn.labsw.laspoly.view.lobby.lobby", Main.getLocale());
            gamesTable.setPlaceholder(new Label(lobbyBundle.getString("placeholder")));
            gamesTableColName.setText(lobbyBundle.getString("colnametitle"));
            gamesTableColQuantity.setText(lobbyBundle.getString("colquantitytitle"));

            client.getUser().setName(user.getName());
            client.getUser().setLocale(user.getLocale());
            textWelcome.setText(lobbyBundle.getString("welcome") + ", ");
            textName.setText(client.getUser().getName());
            client.notifyUserDataChanged();
        });
        userDialogSetup.setUpAccount(images);
    }

    private Image getImage (int imageIndex) {
        final URL imgResURL = Main.class.getResource("UserIcon" + (imageIndex + 1) + ".png");
        return new Image(imgResURL.toString());
    }

    /**
     * Method called when the '+'-Button is clicked.
     *
     * @param event {@link javafx.event.ActionEvent}.
     */
    @FXML
    protected void addGame (ActionEvent event) {

        ResourceBundle bundle = ResourceBundle.getBundle("de.hhn.labsw.laspoly.view.lobby.LobbyAddGame", Main.getLocale());
        TextInputDialog dialog = new TextInputDialog();
        dialog.setTitle(bundle.getString("title"));
        dialog.setHeaderText(bundle.getString("header"));
        dialog.setContentText(bundle.getString("content"));
        dialog.setGraphic(new ImageView(this.getClass().getResource("addgame.png").toString()));
        Button button = (Button) dialog.getDialogPane().lookupButton(ButtonType.OK);
        button.setDisable(true);

        dialog.getEditor().textProperty().addListener(new ChangeListener<String>() {

            @Override
            public void changed (ObservableValue<? extends String> observable, String oldValue, String newValue) {
                button.setDisable(newValue.trim().isEmpty());
            }
        });

        Optional<String> result = dialog.showAndWait();

        if (result.isPresent()) {
            String name = result.get();
            Game game = client.createGame(name);
            GameLobby gameLobby = new GameLobby(game, client, getLobbyWindow());
            gameLobby.show();
            getLobbyWindow().hide();
        }
    }

    /**
     * Method called when the 'R'-Button is clicked.
     *
     * @param event {@link javafx.event.ActionEvent}.
     */
    @FXML
    protected void refreshGames (ActionEvent event) {
        client.getAllGames();
    }

    @Override
    public void initialize (URL location, ResourceBundle resources) {
        gamesTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        gamesTableColName.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().getName()));
        gamesTableColQuantity.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue()
                .getUsersCount()));
        gamesTable.getSelectionModel().setSelectionMode(SelectionMode.SINGLE);
        gamesTable.getSelectionModel().selectedItemProperty().addListener(new ChangeListener<Game>() {

            @Override
            public void changed (ObservableValue<? extends Game> observable, Game oldValue, Game newValue) {
                Platform.runLater(() -> {
                    if (gamesTable.getSelectionModel().getSelectedItem() != null) {
                        if (newValue.getUsers().size() < 4) {
                            GameLobby gameLobby = new GameLobby(newValue, client, getLobbyWindow());
                            gameLobby.show();
                            getLobbyWindow().hide();
                        }
                    }
                });
            }
        });
        ResourceBundle bundle = ResourceBundle.getBundle("de.hhn.labsw.laspoly.view.lobby.lobby", Main.getLocale());
        gamesTable.setPlaceholder(new Label(bundle.getString("placeholder")));
        gamesTableColName.setText(bundle.getString("colnametitle"));
        gamesTableColQuantity.setText(bundle.getString("colquantitytitle"));

        textWelcome = new Text();
        textName = new Text();
        textName.setFill(Color.GREEN);
        textName.setFont(Font.font(textWelcome.getFont().getName(), FontWeight.BOLD, 18));
        textName.setOnMouseClicked(this::onUserNameClicked);
        textName.setOnMouseEntered(v -> getLobbyWindow().getScene().setCursor(Cursor.HAND));
        textName.setOnMouseExited(v -> getLobbyWindow().getScene().setCursor(Cursor.DEFAULT));

        refresh.setOnMouseEntered(v -> getLobbyWindow().getScene().setCursor(Cursor.HAND));
        refresh.setOnMouseExited(v -> getLobbyWindow().getScene().setCursor(Cursor.DEFAULT));
        addgame.setOnMouseEntered(v -> getLobbyWindow().getScene().setCursor(Cursor.HAND));
        addgame.setOnMouseExited(v -> getLobbyWindow().getScene().setCursor(Cursor.DEFAULT));


        TextFlow flow = new TextFlow(textWelcome, textName);
        usernameLabel.setGraphic(flow);
    }

    /**
     * Sets the {@link LobbyWindow} that this class is controlling.
     *
     * @param lobbyWindow Instance of {@link LobbyWindow}.
     */
    public void setLobbyWindow (LobbyWindow lobbyWindow) {
        this.lobbyWindow = lobbyWindow;
    }

    /**
     * Sets the {@link de.hhn.labsw.laspoly.network.client.Client} of this program.
     *
     * @param client {@link de.hhn.labsw.laspoly.network.client.Client}.
     */
    public void setClient (Client client) {
        ResourceBundle bundle = ResourceBundle.getBundle("de.hhn.labsw.laspoly.view.lobby.lobby", Main.getLocale());
        this.client = client;

        textWelcome.setText(bundle.getString("welcome") + ", ");
        textName.setText(client.getUser().getName());

        games = client.getGamesList();
        games.addListener((ListChangeListener<Game>) e -> {
            gamesTable.setItems(null);
            gamesTable.setItems(games);
        });
        gamesTable.setItems(games);
        client.getAllGames();
    }

    /**
     * @return The {@link de.hhn.labsw.laspoly.view.lobby.LobbyWindow} that this class is controlling.
     */
    public LobbyWindow getLobbyWindow () {
        return lobbyWindow;
    }
}

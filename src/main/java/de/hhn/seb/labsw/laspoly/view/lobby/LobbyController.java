/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 *  javafx.beans.property.SimpleStringProperty
 *  javafx.beans.value.ChangeListener
 *  javafx.beans.value.ObservableValue
 *  javafx.fxml.FXML
 *  javafx.fxml.Initializable
 *  javafx.geometry.Pos
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Button
 *  javafx.scene.control.ButtonType
 *  javafx.scene.control.Label
 *  javafx.scene.control.SelectionMode
 *  javafx.scene.control.TableColumn
 *  javafx.scene.control.TableRow
 *  javafx.scene.control.TableView
 *  javafx.scene.control.TextInputDialog
 *  javafx.scene.control.Tooltip
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.GridPane
 *  javafx.scene.layout.VBox
 *  javafx.scene.paint.Color
 *  javafx.scene.paint.Paint
 *  javafx.stage.Window
 */
package de.hhn.seb.labsw.laspoly.view.lobby;

import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.network.client.Client;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.StringValidator;
import de.hhn.seb.labsw.laspoly.utils.audio.BackgroundMusic;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.BaseController;
import de.hhn.seb.labsw.laspoly.view.MainWindowController;
import java.net.URL;
import java.util.ResourceBundle;
import java.util.logging.Level;
import java.util.logging.Logger;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.value.ChangeListener;
import javafx.beans.value.ObservableValue;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.geometry.Pos;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Label;
import javafx.scene.control.SelectionMode;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableRow;
import javafx.scene.control.TableView;
import javafx.scene.control.TextInputDialog;
import javafx.scene.control.Tooltip;
import javafx.scene.image.ImageView;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.paint.Paint;
import javafx.stage.Window;

public class LobbyController
implements Initializable,
BaseController {
    private static final int MAX_GAME_NAME_LENGTH = 23;
    private Logger logger;
    private MainWindowController mainWindowController;
    @FXML
    private TableView<Game> gamesTable;
    @FXML
    private TableColumn<Game, String> gamesTableColID;
    @FXML
    private TableColumn<Game, String> gamesTableColName;
    @FXML
    private TableColumn<Game, String> gamesTableColQuantity;
    @FXML
    private Button addGame;
    @FXML
    private Button enterGame;
    @FXML
    private Label idLabel;
    @FXML
    private Label nameLabel;
    @FXML
    private Label freePlacesLabel;

    public void initialize(URL location, ResourceBundle resources) {
        this.logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
        this.gamesTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        this.gamesTableColName.setCellValueFactory(cellData -> new SimpleStringProperty(((Game)cellData.getValue()).getName()));
        this.gamesTableColQuantity.setCellValueFactory(cellData -> new SimpleStringProperty(((Game)cellData.getValue()).getUsersCount()));
        this.gamesTableColID.setSortable(false);
        this.gamesTableColName.setSortable(false);
        this.gamesTableColQuantity.setSortable(false);
        this.gamesTableColID.setCellValueFactory(cellData -> new SimpleStringProperty(((Game)cellData.getValue()).getId() + ""));
        this.gamesTableColID.maxWidthProperty().bind((ObservableValue)this.gamesTable.widthProperty().divide(8));
        this.idLabel.prefWidthProperty().bind((ObservableValue)this.gamesTable.widthProperty().divide(8));
        this.gamesTableColName.maxWidthProperty().bind((ObservableValue)this.gamesTable.widthProperty().divide(8).multiply(6));
        this.nameLabel.prefWidthProperty().bind((ObservableValue)this.gamesTable.widthProperty().divide(8).multiply(7));
        this.gamesTableColQuantity.maxWidthProperty().bind((ObservableValue)this.gamesTable.widthProperty().divide(8).multiply(2));
        this.freePlacesLabel.prefWidthProperty().bind((ObservableValue)this.gamesTable.widthProperty().divide(8).multiply(2));
        this.gamesTable.getSelectionModel().setSelectionMode(SelectionMode.SINGLE);
        this.gamesTable.getSelectionModel().selectedItemProperty().addListener((observable, oldValue, newValue) -> Platform.runLater(() -> {
            if (this.gamesTable.getSelectionModel().getSelectedItem() == null) {
                this.enterGame.setDisable(false);
            } else {
                this.enterGame.setDisable(((Game)this.gamesTable.getSelectionModel().getSelectedItem()).getUsers().size() >= 4);
            }
        }));
        this.gamesTable.setRowFactory(tv -> {
            TableRow row = new TableRow();
            row.setOnMouseClicked(event -> {
                if (event.getClickCount() == 2 && !row.isEmpty()) {
                    this.onGameEnterClick();
                }
            });
            return row;
        });
        this.addGame.setCursor(Cursor.HAND);
        this.enterGame.setCursor(Cursor.HAND);
        ImageView plusOrange = new ImageView(DataLoader.getInstance().getGameImage(GameImage.PLUS_GREEN));
        plusOrange.setFitHeight(25.0);
        plusOrange.setFitWidth(25.0);
        this.addGame.setGraphic((Node)plusOrange);
        ImageView arrow = new ImageView(DataLoader.getInstance().getGameImage(GameImage.ARROW_ORANGE));
        arrow.setFitHeight(25.0);
        arrow.setFitWidth(25.0);
        this.enterGame.setGraphic((Node)arrow);
        try {
            BackgroundMusic.play("thejazzpiano");
        } catch (RuntimeException e) {
            this.logger.log(Level.WARNING, "Lobby music skipped: {0}", e.getMessage());
        }
        this.logger.fine("Initialization finished");
    }

    @FXML
    protected final void addGame() {
        ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.LOBBY_ADD_GAME, this.getMainWindowController().getClient().getUser().getLocale());
        final TextInputDialog dialog = new TextInputDialog();
        dialog.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
        dialog.getDialogPane().getStyleClass().add("alertStyle");
        dialog.setTitle(bundle.getString("title"));
        dialog.setHeaderText(bundle.getString("header"));
        dialog.setContentText(bundle.getString("content"));
        dialog.initOwner((Window)this.mainWindowController.getMainWindow());
        final Label errorLabel = new Label(bundle.getString("name_invalid"));
        errorLabel.setStyle("-fx-text-fill: red;");
        ((GridPane)dialog.getDialogPane().getContent()).add((Node)errorLabel, 0, 2);
        errorLabel.setVisible(false);
        ImageView iconView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.PLUS_WHITE));
        iconView.setFitHeight(25.0);
        iconView.setFitWidth(25.0);
        dialog.setGraphic((Node)iconView);
        final Button submitButton = (Button)dialog.getDialogPane().lookupButton(ButtonType.OK);
        Button cancelButton = (Button)dialog.getDialogPane().lookupButton(ButtonType.CANCEL);
        ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
        checkView.setFitHeight(25.0);
        checkView.setFitWidth(25.0);
        submitButton.setGraphic((Node)checkView);
        submitButton.setCursor(Cursor.HAND);
        submitButton.getStyleClass().add("greenActionButton");
        ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
        crossView.setFitHeight(25.0);
        crossView.setFitWidth(25.0);
        cancelButton.setGraphic((Node)crossView);
        cancelButton.setCursor(Cursor.HAND);
        cancelButton.getStyleClass().add("redActionButton");
        submitButton.setPrefWidth(110.0);
        submitButton.setDisable(true);
        dialog.getEditor().textProperty().addListener((ChangeListener)new ChangeListener<String>(){

            public void changed(ObservableValue<? extends String> observable, String oldValue, String newValue) {
                boolean nameValid;
                if (dialog.getEditor().getText().length() > 23) {
                    String s = dialog.getEditor().getText().substring(0, 23);
                    dialog.getEditor().setText(s);
                }
                errorLabel.setVisible(!(nameValid = StringValidator.checkString(newValue)));
                submitButton.setDisable(!nameValid);
            }
        });
        dialog.showAndWait().ifPresent(name -> {
            this.getMainWindowController().getClient().stopListening();
            Game game = this.getMainWindowController().getClient().addGame((String)name, this.getMainWindowController().getClient().getUser());
            if (game == null) {
                this.getMainWindowController().getClient().listenToServer(this, Client.ServerUpdate.GAMES_LIST);
                ResourceBundle errorBundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ERROR, this.getMainWindowController().getClient().getUser().getLocale());
                Alert alert = new Alert(Alert.AlertType.ERROR);
                alert.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
                alert.getDialogPane().getStyleClass().add("alertStyle");
                alert.setTitle(errorBundle.getString("no_games_title"));
                alert.setHeaderText(errorBundle.getString("no_games_header"));
                alert.setContentText("Could not create a room on the server. Restart with run.bat / run.sh to fetch the latest client.");
                alert.initOwner((Window)this.mainWindowController.getMainWindow());
                alert.showAndWait();
                return;
            }
            this.getMainWindowController().showGameLobby(game);
            this.logger.fine("Adding of game successful: " + String.valueOf(game));
        });
    }

    @FXML
    public final void onGameEnterClick() {
        this.logger.finer("Entering game clicked");
        Game game = (Game)this.gamesTable.getSelectionModel().getSelectedItem();
        if (game == null) {
            return;
        }
        User me = this.getMainWindowController().getClient().getUser();
        if (game.isHost(me)) {
            ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.LOBBY, me.getLocale());
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
            alert.getDialogPane().getStyleClass().add("alertStyle");
            alert.setTitle(bundle.getString("title"));
            alert.setHeaderText(bundle.getString("sameHostHeader"));
            alert.setContentText(bundle.getString("sameHostMessage"));
            alert.initOwner((Window)this.mainWindowController.getMainWindow());
            alert.showAndWait();
            return;
        }
        if (game.getUsers().size() >= 4) {
            return;
        }
        this.getMainWindowController().getClient().stopListening();
        this.getMainWindowController().showGameLobby(game);
    }

    @Override
    public void updateLanguage() {
        this.logger.fine("Updating gui language: " + this.getMainWindowController().getClient().getUser().getLocale());
        ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.LOBBY, this.getMainWindowController().getClient().getUser().getLocale());
        Label placeholder = new Label(bundle.getString("placeholder"));
        placeholder.setTextFill((Paint)Color.rgb((int)115, (int)115, (int)115));
        placeholder.setAlignment(Pos.CENTER);
        placeholder.setStyle("-fx-font-weight: bold; -fx-font-size: 15px");
        Label placeholder2 = new Label(bundle.getString("placeholdersub"));
        placeholder2.setTextFill((Paint)Color.rgb((int)115, (int)115, (int)115));
        placeholder2.setAlignment(Pos.CENTER);
        placeholder2.setStyle("-fx-font-size: 12px");
        VBox placeHolderNode = new VBox(new Node[]{placeholder, placeholder2});
        placeHolderNode.setSpacing(10.0);
        placeholder2.setAlignment(Pos.CENTER);
        placeholder.prefWidthProperty().bind((ObservableValue)placeHolderNode.widthProperty());
        placeholder2.prefWidthProperty().bind((ObservableValue)placeHolderNode.widthProperty());
        placeHolderNode.prefWidthProperty().bind((ObservableValue)this.gamesTable.widthProperty().subtract(40));
        this.gamesTable.setPlaceholder((Node)placeHolderNode);
        this.nameLabel.setText(bundle.getString("colnametitle"));
        this.freePlacesLabel.setText(bundle.getString("colquantitytitle"));
        this.gamesTableColName.setText(bundle.getString("colnametitle"));
        this.gamesTableColQuantity.setText(bundle.getString("colquantitytitle"));
        this.enterGame.setText(bundle.getString("enterGame"));
        this.addGame.setText(bundle.getString("createGame"));
        this.enterGame.setTooltip(new Tooltip(bundle.getString("tooltipEnterGame")));
        this.addGame.setTooltip(new Tooltip(bundle.getString("tooltipCreateGame")));
    }

    @Override
    public void onUpdate() {
        this.idLabel.setVisible(this.gamesTable.getItems().size() != 0);
        this.nameLabel.setVisible(this.gamesTable.getItems().size() != 0);
        this.freePlacesLabel.setVisible(this.gamesTable.getItems().size() != 0);
        this.logger.fine("Refreshing of games successful");
    }

    @Override
    public void stopUpdate() {
        this.getMainWindowController().getClient().stopListening();
    }

    @Override
    public final MainWindowController getMainWindowController() {
        return this.mainWindowController;
    }

    @Override
    public final void setMainWindowController(MainWindowController controller) {
        this.logger.fine("Set mainwindowcontroller: " + String.valueOf(controller));
        this.mainWindowController = controller;
        this.updateLanguage();
        this.getMainWindowController().getClient().listenToServer(this, Client.ServerUpdate.GAMES_LIST);
        this.gamesTable.setItems(this.getMainWindowController().getClient().getGamesList());
        if (!this.gamesTable.getItems().isEmpty()) {
            this.gamesTable.getSelectionModel().select(0);
        }
        this.idLabel.setVisible(this.gamesTable.getItems().size() != 0);
        this.nameLabel.setVisible(this.gamesTable.getItems().size() != 0);
        this.freePlacesLabel.setVisible(this.gamesTable.getItems().size() != 0);
    }

    @Override
    public void closeProgram() {
    }
}


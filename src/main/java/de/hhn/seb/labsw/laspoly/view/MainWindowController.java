/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.beans.value.ObservableValue
 *  javafx.event.ActionEvent
 *  javafx.fxml.FXML
 *  javafx.fxml.FXMLLoader
 *  javafx.fxml.Initializable
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Button
 *  javafx.scene.control.Label
 *  javafx.scene.control.Tooltip
 *  javafx.scene.image.ImageView
 *  javafx.scene.input.KeyCode
 *  javafx.scene.input.KeyEvent
 *  javafx.scene.input.MouseEvent
 *  javafx.scene.layout.AnchorPane
 *  javafx.scene.layout.Pane
 *  javafx.scene.paint.Color
 *  javafx.scene.paint.Paint
 *  javafx.scene.text.Font
 *  javafx.scene.text.FontWeight
 *  javafx.scene.text.Text
 *  javafx.scene.text.TextFlow
 */
package de.hhn.seb.labsw.laspoly.view;

import de.hhn.seb.labsw.laspoly.main.UserDialogSetup;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.settings.KeySettings;
import de.hhn.seb.labsw.laspoly.model.settings.Settings;
import de.hhn.seb.labsw.laspoly.model.settings.SettingsHandler;
import de.hhn.seb.labsw.laspoly.model.settings.SoundSettings;
import de.hhn.seb.labsw.laspoly.network.client.Client;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FigureSource;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.BaseController;
import de.hhn.seb.labsw.laspoly.view.MainWindow;
import de.hhn.seb.labsw.laspoly.view.about.AboutWindow;
import de.hhn.seb.labsw.laspoly.view.game.GameWindow;
import de.hhn.seb.labsw.laspoly.view.game.lobby.GameLobbyController;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsWindow;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.URL;
import java.util.HashMap;
import java.util.ResourceBundle;
import java.util.logging.Logger;
import javafx.beans.value.ObservableValue;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.Tooltip;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.input.MouseEvent;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.Pane;
import javafx.scene.paint.Color;
import javafx.scene.paint.Paint;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.scene.text.Text;
import javafx.scene.text.TextFlow;

public class MainWindowController
implements Initializable,
BaseController {
    @FXML
    private Pane content;
    @FXML
    private Label nameLabel;
    @FXML
    private AnchorPane topRoot;
    @FXML
    private Button settings;
    @FXML
    private Button about;
    private Text textName;
    private Text textWelcome;
    private MainWindow mainWindow;
    private Client client;
    private ImageView flagView;
    private Game game;
    private BaseController controller;
    private Logger logger;
    private Pane contentPane;
    private boolean userDataChangeable = true;
    private boolean altPressed;
    private SettingsHandler settingsHandler;

    public void initialize(URL location, ResourceBundle resources) {
        this.logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
        this.settingsHandler = new SettingsHandler();
        this.textWelcome = new Text();
        this.textWelcome.setFill((Paint)Color.WHITE);
        this.textName = new Text();
        this.textName.setFill((Paint)Color.WHITE);
        this.textName.setFont(Font.font((String)this.textWelcome.getFont().getName(), (FontWeight)FontWeight.BOLD, (double)18.0));
        this.textName.setOnMouseClicked(this::onUserNameFlagClicked);
        this.textName.setCursor(Cursor.HAND);
        ImageView settingsView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.GEAR));
        settingsView.setFitHeight(25.0);
        settingsView.setFitWidth(25.0);
        ImageView helpView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.QUESTION_MARK));
        helpView.setFitHeight(25.0);
        helpView.setFitWidth(25.0);
        this.settings.setGraphic((Node)settingsView);
        this.settings.setCursor(Cursor.HAND);
        this.about.setGraphic((Node)helpView);
        this.about.setCursor(Cursor.HAND);
        this.logger.fine("Initialization finished");
    }

    @FXML
    protected final void onUserNameFlagClicked(MouseEvent event) {
        this.logger.fine("Username or flag was clicked");
        if (this.userDataChangeable) {
            UserDialogSetup dialogSetup = new UserDialogSetup(this.getClient().getUser().getLocale(), this.getClient().getUser().getName(), false);
            dialogSetup.showAndWait().ifPresent(o -> {
                if (o instanceof User) {
                    this.logger.fine("New user was created");
                    User user = (User)o;
                    this.getClient().getUser().setLocale(user.getLocale());
                    this.getClient().getUser().setName(user.getName());
                    this.textName.setText(user.getName());
                    this.flagView.setImage(DataLoader.getInstance().getFlagImage(user.getLocale()));
                    this.updateLanguage();
                    if (this.controller != null) {
                        this.controller.updateLanguage();
                    }
                    ThreadRunner.run(() -> this.getClient().notifyUserDataChanged());
                }
            });
        }
    }

    public final MainWindow getMainWindow() {
        return this.mainWindow;
    }

    public final void setMainWindow(MainWindow window) {
        this.mainWindow = window;
    }

    public final void setCursor(Cursor cursor) {
        this.mainWindow.getScene().setCursor(cursor);
    }

    public final Client getClient() {
        return this.client;
    }

    public final void setClient(Client serverClient) {
        this.logger.fine("Set client to " + String.valueOf(serverClient));
        this.client = serverClient;
        ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.MAIN_WINDOW, this.getClient().getUser().getLocale());
        this.textWelcome.setText(bundle.getString("welcome") + ", ");
        this.textName.setText(serverClient.getUser().getName());
        this.textName.setStyle("-fx-font-weight: bold");
        this.flagView = new ImageView(DataLoader.getInstance().getFlagImage(this.getClient().getUser().getLocale()));
        this.flagView.setFitHeight(30.0);
        this.flagView.setFitWidth(30.0);
        TextFlow flow = new TextFlow(new Node[]{this.textWelcome, this.textName});
        this.nameLabel.setGraphic((Node)flow);
        this.flagView.setX(25.0);
        this.flagView.setY(20.0);
        this.flagView.setOnMouseClicked(this::onUserNameFlagClicked);
        this.flagView.setCursor(Cursor.HAND);
        this.topRoot.getChildren().add(this.flagView);
        this.settings.setTooltip(new Tooltip(bundle.getString("tooltipSettings")));
        this.about.setTooltip(new Tooltip(bundle.getString("tooltipAbout")));
    }

    private void changeContent(Node nameLabelContent, int layoutX, FXMLFile loaderSource, boolean lobby) {
        this.nameLabel.setGraphic(nameLabelContent);
        this.nameLabel.setLayoutX((double)layoutX);
        FXMLLoader loader = new FXMLLoader(this.getClass().getResource(loaderSource.source()));
        try {
            this.setContent((Pane)loader.load());
            this.controller = (BaseController)loader.getController();
            this.controller.setMainWindowController(this);
        }
        catch (IOException e) {
            this.logger.severe(e.getMessage());
            StringWriter errors = new StringWriter();
            e.printStackTrace(new PrintWriter(errors));
            this.logger.severe(errors.toString());
        }
        this.flagView.setVisible(lobby);
        this.userDataChangeable = lobby;
        if (lobby) {
            this.flagView.setCursor(Cursor.HAND);
            this.textName.setCursor(Cursor.HAND);
        } else {
            this.flagView.setCursor(Cursor.DEFAULT);
            this.textName.setCursor(Cursor.DEFAULT);
        }
    }

    public final void showLobby() {
        this.game = null;
        TextFlow flow = new TextFlow(new Node[]{this.textWelcome, this.textName});
        this.changeContent((Node)flow, 60, FXMLFile.LOBBY, true);
        this.controller.onUpdate();
        this.logger.info("Changed view to lobby");
    }

    public final void showGameLobby(Game gameOfLobby) {
        this.game = gameOfLobby;
        Text text = new Text("#" + this.game.getId() + " " + this.game.getName());
        text.setStyle("-fx-text-fill: white; -fx-font-weight: bold");
        text.setFill((Paint)Color.WHITE);
        this.changeContent((Node)text, 47, FXMLFile.GAME_LOBBY, false);
        this.getMainWindow().getScene().setOnKeyPressed(((GameLobbyController)this.controller)::onKeyPressed);
        this.logger.info("Changed view to game lobby");
    }

    public final void showGameWindow() {
        HashMap<User, FigureSource> figureList = ((GameLobbyController)this.controller).getFigureMap();
        GameWindow gameWindow = new GameWindow(this.getClient(), this.getGame(), figureList, this);
        gameWindow.show();
        this.getMainWindow().hide();
        this.logger.info("Showing game window");
    }

    private void setContent(Pane pane) {
        this.contentPane = pane;
        if (this.contentPane != null) {
            this.contentPane.prefWidthProperty().unbind();
            this.content.getChildren().clear();
            this.content.getChildren().add(pane);
            this.contentPane.prefWidthProperty().bind((ObservableValue)this.content.widthProperty());
            this.contentPane.prefHeightProperty().bind((ObservableValue)this.content.heightProperty());
        }
    }

    public final Game getGame() {
        return this.game;
    }

    public void setGame(Game changedGame) {
        this.game = changedGame;
    }

    @Override
    public void updateLanguage() {
        this.logger.fine("Updated gui language");
        ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.MAIN_WINDOW, this.getClient().getUser().getLocale());
        this.textWelcome.setText(bundle.getString("welcome") + ", ");
        this.settings.setTooltip(new Tooltip(bundle.getString("tooltipSettings")));
        this.about.setTooltip(new Tooltip(bundle.getString("tooltipAbout")));
    }

    @Override
    public void onUpdate() {
        this.controller.onUpdate();
    }

    @Override
    public void stopUpdate() {
        this.logger.fine("Stopping all update processes");
        this.controller.stopUpdate();
    }

    @Override
    public MainWindowController getMainWindowController() {
        return this;
    }

    @Override
    public void setMainWindowController(MainWindowController mainWindowController) {
    }

    @Override
    public void closeProgram() {
        this.controller.closeProgram();
    }

    public final boolean isCurrentUser(User user) {
        return this.getClient().getUser().equals(user);
    }

    @FXML
    public void onAboutClicked(ActionEvent actionEvent) {
        AboutWindow.show(this.getClient().getUser().getLocale());
    }

    public void onSettingsClicked(ActionEvent actionEvent) {
        SettingsWindow window = new SettingsWindow(this.getClient().getUser().getLocale(), this.settingsHandler);
        window.show();
    }

    public void onKeyPressed(KeyEvent keyEvent) {
        if (keyEvent.getCode().equals(KeyCode.ALT)) {
            this.altPressed = true;
        }
    }

    public void onKeyReleased(KeyEvent keyEvent) {
        if (keyEvent.getCode().equals(KeyCode.ALT)) {
            this.altPressed = false;
        }
        if (this.altPressed) {
            this.onAltShortCutMade(keyEvent.getCode());
        }
    }

    private void onAltShortCutMade(KeyCode keyCode) {
        KeySettings keySettings = this.settingsHandler.getKeySettings();
        if (keyCode.equals(keySettings.getKeyCode(KeySettings.KeyAction.MUTE_UN_MUTE))) {
            SoundSettings soundSettings = this.settingsHandler.getSoundSettings();
            soundSettings.setSound(!soundSettings.isSound());
            soundSettings.setBackgroundMusic(!soundSettings.isSound());
            soundSettings.setSoundEffect(!soundSettings.isSound());
            soundSettings.save();
            this.settingsHandler.updateSettings(Settings.Category.SOUND);
        } else if (keyCode.equals(keySettings.getKeyCode(KeySettings.KeyAction.FULL_SCREEN))) {
            if (this.getMainWindow().isFullScreen()) {
                this.getMainWindow().setFullScreen(false);
            } else {
                this.getMainWindow().setFullScreen(true);
            }
        }
    }
}


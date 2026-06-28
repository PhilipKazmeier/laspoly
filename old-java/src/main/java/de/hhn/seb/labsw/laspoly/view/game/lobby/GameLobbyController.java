/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  com.sun.javafx.scene.control.skin.ListViewSkin
 *  javafx.application.Platform
 *  javafx.beans.value.ObservableValue
 *  javafx.event.ActionEvent
 *  javafx.fxml.FXML
 *  javafx.fxml.Initializable
 *  javafx.geometry.Insets
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Alert
 *  javafx.scene.control.Alert$AlertType
 *  javafx.scene.control.Button
 *  javafx.scene.control.ButtonType
 *  javafx.scene.control.Label
 *  javafx.scene.control.ListCell
 *  javafx.scene.control.ListView
 *  javafx.scene.control.Skin
 *  javafx.scene.control.TextField
 *  javafx.scene.control.Tooltip
 *  javafx.scene.image.ImageView
 *  javafx.scene.input.KeyEvent
 *  javafx.scene.layout.Pane
 *  javafx.scene.paint.Color
 *  javafx.util.Callback
 */
package de.hhn.seb.labsw.laspoly.view.game.lobby;

import javafx.scene.control.skin.ListViewSkin;
import de.hhn.seb.labsw.laspoly.System;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.FigureChangedAction;
import de.hhn.seb.labsw.laspoly.model.action.FigureChosenAction;
import de.hhn.seb.labsw.laspoly.model.action.KickPlayerAction;
import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.model.message.Message;
import de.hhn.seb.labsw.laspoly.model.message.SystemMessage;
import de.hhn.seb.labsw.laspoly.model.message.UserMessage;
import de.hhn.seb.labsw.laspoly.network.client.Client;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FigureSource;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.BaseController;
import de.hhn.seb.labsw.laspoly.view.MainWindowController;
import de.hhn.seb.labsw.laspoly.view.game.lobby.FigureView;
import de.hhn.seb.labsw.laspoly.view.game.lobby.UserListItem;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.ResourceBundle;
import java.util.logging.Logger;
import javafx.application.Platform;
import javafx.beans.value.ObservableValue;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.geometry.Insets;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Label;
import javafx.scene.control.ListCell;
import javafx.scene.control.ListView;
import javafx.scene.control.TextField;
import javafx.scene.control.Tooltip;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.Pane;
import javafx.scene.paint.Color;
import javafx.util.Callback;

public class GameLobbyController
implements Initializable,
BaseController {
    public static final int CHAT_LIMIT = 140;
    private final HashMap<User, UserListItem> userListItemHashMap = new HashMap();
    @FXML
    private ListView<UserListItem> playerList;
    @FXML
    private Button startGameButton;
    @FXML
    private Button leaveGameButton;
    @FXML
    private ListView<Message> chat;
    @FXML
    private TextField chatMessage;
    @FXML
    private Button sendMessage;
    @FXML
    private Pane figureViewPane;
    @FXML
    private Label labelChooseFigure;
    @FXML
    private Label notEnoughPlayerLabel;
    @FXML
    private Button selectFigure;
    @FXML
    private Button toLeft;
    @FXML
    private Button toRight;
    @FXML
    private Label readyLabel;
    private MainWindowController mainWindowController;
    private Logger logger;
    private ResourceBundle bundle;
    private FigureView figureView;
    private HashMap<User, FigureSource> blackListFigureSources = new HashMap();
    private FigureSource current;

    public void initialize(URL location, ResourceBundle resources) {
        this.logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
        this.playerList.setCellFactory((Callback)new Callback<ListView<UserListItem>, ListCell<UserListItem>>(){

            public ListCell<UserListItem> call(ListView<UserListItem> p) {
                return new ListCell<UserListItem>(){

                    protected void updateItem(UserListItem user, boolean empty) {
                        super.updateItem(user, empty);
                        this.setPadding(new Insets(5.0, 0.0, 5.0, 0.0));
                        if (!empty) {
                            this.setGraphic((Node)user.getPane());
                        } else {
                            this.setGraphic(null);
                        }
                    }
                };
            }
        });
        this.chat.setCellFactory((Callback)new Callback<ListView<Message>, ListCell<Message>>(){

            public ListCell<Message> call(ListView<Message> param) {
                return new ListCell<Message>(){

                    protected void updateItem(Message message, boolean empty) {
                        super.updateItem(message, empty);
                        this.setPadding(new Insets(0.0, 0.0, 0.0, 0.0));
                        if (!empty) {
                            this.setGraphic((Node)message.draw());
                            message.draw().maxWidthProperty().bind((ObservableValue)GameLobbyController.this.chat.widthProperty());
                        } else {
                            this.setGraphic(null);
                        }
                    }
                };
            }
        });
        this.current = FigureSource.POLICE_CAR;
        ImageView arrowView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.ARROW));
        arrowView.setFitHeight(25.0);
        arrowView.setFitWidth(25.0);
        this.startGameButton.setGraphic((Node)arrowView);
        this.startGameButton.setCursor(Cursor.HAND);
        ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
        crossView.setFitHeight(25.0);
        crossView.setFitWidth(25.0);
        this.leaveGameButton.setGraphic((Node)crossView);
        this.leaveGameButton.setCursor(Cursor.HAND);
        ImageView sendView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.SEND));
        sendView.setFitHeight(20.0);
        sendView.setFitWidth(20.0);
        this.sendMessage.setGraphic((Node)sendView);
        this.sendMessage.setCursor(Cursor.HAND);
        ImageView arrowLeftView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.ARROW_LEFT));
        arrowLeftView.setFitHeight(20.0);
        arrowLeftView.setFitWidth(20.0);
        this.toLeft.setGraphic((Node)arrowLeftView);
        this.toLeft.setCursor(Cursor.HAND);
        ImageView arrowRightView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.ARROW_RIGHT));
        arrowRightView.setFitHeight(20.0);
        arrowRightView.setFitWidth(20.0);
        this.toRight.setGraphic((Node)arrowRightView);
        this.toRight.setCursor(Cursor.HAND);
        this.selectFigure.setCursor(Cursor.HAND);
        this.selectFigure.setStyle("-fx-text-fill: rgb(61, 135, 91); -fx-font-weight: bold");
        this.chatMessage.textProperty().addListener((observable, oldValue, newValue) -> this.sendMessage.setDisable(newValue.trim().isEmpty()));
        this.logger.fine("Initialization finished");
    }

    protected void kickPlayer(User user) {
        ThreadRunner.run(() -> {
            this.checkPlayersReady();
            KickPlayerAction kick = new KickPlayerAction(this.getMainWindowController().getClient().getUser(), user, "kickedByHost");
            this.getMainWindowController().getClient().addAction(kick, this.getMainWindowController().getGame());
            this.getMainWindowController().getGame().removeUser(user);
        });
    }

    @FXML
    protected final void startGame() {
        this.logger.fine("Start game was clicked");
        if (this.playerList.getItems().size() > 1) {
            this.getMainWindowController().showGameWindow();
            ThreadRunner.run(() -> this.getMainWindowController().getClient().initializeGame(this.getMainWindowController().getGame()), 1000L);
        }
    }

    @FXML
    public final void closeGame() {
        this.logger.fine("Closing the game");
        this.checkPlayersReady();
        Game game = this.getMainWindowController().getGame();
        this.getMainWindowController().getClient().stopListening();
        this.getMainWindowController().getClient().notifyGameLobbyClosed(game);
        ThreadRunner.onFX(() -> this.getMainWindowController().showLobby(), 0L);
    }

    @Override
    public void updateLanguage() {
        this.logger.finer("Update gui language: " + String.valueOf(this.getMainWindowController().getClient().getUser().getLocale()));
        this.bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.GAME_LOBBY, this.getMainWindowController().getClient().getUser().getLocale());
        this.labelChooseFigure.setText(this.bundle.getString("chooseFigure"));
        if (this.selectFigure.getText().equals("Select")) {
            this.selectFigure.setText(this.bundle.getString("selectFigureButton"));
            ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
            checkView.setFitHeight(25.0);
            checkView.setFitWidth(25.0);
            this.selectFigure.setGraphic((Node)checkView);
        } else {
            this.selectFigure.setText(this.bundle.getString("selectFigureButtonDisabled"));
            ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
            crossView.setFitHeight(25.0);
            crossView.setFitWidth(25.0);
            this.selectFigure.setGraphic((Node)crossView);
        }
        this.readyLabel.setText(this.bundle.getString("readyLabelText"));
        this.startGameButton.setText(this.bundle.getString("start"));
        this.sendMessage.setText(this.bundle.getString("send"));
        this.chatMessage.setPromptText(this.bundle.getString("hint_sendMessage"));
        this.chatMessage.lengthProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue.intValue() > oldValue.intValue() && this.chatMessage.getText().length() >= 140) {
                this.chatMessage.setText(this.chatMessage.getText().substring(0, 140));
            }
        });
        this.leaveGameButton.setText(this.bundle.getString("leave"));
        this.notEnoughPlayerLabel.setText(this.bundle.getString("notEnoughPlayer"));
        this.leaveGameButton.setTooltip(new Tooltip(this.bundle.getString("tooltipLeave")));
        this.startGameButton.setTooltip(new Tooltip(this.bundle.getString("tooltipStart")));
        this.toLeft.setTooltip(new Tooltip(this.bundle.getString("tooltipNextFigure")));
        this.toRight.setTooltip(new Tooltip(this.bundle.getString("tooltipNextFigure")));
        this.sendMessage.setTooltip(new Tooltip(this.bundle.getString("tooltipSend")));
        this.selectFigure.setTooltip(new Tooltip(this.bundle.getString("tooltipSelect")));
    }

    @Override
    public void onUpdate() {
        Game game = this.getMainWindowController().getGame();
        Platform.runLater(() -> {
            this.logger.info("Data of the game is changed");
            this.mainWindowController.getGame().setUsers(game.getUsers());
            this.mainWindowController.getGame().setName(game.getName());
            this.mainWindowController.getGame().setHost(game.getHost());
            game.getUsers().stream().filter(user -> !this.userListItemHashMap.containsKey(user)).forEach(user -> {
                UserListItem item = new UserListItem((User)user, this);
                this.userListItemHashMap.put((User)user, item);
                this.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(this.bundle.getString("entered"), user.getName()), System.SYSTEM_USER));
                this.playerList.getItems().add(item);
            });
            ArrayList<User> toRemove = new ArrayList<>();
            this.userListItemHashMap.keySet().stream().filter(user -> !game.getUsers().contains(user)).forEach(user -> {
                this.playerList.getItems().remove(this.userListItemHashMap.get(user));
                toRemove.add(user);
            });
            toRemove.forEach(user -> {
                this.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(this.bundle.getString("left"), user.getName()), System.SYSTEM_USER));
                this.userListItemHashMap.remove(user);
                this.blackListFigureSources.remove(user);
            });
            this.startGameButton.setVisible(this.mainWindowController.isCurrentUser(this.mainWindowController.getGame().getHost()));
            this.checkPlayersReady();
            ((Skin)this.playerList.getSkin()).refresh();
        });
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
        this.bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.GAME_LOBBY, this.getMainWindowController().getClient().getUser().getLocale());
        this.mainWindowController.getGame().getUsers().stream().forEach(user -> {
            UserListItem item = new UserListItem((User)user, this);
            this.userListItemHashMap.put((User)user, item);
            this.playerList.getItems().add(item);
        });
        this.playerList.setSkin((javafx.scene.control.Skin)new Skin(this.playerList));
        this.getMainWindowController().getClient().listenToServer(this, Client.ServerUpdate.GAME);
        this.blackListFigureSources = this.mainWindowController.getClient().notifyGameLobbyOpened(this.getMainWindowController().getGame());
        if (this.mainWindowController.getGame().isHost(this.mainWindowController.getClient().getUser())) {
            this.startGameButton.setVisible(true);
            this.startGameButton.setDisable(true);
            this.notEnoughPlayerLabel.setVisible(true);
        }
        this.updateLanguage();
        EnhancedGroup view = DataLoader.getInstance().getFigureForm(this.current);
        Figure figure = new Figure(this.getMainWindowController().getClient().getUser(), view);
        this.figureView = new FigureView(figure, this.bundle.getString("figureViewToolTip"));
        this.figureViewPane.getChildren().add(this.figureView.build());
        this.figureView.build().widthProperty().bind((ObservableValue)this.figureViewPane.widthProperty());
        this.figureView.build().heightProperty().bind((ObservableValue)this.figureViewPane.heightProperty());
        this.checkPlayersReady();
        this.figureView.startRotation();
        this.moveRightFigureList(null);
    }

    @Override
    public void closeProgram() {
        Game game = this.getMainWindowController().getGame();
        this.getMainWindowController().getClient().notifyGameLobbyClosed(game);
    }

    @FXML
    private void selectFigure() {
        Client client = this.getMainWindowController().getClient();
        if (this.selectFigure.getText().equals(this.getBundle().getString("selectFigureButton"))) {
            this.selectFigure.setText(this.getBundle().getString("selectFigureButtonDisabled"));
            ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
            crossView.setFitHeight(25.0);
            crossView.setFitWidth(25.0);
            this.selectFigure.setGraphic((Node)crossView);
            this.selectFigure.setStyle("-fx-text-fill: rgb(230, 13, 67);");
            this.toLeft.setDisable(true);
            this.toRight.setDisable(true);
            FigureChangedAction figureChange = new FigureChangedAction(client.getUser(), this.current, client.getUser());
            client.addAction(figureChange, this.getMainWindowController().getGame());
            FigureChosenAction figChosen = new FigureChosenAction(client.getUser(), client.getUser(), true);
            client.addAction(figChosen, this.getMainWindowController().getGame());
        } else {
            this.toLeft.setDisable(false);
            this.toRight.setDisable(false);
            this.selectFigure.setText(this.getBundle().getString("selectFigureButton"));
            this.selectFigure.setStyle("-fx-text-fill: rgb(61, 135, 91);");
            ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
            checkView.setFitHeight(25.0);
            checkView.setFitWidth(25.0);
            this.selectFigure.setGraphic((Node)checkView);
            FigureChosenAction figChosen = new FigureChosenAction(this.getMainWindowController().getClient().getUser(), this.getMainWindowController().getClient().getUser(), false);
            this.getMainWindowController().getClient().addAction(figChosen, this.getMainWindowController().getGame());
        }
    }

    public void checkPlayersReady() {
        int i;
        boolean allPlayersReady = true;
        ArrayList<User> playerReadyList = new ArrayList<User>(this.getMainWindowController().getGame().getPlayerReady());
        ArrayList<User> gameUserList = new ArrayList<User>(this.getMainWindowController().getGame().getUsers());
        if (playerReadyList.size() > gameUserList.size()) {
            for (i = 0; i < playerReadyList.size(); ++i) {
                if (gameUserList.contains(playerReadyList.get(i))) continue;
                playerReadyList.remove(playerReadyList.get(i));
            }
        }
        for (i = 0; i < gameUserList.size(); ++i) {
            if (gameUserList.size() == playerReadyList.size() && gameUserList.contains(playerReadyList.get(i))) continue;
            allPlayersReady = false;
        }
        for (User u : gameUserList) {
            if (playerReadyList.contains(u)) {
                this.userListItemHashMap.get(u).getPlayerReadyView().setImage(DataLoader.getInstance().getGameImage(GameImage.CHECK));
                Tooltip tooltipReady = new Tooltip(this.getBundle().getString("readyUserTooltip"));
                Tooltip.install((Node)this.userListItemHashMap.get(u).getPlayerReadyView(), (Tooltip)tooltipReady);
                continue;
            }
            if (playerReadyList.contains(u) || !this.userListItemHashMap.containsKey(u)) continue;
            this.userListItemHashMap.get(u).getPlayerReadyView().setImage(DataLoader.getInstance().getGameImage(GameImage.CROSS));
            Tooltip tooltipReady = new Tooltip(this.getBundle().getString("NotReadyUserTooltip"));
            Tooltip.install((Node)this.userListItemHashMap.get(u).getPlayerReadyView(), (Tooltip)tooltipReady);
        }
        if (gameUserList.size() < 2) {
            this.notEnoughPlayerLabel.setText(this.getBundle().getString("notEnoughPlayer"));
        } else if (gameUserList.size() >= 2 && !allPlayersReady) {
            if (this.mainWindowController.getGame().isHost(this.mainWindowController.getClient().getUser())) {
                this.notEnoughPlayerLabel.setText(this.getBundle().getString("noFigurePicked"));
            } else {
                this.notEnoughPlayerLabel.setText(this.getBundle().getString("userFigureWarning"));
            }
        }
        if (allPlayersReady && gameUserList.size() >= 2) {
            this.startGameButton.setDisable(false);
            this.notEnoughPlayerLabel.setVisible(false);
        } else if (this.mainWindowController.getGame().isHost(this.mainWindowController.getClient().getUser())) {
            this.startGameButton.setDisable(true);
            this.notEnoughPlayerLabel.setVisible(true);
        } else if (!this.mainWindowController.getGame().isHost(this.mainWindowController.getClient().getUser()) && this.mainWindowController.getGame().getPlayerReady().contains(this.mainWindowController.getClient().getUser())) {
            this.notEnoughPlayerLabel.setVisible(false);
        } else {
            this.notEnoughPlayerLabel.setVisible(true);
        }
    }

    public void moveLeftFigureList(ActionEvent actionEvent) {
        this.changeFigure(false);
    }

    public void moveRightFigureList(ActionEvent actionEvent) {
        this.changeFigure(true);
    }

    private void changeFigure(boolean showNext) {
        this.current = showNext ? this.current.next() : this.current.previous();
        if (this.blackListFigureSources.values().contains(this.current)) {
            this.changeFigure(showNext);
            return;
        }
        this.figureView.getFigure().setFigureForm(DataLoader.getInstance().getFigureForm(this.current));
        ThreadRunner.run(() -> {
            Client client = this.mainWindowController.getClient();
            FigureChangedAction change = new FigureChangedAction(client.getUser(), this.current, client.getUser());
            client.addAction(change, this.mainWindowController.getGame());
        });
    }

    public FigureView getFigureView() {
        return this.figureView;
    }

    public void addBlackListFigure(FigureChangedAction figureChanged) {
        this.blackListFigureSources.put(figureChanged.getUser(), figureChanged.getFigureSource());
    }

    @FXML
    public void sendChatMessage() {
        if (!this.chatMessage.getText().trim().isEmpty()) {
            String text = this.chatMessage.getText().trim();
            ThreadRunner.run(() -> {
                MessageAction message = new MessageAction(this.getMainWindowController().getClient().getUser(), text, this.getMainWindowController().getClient().getUser());
                this.getMainWindowController().getClient().addAction(message, this.getMainWindowController().getGame());
            });
            this.chatMessage.clear();
        }
    }

    public void addChatMessage(MessageAction messageAction) {
        Message message;
        if (messageAction.getSender().equals(System.SYSTEM_USER)) {
            message = new SystemMessage(messageAction);
        } else {
            Color color = Color.BLACK;
            message = new UserMessage(messageAction, color);
        }
        Platform.runLater(() -> {
            this.chat.getItems().add(message);
            this.chat.scrollTo(message);
        });
    }

    public HashMap<User, FigureSource> getFigureMap() {
        HashMap<User, FigureSource> figureMap = new HashMap<User, FigureSource>();
        figureMap.putAll(this.blackListFigureSources);
        figureMap.put(this.getMainWindowController().getClient().getUser(), this.current);
        for (User user : this.getMainWindowController().getGame().getUsers()) {
            figureMap.putIfAbsent(user, FigureSource.POLICE_CAR);
        }
        return figureMap;
    }

    public void showKickFromGameDialog() {
        this.logger.info("Player was kicked from the game");
        ResourceBundle resBundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.LOBBY, this.getMainWindowController().getClient().getUser().getLocale());
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(resBundle.getString("kicked_title"));
        alert.setHeaderText(resBundle.getString("kicked_header"));
        alert.setContentText(resBundle.getString("kicked_content"));
        Button okButton = (Button)alert.getDialogPane().lookupButton(ButtonType.OK);
        ((Button)alert.getDialogPane().lookupButton(ButtonType.OK)).setPrefWidth(110.0);
        okButton.setText("Ok");
        alert.getDialogPane().setMaxWidth(500.0);
        alert.showAndWait();
    }

    public void onKeyPressed(KeyEvent keyEvent) {
        this.mainWindowController.onKeyPressed(keyEvent);
        switch (keyEvent.getCode()) {
            case LEFT: {
                if (this.getMainWindowController().getGame().getPlayerReady().contains(this.getMainWindowController().getClient().getUser())) break;
                this.moveLeftFigureList(null);
                break;
            }
            case RIGHT: {
                if (this.getMainWindowController().getGame().getPlayerReady().contains(this.getMainWindowController().getClient().getUser())) break;
                this.moveRightFigureList(null);
                break;
            }
        }
    }

    public List<User> getPlayerReady() {
        return this.getMainWindowController().getGame().getPlayerReady();
    }

    public ResourceBundle getBundle() {
        return this.bundle;
    }

    private class Skin
    extends ListViewSkin {
        public Skin(ListView listView) {
            super(listView);
        }

        public void refresh() {
            ((ListView<?>) getSkinnable()).refresh();
        }
    }
}


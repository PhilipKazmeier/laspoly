/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.animation.Interpolator
 *  javafx.animation.Transition
 *  javafx.application.Platform
 *  javafx.beans.value.ObservableValue
 *  javafx.collections.FXCollections
 *  javafx.collections.ObservableList
 *  javafx.collections.transformation.FilteredList
 *  javafx.event.ActionEvent
 *  javafx.event.EventHandler
 *  javafx.fxml.FXML
 *  javafx.fxml.Initializable
 *  javafx.geometry.Insets
 *  javafx.scene.Cursor
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.control.Alert
 *  javafx.scene.control.Alert$AlertType
 *  javafx.scene.control.Button
 *  javafx.scene.control.ButtonType
 *  javafx.scene.control.Dialog
 *  javafx.scene.control.Label
 *  javafx.scene.control.ListCell
 *  javafx.scene.control.ListView
 *  javafx.scene.control.TextField
 *  javafx.scene.control.ToggleButton
 *  javafx.scene.control.Tooltip
 *  javafx.scene.image.Image
 *  javafx.scene.image.ImageView
 *  javafx.scene.input.KeyEvent
 *  javafx.scene.layout.AnchorPane
 *  javafx.scene.layout.HBox
 *  javafx.scene.layout.Pane
 *  javafx.scene.layout.Region
 *  javafx.scene.paint.Color
 *  javafx.stage.Stage
 *  javafx.util.Callback
 *  javafx.util.Duration
 */
package de.hhn.seb.labsw.laspoly.view.game;

import de.hhn.seb.labsw.laspoly.System;
import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.FinishTurn;
import de.hhn.seb.labsw.laspoly.model.action.LeaveGameAction;
import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.model.action.PropertyBoughtAction;
import de.hhn.seb.labsw.laspoly.model.action.SwapOfferAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.action.TravelAction;
import de.hhn.seb.labsw.laspoly.model.card.action.ActionCard;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuDrawable;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuProvider;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.FieldConfiguration;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.model.field.TrainStation;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.model.message.IngameMessage;
import de.hhn.seb.labsw.laspoly.model.message.Message;
import de.hhn.seb.labsw.laspoly.model.message.MessageFilter;
import de.hhn.seb.labsw.laspoly.network.client.Client;
import de.hhn.seb.labsw.laspoly.utils.Final;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.StringValidator;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.audio.BackgroundMusic;
import de.hhn.seb.labsw.laspoly.utils.audio.Sound;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FigureSource;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.BaseController;
import de.hhn.seb.labsw.laspoly.view.MainWindowController;
import de.hhn.seb.labsw.laspoly.view.about.AboutWindow;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import de.hhn.seb.labsw.laspoly.view.game.GameWindow;
import de.hhn.seb.labsw.laspoly.view.game.NotificationManager;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.BuyDialog;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.CasinoDialog;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.FinishTurnDialog;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.PreviewManager;
import de.hhn.seb.labsw.laspoly.view.settings.SettingsWindow;
import java.awt.Toolkit;
import java.net.URL;
import java.util.Collection;
import java.util.HashMap;
import java.util.Locale;
import java.util.Optional;
import java.util.ResourceBundle;
import java.util.function.Consumer;
import java.util.logging.Logger;
import javafx.animation.Interpolator;
import javafx.animation.Transition;
import javafx.application.Platform;
import javafx.beans.value.ObservableValue;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.geometry.Insets;
import javafx.scene.Cursor;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Dialog;
import javafx.scene.control.Label;
import javafx.scene.control.ListCell;
import javafx.scene.control.ListView;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.Tooltip;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Pane;
import javafx.scene.layout.Region;
import javafx.scene.paint.Color;
import javafx.stage.Stage;
import javafx.util.Callback;
import javafx.util.Duration;

public class GameController
implements Initializable,
BaseController {
    private static Logger logger;
    private FinishTurnDialog finishTurnDialog;
    @FXML
    private Pane gameSceneArea;
    @FXML
    private Pane chatPane;
    @FXML
    private ToggleButton toggleall;
    @FXML
    private ToggleButton toggleuser;
    @FXML
    private ToggleButton togglesystem;
    @FXML
    private Button sendChatButton;
    @FXML
    private ListView<Message> chatList;
    @FXML
    private Button settings;
    @FXML
    private Button about;
    @FXML
    private Button close;
    @FXML
    private HBox closeHbox;
    @FXML
    private HBox showChatHbox;
    @FXML
    private Label gameLabel;
    @FXML
    private Label notificationCounter;
    @FXML
    private TextField messageBox;
    @FXML
    private Label turnLabel;
    @FXML
    private Button standardView;
    private FilteredList<Message> filteredMessageList;
    private ObservableList<Message> messages;
    private MessageFilter filter;
    private CasinoDialog casinoDialog;
    private GameScene scene;
    private ResourceBundle bundle;
    private ResourceBundle bundleActionCard;
    private boolean purchaseVisible = false;
    private GameWindow gameWindow;
    private GameHandler handler;
    private MainWindowController mainWindowController;
    private NotificationManager notificationManager;

    public GameController() {
        logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
    }

    public void initialize(URL location, ResourceBundle resources) {
        this.finishTurnDialog = null;
        this.turnLabel.setText("");
        this.messages = FXCollections.observableArrayList();
        this.filteredMessageList = new FilteredList(this.messages, p -> true);
        this.filter = MessageFilter.BOTH;
        this.notificationManager = new NotificationManager(this.notificationCounter, (Region)this.gameSceneArea, (Region)this.chatPane);
        this.chatList.setOnMousePressed(e -> this.chatList.getSelectionModel().clearSelection());
        this.chatList.setItems(this.filteredMessageList);
        this.handler = new GameHandler(this);
        this.chatList.setCellFactory((Callback)new Callback<ListView<Message>, ListCell<Message>>(){

            public ListCell<Message> call(ListView<Message> param) {
                return new ListCell<Message>(){

                    protected void updateItem(Message message, boolean empty) {
                        super.updateItem(message, empty);
                        this.setPadding(new Insets(0.0, 0.0, 0.0, 0.0));
                        if (!empty) {
                            message.draw().prefWidthProperty().bind((ObservableValue)this.widthProperty());
                            this.setGraphic((Node)message.draw());
                        } else {
                            this.setGraphic(null);
                        }
                    }
                };
            }
        });
        ImageView sendButtonView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.SEND));
        sendButtonView.setFitHeight(25.0);
        sendButtonView.setFitWidth(25.0);
        this.sendChatButton.setGraphic((Node)sendButtonView);
        this.sendChatButton.setCursor(Cursor.HAND);
        this.showChatHbox.visibleProperty().bind((ObservableValue)this.chatPane.visibleProperty().not());
        this.showChatHbox.setCursor(Cursor.HAND);
        this.closeHbox.setOnMouseClicked(e -> this.onToggleChatPane());
        this.closeHbox.setCursor(Cursor.HAND);
        this.toggleall.setSelected(true);
        PreviewManager.setMenuButtonCreationFunction(cons -> {
            ActionMenuProvider prov = new ActionMenuProvider(GameScene.getResources(), new String[0]);
            this.handler.handlePreviewActions((ActionMenuDrawable)cons, prov);
            return prov;
        });
        ImageView settingsView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.GEAR));
        settingsView.setFitHeight(25.0);
        settingsView.setFitWidth(25.0);
        this.settings.setGraphic((Node)settingsView);
        this.settings.setCursor(Cursor.HAND);
        ImageView aboutView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.QUESTION_MARK));
        aboutView.setFitHeight(25.0);
        aboutView.setFitWidth(25.0);
        this.about.setGraphic((Node)aboutView);
        this.about.setCursor(Cursor.HAND);
        ImageView closeView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS_WHITE));
        closeView.setFitHeight(25.0);
        closeView.setFitWidth(25.0);
        this.close.setGraphic((Node)closeView);
        this.close.setCursor(Cursor.HAND);
        this.standardView.setCursor(Cursor.HAND);
        this.messageBox.lengthProperty().addListener((observable, oldValue, newValue) -> {
            if (this.messageBox.getText().length() >= 140) {
                this.messageBox.setText(this.messageBox.getText().substring(0, 140));
            }
        });
        this.messageBox.textProperty().addListener((observable, oldValue, newValue) -> this.sendChatButton.setDisable(newValue.trim().isEmpty()));
        BackgroundMusic.play("jazzcomedy");
    }

    public void handleTravel(TrainStation station, int fee) {
        EventHandler playerIndicatorListener = event -> this.getScene().getPlayerIndicator().show(this.getClientPlayer());
        if (this.handler.getClientPlayer().removeMoney(fee)) {
            TransactionAction transaction = new TransactionAction(this.handler.getClientPlayer().getUser(), fee, false, this.handler.getClientPlayer().getUser());
            this.handler.addAction(transaction);
            this.handler.getScene().getPlayerIndicator().hide();
            int oldPos = this.handler.getClientPlayer().getFigure().getField().getPosition();
            this.handler.getClientPlayer().getFigure().placeFigure(station, playerIndicatorListener, () -> {}, Figure.FigureAnimation.ANIM_TRAVEL);
            this.handler.setUserHasTravelledThisRound(true);
            TravelAction travel = new TravelAction(this.handler.getClientPlayer().getUser(), this.handler.getClientPlayer().getUser(), station.getPosition());
            this.handler.addAction(travel);
            if (oldPos > travel.getPosition()) {
                this.handler.getClientPlayer().addMoney(200);
                TransactionAction trans = new TransactionAction(this.handler.getClientPlayer().getUser(), 200, true, this.handler.getClientPlayer().getUser());
                this.handler.addAction(trans);
            }
        } else {
            this.handler.kickPlayer(this.handler.getClientPlayer().getUser(), "lostNoMoneyLeft");
        }
    }

    @Override
    public void updateLanguage() {
    }

    @Override
    public void onUpdate() {
    }

    @Override
    public void stopUpdate() {
        this.handler.getClient().stopListening();
        this.handler.stopPingTimer();
    }

    @Override
    public MainWindowController getMainWindowController() {
        return this.mainWindowController;
    }

    @Override
    public void setMainWindowController(MainWindowController mainWindowCon) {
        this.mainWindowController = mainWindowCon;
    }

    @Override
    public void closeProgram() {
        try {
            this.handler.kickPlayer(this.handler.getClientPlayer().getUser(), "leave");
        }
        catch (InvalidParameterException e) {
            logger.severe("Can be ignored:" + e.getMessage());
            Logger.getAnonymousLogger().severe(e.getMessage());
        }
    }

    public void addChatMessage(MessageAction messageAction) {
        IngameMessage message;
        if (messageAction.getSender().equals(System.SYSTEM_USER)) {
            message = new IngameMessage(messageAction, MessageFilter.SYSTEM, MessageFilter.BOTH);
        } else {
            Color color = this.handler.getPlayer(messageAction.getSender()).getColor();
            message = new IngameMessage(messageAction, color, MessageFilter.USER, MessageFilter.BOTH);
        }
        this.notificationManager.showNewNotification(message, () -> {
            if (!this.chatPane.isVisible()) {
                this.onToggleChatPane();
                this.notificationManager.hideAllDialogs();
            } else {
                logger.warning("chatpane was visible at clicking a dialog");
            }
        });
        Platform.runLater(() -> {
            this.messages.add(message);
            this.chatList.scrollTo(this.chatList.getItems().size() - 1);
        });
    }

    public void changeFilter(MessageFilter mesFilter) {
        this.filter = mesFilter;
        this.filteredMessageList.setPredicate(p -> p instanceof IngameMessage && ((IngameMessage)p).appliesToFilter(mesFilter));
    }

    public Field getField(int position) {
        return this.handler.getField(position);
    }

    public void setUpGameScene(HashMap<User, FigureSource> figureList, Stage stage, Locale locale) {
        ResourceBundle chosenResources = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.GAME_SCENE, locale);
        if (figureList.size() < 2 || figureList.size() > 4) {
            throw new InvalidParameterException("Size of figure list has to be be between 2 and 4.", "figureList", figureList.size());
        }
        figureList.forEach((user, figureSource) -> {
            Player player = new Player((User)user);
            this.handler.putPlayer((User)user, player);
            Figure figure = new Figure((User)user, DataLoader.getInstance().getFigureForm((FigureSource)(figureSource)));
            figure.getFigureForm().setScale(130.0);
            player.chooseFigure(figure, DataLoader.getInstance().getFigureColor((FigureSource)(figureSource)));
            this.handler.putFigure(player, figure);
            if (this.handler.isClient((User)user)) {
                this.setClientPlayer(player);
            }
        });
        this.scene = new GameScene(new Group(), chosenResources, this.handler.getFigures(), this);
        this.scene.widthProperty().bind((ObservableValue)this.gameSceneArea.widthProperty());
        this.scene.heightProperty().bind((ObservableValue)this.gameSceneArea.heightProperty());
        this.scene.setupActionCardDeck();
        this.gameSceneArea.getChildren().add(this.scene);
        this.scene.setGameSceneArea(this.gameSceneArea);
        this.messageBox.setPromptText(chosenResources.getString("chat_promt"));
        this.toggleall.setText(chosenResources.getString("chat_all"));
        this.togglesystem.setText(chosenResources.getString("chat_system"));
        this.toggleuser.setText(chosenResources.getString("chat_chatuser"));
        this.sendChatButton.setText(chosenResources.getString("chat_send"));
        Final<String> text = new Final<String>(chosenResources.getString("unreadNot"));
        this.notificationManager.getUnreadNotificationCount().addListener(observable -> {
            text.set(String.format((String)text.value(), this.notificationManager.getUnreadNotificationCount().get()));
            this.notificationCounter.setTooltip(new Tooltip((String)text.value()));
        });
        this.notificationCounter.setTooltip(new Tooltip(String.format(text.value(), 0)));
        this.settings.setTooltip(new Tooltip(chosenResources.getString("tooltip_settings")));
        this.about.setTooltip(new Tooltip(chosenResources.getString("tooltip_about")));
        this.close.setTooltip(new Tooltip(chosenResources.getString("tooltip_close")));
        this.standardView.setTooltip(new Tooltip(chosenResources.getString("tooltip_standardview")));
        this.handler.startPingHeartbeat();
    }

    public void placeFigure(User user, int fieldPosition) {
        this.handler.placeFigure(user, fieldPosition);
    }

    public void placeFigure(int roll1, int roll2) {
        this.hideCasinoDialog();
        this.handler.placeFigure(roll1, roll2);
    }

    void enableFinishTurn() {
        if (this.finishTurnDialog != null) {
            return;
        }
        this.finishTurnDialog = new FinishTurnDialog(this.bundle, this.gameSceneArea);
        this.finishTurnDialog.setListener(this::finishTurn);
        this.finishTurnDialog.show();
    }

    public void placeFigure(Figure fig, Field field) {
        this.handler.placeFigure(fig, field);
    }

    public final void incrementLapCounter() {
        this.handler.incrementLapCounter();
    }

    public void disableFinishTurn() {
        if (this.finishTurnDialog != null) {
            this.finishTurnDialog.hide();
            this.finishTurnDialog = null;
            this.getScene().getPlayerIndicator().hide();
        }
    }

    public void nextUserOnTurn(User user) {
        this.handler.nextUserOnTurn(user);
    }

    @FXML
    public void finishTurn() {
        this.disableFinishTurn();
        if (this.handler.clientIsCurrentPlayer()) {
            this.scene.finishTurn();
            this.handler.addAction(new FinishTurn(this.getClientPlayer().getUser()));
            this.disableFinishTurn();
        }
    }

    public void addAction(Action action) {
        if (action instanceof SwapOfferAction) {
            java.lang.System.out.println("Adding action: " + action);
        }
        this.handler.addAction(action);
    }

    public void showPurchaseDialog(Property property) {
        if (this.handler.getClientPlayer().getMoneyAmount() < property.getPrice()) {
            this.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(this.bundle.getString("notEnoughMoneyToPurchase"), property.getName()), this.handler.getClientPlayer().getUser()));
            if (!this.handler.getDiceActive() && this.getClientPlayer().equals(this.getPlayer(this.getCurrent()))) {
                this.enableFinishTurn();
            }
            return;
        }
        this.scene.getPlayerIndicator().show(this.getPlayer(this.getCurrent()));
        this.purchaseVisible = true;
        boolean dialogWasVis = this.finishTurnDialog == null;
        this.disableFinishTurn();
        ResourceBundle res = GameScene.getResources();
        BuyDialog dialog = new BuyDialog(res, this.getClientPlayer(), property, this.gameSceneArea);
        Consumer<Boolean> onBuyListener = hasBought -> {
            ThreadRunner.onFX(dialog::hide, 5L);
            if (!hasBought.booleanValue()) {
                if (dialogWasVis) {
                    this.disableFinishTurn();
                } else if (this.getClientPlayer().equals(this.getPlayer(this.getCurrent()))) {
                    this.enableFinishTurn();
                }
                if (this.handler.getDiceActive()) {
                    this.scene.setDiceActive();
                    this.handler.setDiceActive(false);
                    this.disableFinishTurn();
                } else if (this.getClientPlayer().equals(this.getPlayer(this.getCurrent()))) {
                    this.enableFinishTurn();
                }
                this.purchaseVisible = false;
                return;
            }
            if (this.handler.getClientPlayer().removeMoney(property.getPrice())) {
                Sound.PURCHASE.play();
                TransactionAction transactionAdd = new TransactionAction(this.handler.getClientPlayer().getUser(), property.getPrice(), false, this.handler.getClientPlayer().getUser());
                this.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(this.bundle.getString("youbought"), property.getName()), System.SYSTEM_USER));
                this.handler.addAction(transactionAdd);
                this.handler.getClientPlayer().add(property);
                ThreadRunner.run(() -> {
                    PropertyBoughtAction sold = new PropertyBoughtAction(property, this.handler.getClientPlayer().getUser(), this.handler.getClientPlayer().getUser());
                    this.handler.addAction(sold);
                });
                property.setOwner(this.handler.getClientPlayer());
                if (dialogWasVis) {
                    this.disableFinishTurn();
                } else if (this.getClientPlayer().equals(this.getPlayer(this.getCurrent()))) {
                    this.enableFinishTurn();
                }
                if (this.handler.getDiceActive()) {
                    this.scene.setDiceActive();
                    this.handler.setDiceActive(false);
                    this.disableFinishTurn();
                } else if (this.getClientPlayer().equals(this.getPlayer(this.getCurrent()))) {
                    this.enableFinishTurn();
                }
                this.purchaseVisible = false;
            }
        };
        dialog.getLayout().setLayoutX(0.0);
        dialog.getLayout().setLayoutY(0.0);
        dialog.setListener(onBuyListener);
        dialog.show();
    }

    public Player getPlayer(User user) {
        return this.handler.getPlayer(user);
    }

    public void showLostGameDialog(String identifier) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
        alert.getDialogPane().getStyleClass().add("alertStyle");
        alert.setGraphic((Node)new ImageView(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png").toString()));
        Stage stage = (Stage)alert.getDialogPane().getScene().getWindow();
        stage.getIcons().add(new Image(this.getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
        alert.setHeaderText(this.bundle.getString("youLost"));
        alert.setTitle(this.bundle.getString("condolences"));
        if (identifier.equals("lostNoMoneyLeft")) {
            alert.setContentText(this.bundle.getString("youLostNoMoneyLeft"));
        }
        Button okButton = (Button)alert.getDialogPane().lookupButton(ButtonType.OK);
        ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
        checkView.setFitHeight(25.0);
        checkView.setFitWidth(25.0);
        okButton.setGraphic((Node)checkView);
        okButton.setCursor(Cursor.HAND);
        okButton.getStyleClass().add("greenActionButton");
        alert.getDialogPane().setMaxWidth(500.0);
        alert.showAndWait().ifPresent(bt -> {
            this.stopUpdate();
            this.gameSceneArea.getChildren().clear();
            this.gameWindow.close();
            this.mainWindowController.showLobby();
            this.mainWindowController.getMainWindow().show();
        });
    }

    public void removePlayer(User user, String ident) {
        this.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(this.bundle.getString(ident), user.getName()), this.handler.getClientPlayer().getUser()));
        try {
            if (this.handler.getPlayer(user).getPropertyList().size() != 0 && this.handler.getPlayers().containsKey(user)) {
                for (Property p : this.handler.getPlayer(user).getPropertyList()) {
                    if (p instanceof Street) {
                        Street street = (Street)p;
                        int size = street.getBuildings().size();
                        for (int i = 0; i < size; ++i) {
                            Platform.runLater(street::knockDownBuilding);
                        }
                    }
                    p.setOwner(null);
                }
            }
            this.handler.getPlayer(user).clear();
            Figure fig = this.handler.getPlayer(user).getFigure();
            ThreadRunner.onFX(() -> this.scene.getBoard().removeFigure(fig), 10L);
            this.handler.getPlayers().remove(user);
        }
        catch (InvalidParameterException e) {
            logger.info("Can be ignored: " + e.getMessage());
        }
    }

    public User getCurrent() {
        return this.handler.getCurrent();
    }

    public ActionCard drawCard() {
        return this.scene.getCardDeck().pullCard();
    }

    public Player getClientPlayer() {
        return this.handler.getClientPlayer();
    }

    public void setClientPlayer(Player player) {
        this.handler.setClientPlayer(player);
    }

    public void checkIfWon(String ident, User user) {
        this.handler.checkIfWon(ident, user);
    }

    public GameScene getScene() {
        return this.scene;
    }

    public Collection<Player> getPlayers() {
        return this.handler.getPlayers().values();
    }

    @FXML
    public void onToggleChatPane() {
        double oldRightAnchor;
        double newRightAnchor;
        this.chatPane.setTranslateX(300.0);
        this.chatPane.setVisible(!this.chatPane.isVisible());
        if (this.chatPane.isVisible()) {
            this.notificationManager.hideAllDialogs();
            newRightAnchor = this.chatPane.getPrefWidth();
            oldRightAnchor = 0.0;
        } else {
            newRightAnchor = 0.0;
            oldRightAnchor = this.chatPane.getPrefWidth();
        }
        final double delta = newRightAnchor - oldRightAnchor;
        Transition rightAnchorTransition = new Transition(){
            {
                this.setCycleDuration(Duration.millis((double)500.0));
                this.setInterpolator(Interpolator.EASE_OUT);
            }

            protected void interpolate(double frac) {
                double curVal = oldRightAnchor + frac * delta;
                AnchorPane.setRightAnchor((Node)GameController.this.scene.getStackPaneParent(), (Double)curVal);
                GameController.this.chatPane.setTranslateX(300.0 - curVal);
            }
        };
        rightAnchorTransition.play();
    }

    public ResourceBundle getBundle() {
        return this.bundle;
    }

    @FXML
    public void onAboutClicked() {
        AboutWindow.show(this.handler.getClient().getUser().getLocale());
    }

    public void onCloseClicked() {
        ResourceBundle closeBundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.LEAVE_GAME, this.handler.getClient().getUser().getLocale());
        Dialog dialog = new Dialog();
        dialog.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
        dialog.getDialogPane().getStyleClass().add("alertStyle");
        ButtonType lobbyType = new ButtonType(closeBundle.getString("lobbyText"));
        ButtonType closeType = new ButtonType(closeBundle.getString("close"));
        dialog.getDialogPane().getButtonTypes().addAll(new ButtonType[]{ButtonType.CANCEL, lobbyType, closeType});
        Stage stage = (Stage)dialog.getDialogPane().getScene().getWindow();
        stage.getIcons().add(new Image(this.getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
        Button cancelButton = (Button)dialog.getDialogPane().lookupButton(ButtonType.CANCEL);
        cancelButton.setPrefWidth(120.0);
        Button lobbyButton = (Button)dialog.getDialogPane().lookupButton(lobbyType);
        lobbyButton.setPrefWidth(120.0);
        Button closeButton = (Button)dialog.getDialogPane().lookupButton(closeType);
        closeButton.setPrefWidth(120.0);
        ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS_GRAY));
        crossView.setFitHeight(25.0);
        crossView.setFitWidth(25.0);
        cancelButton.setGraphic((Node)crossView);
        cancelButton.setCursor(Cursor.HAND);
        cancelButton.getStyleClass().add("actionButton");
        ImageView cross = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
        cross.setFitHeight(25.0);
        cross.setFitWidth(25.0);
        closeButton.setGraphic((Node)cross);
        closeButton.setCursor(Cursor.HAND);
        closeButton.getStyleClass().add("redActionButton");
        ImageView lobbyView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.HOME));
        lobbyView.setFitHeight(25.0);
        lobbyView.setFitWidth(25.0);
        lobbyButton.setGraphic((Node)lobbyView);
        lobbyButton.setCursor(Cursor.HAND);
        lobbyButton.getStyleClass().add("greenActionButton");
        dialog.setTitle(closeBundle.getString("title"));
        dialog.setHeaderText(closeBundle.getString("header"));
        dialog.setContentText(closeBundle.getString("content"));
        Optional optional = dialog.showAndWait();
        optional.ifPresent(buttonType3 -> {
            if (buttonType3 == lobbyType) {
                this.leaveGame();
            } else if (buttonType3 == closeType) {
                this.closeProgram();
                java.lang.System.exit(0);
            }
        });
    }

    public void leaveGame() {
        this.stopUpdate();
        this.finishTurn();
        LeaveGameAction leaveGame = new LeaveGameAction(this.handler.getClientPlayer().getUser(), this.handler.getClientPlayer().getUser());
        ThreadRunner.run(() -> {
            this.handler.stopPingTimer();
            this.handler.addAction(leaveGame);
        }, 1000L);
        this.gameSceneArea.getChildren().clear();
        this.gameWindow.close();
        PreviewManager.reset();
        DataLoader.getInstance().forceLoad();
        FieldConfiguration.load();
        this.mainWindowController.showLobby();
        this.mainWindowController.getMainWindow().show();
    }

    public void onSettingsClicked() {
        SettingsWindow window = new SettingsWindow(this.handler.getClient().getUser().getLocale(), this.handler.getSettingsHandler());
        window.show();
    }

    @FXML
    public void onSendMessage() {
        String text = this.messageBox.getText().trim();
        if (!text.isEmpty() && StringValidator.isAllowed(text)) {
            ThreadRunner.run(() -> this.handler.addAction(new MessageAction(this.getClientPlayer().getUser(), text, this.getClientPlayer().getUser())));
            this.messageBox.clear();
        } else {
            Toolkit.getDefaultToolkit().beep();
        }
    }

    public void onKeyPressed(KeyEvent keyEvent) {
        this.handler.onKeyPressed(keyEvent);
    }

    public void onKeyReleased(KeyEvent keyEvent) {
        this.handler.onKeyReleased(keyEvent);
    }

    public void setClient(Client runningClient) {
        this.handler.setClient(runningClient);
        this.bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.GAME_WINDOW, this.handler.getClient().getUser().getLocale());
        this.bundleActionCard = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ACTION_CARD, this.handler.getClient().getUser().getLocale());
        this.standardView.setText(this.bundle.getString("showStandardView"));
    }

    public ResourceBundle getBundleActionCard() {
        return this.bundleActionCard;
    }

    public void showStandardView() {
        this.scene.showBoardView();
    }

    public void showCasinoDialog() {
        this.getScene().getPlayerIndicator().show(this.getPlayer(this.getCurrent()));
        this.casinoDialog = new CasinoDialog(this.bundle, this.gameSceneArea);
        this.casinoDialog.show();
    }

    public void hideCasinoDialog() {
        if (this.casinoDialog != null) {
            this.casinoDialog.hide();
        }
    }

    public GameWindow getGameWindow() {
        return this.gameWindow;
    }

    public void setGameWindow(GameWindow window) {
        this.gameWindow = window;
        this.gameLabel.setText("#" + window.getGame().getId() + " " + window.getGame().getName());
    }

    public boolean isPurchaseVisible() {
        return this.purchaseVisible;
    }

    public Label getTurnLabel() {
        return this.turnLabel;
    }

    public GameHandler getHandler() {
        return this.handler;
    }

    public void toggleMessageFilter(ActionEvent actionEvent) {
        Object src = actionEvent.getSource();
        this.togglesystem.setSelected(src.equals(this.togglesystem));
        this.toggleuser.setSelected(src.equals(this.toggleuser));
        this.toggleall.setSelected(src.equals(this.toggleall));
        if (src.equals(this.togglesystem)) {
            this.changeFilter(MessageFilter.SYSTEM);
        } else if (src.equals(this.toggleuser)) {
            this.changeFilter(MessageFilter.USER);
        } else if (src.equals(this.toggleall)) {
            this.changeFilter(MessageFilter.BOTH);
        }
    }

    public void hideChatPane() {
        if (this.chatPane.isVisible()) {
            this.onToggleChatPane();
        }
    }

    public boolean isChatPaneVisible() {
        return this.chatPane.isVisible();
    }
}


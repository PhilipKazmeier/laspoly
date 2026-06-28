/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 *  javafx.event.EventHandler
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Alert
 *  javafx.scene.control.Alert$AlertType
 *  javafx.scene.control.Button
 *  javafx.scene.control.ButtonType
 *  javafx.scene.image.Image
 *  javafx.scene.image.ImageView
 *  javafx.scene.input.KeyCode
 *  javafx.scene.input.KeyEvent
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.view.game;

import de.hhn.seb.labsw.laspoly.System;
import de.hhn.seb.labsw.laspoly.exception.FigureNotFoundException;
import de.hhn.seb.labsw.laspoly.exception.InvalidConditionException;
import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.exception.NotImplementedException;
import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.DrawedActionCardAction;
import de.hhn.seb.labsw.laspoly.model.action.KickPlayerAction;
import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.model.action.MoveFigure;
import de.hhn.seb.labsw.laspoly.model.action.PaidOutOfPrisonAction;
import de.hhn.seb.labsw.laspoly.model.action.PingAction;
import de.hhn.seb.labsw.laspoly.model.action.RolledAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.building.Factory;
import de.hhn.seb.labsw.laspoly.model.building.Hotel;
import de.hhn.seb.labsw.laspoly.model.building.House;
import de.hhn.seb.labsw.laspoly.model.card.PropertyPreviewCard;
import de.hhn.seb.labsw.laspoly.model.card.action.ActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.MoveActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.MoveForwardActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.MoveToNextTrainStationActionCard;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuDrawable;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuProvider;
import de.hhn.seb.labsw.laspoly.model.card.preview.PlayerPreviewCard;
import de.hhn.seb.labsw.laspoly.model.card.preview.PrisonPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.Attraction;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.FieldConfiguration;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.model.field.TrainStation;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.ActionField;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.Casino;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.FreeParkingField;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.GoToPrisonField;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.PayToCasinoField;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.Prison;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.StartField;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.model.settings.KeySettings;
import de.hhn.seb.labsw.laspoly.model.settings.Settings;
import de.hhn.seb.labsw.laspoly.model.settings.SettingsHandler;
import de.hhn.seb.labsw.laspoly.model.settings.SoundSettings;
import de.hhn.seb.labsw.laspoly.utils.GameConstants;
import de.hhn.seb.labsw.laspoly.network.client.Client;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.audio.Sound;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import de.hhn.seb.labsw.laspoly.view.game.eventhandler.ConstructFactoryHandler;
import de.hhn.seb.labsw.laspoly.view.game.eventhandler.ConstructHotelHandler;
import de.hhn.seb.labsw.laspoly.view.game.eventhandler.ConstructHouseHandler;
import de.hhn.seb.labsw.laspoly.view.game.eventhandler.DoMortgageHandler;
import de.hhn.seb.labsw.laspoly.view.game.eventhandler.SellBuildingHandler;
import de.hhn.seb.labsw.laspoly.view.game.eventhandler.SellPropertyHandler;
import de.hhn.seb.labsw.laspoly.view.game.eventhandler.SwapOfferHandler;
import de.hhn.seb.labsw.laspoly.view.game.eventhandler.UndoMortgageHandler;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import java.util.HashMap;
import java.util.Optional;
import java.util.ResourceBundle;
import java.util.Timer;
import java.util.TimerTask;
import java.util.logging.Logger;
import javafx.application.Platform;
import javafx.event.EventHandler;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.stage.Stage;

public class GameHandler {
    private static Logger logger;
    private final HashMap<User, Player> players;
    private final HashMap<Player, Figure> figures;
    private Client client;
    private User current;
    private Player clientPlayer;
    private int lapCounter = 0;
    private int turnCounter = 0;
    private SettingsHandler settingsHandler;
    private boolean userHasTravelledThisRound;
    private GameController controller;
    private boolean diceActive;
    private boolean altPressed;
    private boolean firstRollDone = false;
    private boolean cameToPrisonThisRound = false;
    private Timer pingTimer;
    private Alert wonGameAlert;

    public GameHandler(GameController gameController) {
        logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
        this.controller = gameController;
        this.players = new HashMap();
        this.figures = new HashMap();
        this.settingsHandler = new SettingsHandler();
        this.diceActive = false;
        this.altPressed = false;
        this.pingTimer = new Timer("game-ping", true);
    }

    public void startPingHeartbeat() {
        this.pingTimer.scheduleAtFixedRate(new TimerTask(){

            @Override
            public void run() {
                if (GameHandler.this.client != null && GameHandler.this.clientPlayer != null) {
                    GameHandler.this.addAction(new PingAction(GameHandler.this.clientPlayer.getUser()));
                }
            }
        }, 8000L, 10000L);
    }

    public User getCurrent() {
        return this.current;
    }

    public void setCurrent(User user) {
        this.current = user;
        if (this.getPlayer(this.getCurrent()).equals(this.getClientPlayer()) && !(this.getClientPlayer().getFigure().getField() instanceof Prison)) {
            this.controller.getScene().getPlayerIndicator().show(this.controller.getPlayer(this.controller.getCurrent()));
        } else {
            this.controller.getScene().getPlayerIndicator().hide();
        }
    }

    public Client getClient() {
        return this.client;
    }

    public void setClient(Client c) {
        this.client = c;
    }

    public Player getClientPlayer() {
        return this.clientPlayer;
    }

    public void setClientPlayer(Player player) {
        this.clientPlayer = player;
    }

    public boolean clientIsCurrentPlayer() {
        if (this.current == null) {
            logger.severe("No current user for checking if client is current player");
            return false;
        }
        return this.current.equals(this.clientPlayer.getUser());
    }

    public void putPlayer(User user, Player player) {
        this.players.put(user, player);
    }

    public void putFigure(Player player, Figure figure) {
        this.figures.put(player, figure);
    }

    public boolean isClient(User user) {
        if (this.client == null) {
            logger.severe("Not client for checking isClient");
            return false;
        }
        return this.client.getUser().equals(user);
    }

    public HashMap<Player, Figure> getFigures() {
        return this.figures;
    }

    public Player getPlayer(User user) {
        if (this.players.containsKey(user)) {
            return this.players.get(user);
        }
        throw new InvalidParameterException("Player for the given user should exist.", "user", user);
    }

    public final void incrementLapCounter() {
        ++this.lapCounter;
    }

    public final int getLapCounter() {
        return this.lapCounter;
    }

    public void incrementTurnCounter() {
        ++this.turnCounter;
    }

    public HashMap<User, Player> getPlayers() {
        return this.players;
    }

    public SettingsHandler getSettingsHandler() {
        return this.settingsHandler;
    }

    public int getTurnCounter() {
        return this.turnCounter;
    }

    public void handlePreviewActions(ActionMenuDrawable sender, ActionMenuProvider prov) {
        boolean isCurPlayer = this.getClientPlayer() != null && this.clientIsCurrentPlayer();
        java.lang.System.out.println(sender);
        if (sender instanceof PropertyPreviewCard) {
            boolean isSold;
            Object prop = ((PropertyPreviewCard)sender).getProperty();
            Player owner = ((Property)prop).getOwner();
            boolean clientIsOwner = owner != null && owner.equals(this.getClientPlayer());
            boolean isMortgaged = ((Property)prop).isMortgaged();
            boolean bl = isSold = ((Property)prop).getOwner() != null;
            if (prop instanceof Street) {
                Street str = (Street)prop;
                prov.setItemTexts("street_constructhouse", "street_constructhotel", "street_constructfactory", "street_sellbuilding_house", "street_sellbuilding_hotel", "street_sellbuilding_factory", "property_sell", "property_domortgage", "property_undomortgage", "property_makeswapoffer");
                prov.setItemsVisible(!isMortgaged && isCurPlayer && clientIsOwner && str.canConstructHouse(), !isMortgaged && isCurPlayer && clientIsOwner && str.canConstructHotel(), !isMortgaged && isCurPlayer && clientIsOwner && str.canConstructFactory(), isCurPlayer && clientIsOwner && str.getBuildings().size() >= 1 && str.getBuildings().get(0) instanceof House && str.canSellHouse(), isCurPlayer && clientIsOwner && str.getBuildings().size() >= 1 && str.getBuildings().get(0) instanceof Hotel && str.canSellHotel(), isCurPlayer && clientIsOwner && str.getBuildings().size() >= 1 && str.getBuildings().get(0) instanceof Factory && str.canSellFactory(), isCurPlayer && clientIsOwner && !isMortgaged && str.getBuildings().isEmpty(), isCurPlayer && clientIsOwner && !isMortgaged, isCurPlayer && clientIsOwner && isMortgaged, isSold && str.getBuildings().isEmpty());
                prov.setItemListeners(new ConstructHouseHandler(this, owner, str), new ConstructHotelHandler(this, owner, str), new ConstructFactoryHandler(this, owner, str), new SellBuildingHandler(this, owner, str), new SellBuildingHandler(this, owner, str), new SellBuildingHandler(this, owner, str), new SellPropertyHandler(this, str), new DoMortgageHandler(this, owner, str), new UndoMortgageHandler(this, owner, str), new SwapOfferHandler(this, str));
            } else if (prop instanceof TrainStation) {
                TrainStation station = (TrainStation)prop;
                prov.setItemTexts("station_doTravel", "property_sell", "property_domortgage", "property_undomortgage", "property_makeswapoffer");
                prov.setItemsVisible(isCurPlayer && this.getClientPlayer().getFigure().getField().equals(station) && !this.userHasTravelledThisRound && this.firstRollDone, isCurPlayer && clientIsOwner && !isMortgaged, isCurPlayer && clientIsOwner && !isMortgaged, isCurPlayer && clientIsOwner && isMortgaged, isSold);
                prov.setItemListeners(e -> {
                    this.getScene().showTravelDialog(station);
                    Sound.TRAIN_WHISTLE.play();
                }, new SellPropertyHandler(this, station), new DoMortgageHandler(this, owner, station), new UndoMortgageHandler(this, owner, station), new SwapOfferHandler(this, station));
            } else if (prop instanceof Attraction) {
                Attraction attraction = (Attraction)prop;
                prov.setItemTexts("property_sell", "property_domortgage", "property_undomortgage", "property_makeswapoffer");
                prov.setItemsVisible(isCurPlayer && clientIsOwner && !isMortgaged, isCurPlayer && clientIsOwner && !isMortgaged, isCurPlayer && clientIsOwner && isMortgaged, isSold);
                prov.setItemListeners(new SellPropertyHandler(this, attraction), new DoMortgageHandler(this, owner, attraction), new UndoMortgageHandler(this, owner, attraction), new SwapOfferHandler(this, attraction));
            }
        } else if (sender instanceof PlayerPreviewCard) {
            Platform.runLater(() -> {
                Player player = ((PlayerPreviewCard)sender).getPlayer();
                prov.setItemTexts("playerpreview_viewprop", "playerpreview_makeoffer");
                prov.setItemsVisible(player.getPropertyList().size() > 0, !this.isClient(player.getUser()));
                java.lang.System.out.println(prov);
                java.lang.System.out.println(prov.isActionMenuVisible());
                prov.setItemListeners(event -> this.getScene().showListOfProperties(player), event -> ThreadRunner.onFX(() -> this.controller.getScene().createSwapOffer(((PlayerPreviewCard)sender).getPlayer()), 5L));
            });
        } else if (sender instanceof PrisonPreviewCard) {
            prov.setItemTexts("prisonpreview_ransom");
            prov.setItemsVisible(isCurPlayer && this.getClientPlayer().getFigure().getField().getPosition() == 40 && !this.cameToPrisonThisRound);
            prov.setItemListeners(event -> {
                TransactionAction transaction = new TransactionAction(this.clientPlayer.getUser(), 50, false, this.clientPlayer.getUser());
                this.addAction(transaction);
                PaidOutOfPrisonAction paidOutOfPrisonAction = new PaidOutOfPrisonAction(this.clientPlayer.getUser(), this.clientPlayer.getUser());
                this.addAction(paidOutOfPrisonAction);
                this.getScene().getPlayerIndicator().hide();
                EventHandler playerIndicatorListener = event2 -> {
                    this.clientPlayer.getFigure().setNextRow(0);
                    this.getScene().getPlayerIndicator().show(this.getPlayer(this.getCurrent()));
                    if (this.clientPlayer.equals(this.getPlayer(this.getCurrent()))) {
                        this.controller.enableFinishTurn();
                    }
                };
                this.clientPlayer.getFigure().placeFigure(this.getField(0), playerIndicatorListener, () -> {}, Figure.FigureAnimation.ANIM_OUT_PRISON);
                this.setDiceActive(false);
                this.clientPlayer.setPrisonCounter(0);
                this.getScene().disableDices();
            });
        } else {
            throw new NotImplementedException("not implemented yet for: " + sender);
        }
    }

    public void setUserHasTravelledThisRound(boolean b) {
        this.userHasTravelledThisRound = b;
    }

    public void addAction(Action action) {
        if (action instanceof MessageAction) {
            this.addChatMessage((MessageAction)action);
        }
        this.client.addAction(action, this.controller.getGameWindow().getGame());
    }

    public void addChatMessage(MessageAction messageAction) {
        this.controller.addChatMessage(messageAction);
    }

    public ResourceBundle getBundle() {
        return this.controller.getBundle();
    }

    public GameScene getScene() {
        return this.controller.getScene();
    }

    public void kickPlayer(User user, String ident) {
        this.controller.finishTurn();
        ThreadRunner.run(() -> {
            this.addAction(new KickPlayerAction(user, this.getClientPlayer().getUser(), ident));
            this.pingTimer.cancel();
        });
    }

    public boolean getDiceActive() {
        return this.diceActive;
    }

    public void setDiceActive(boolean val) {
        this.diceActive = val;
    }

    public void onKeyPressed(KeyEvent keyEvent) {
        if (keyEvent.getCode().equals(KeyCode.ALT)) {
            this.altPressed = true;
        }
    }

    public void onAltShortCutMade(KeyCode keyCode) {
        KeySettings pref = this.settingsHandler.getKeySettings();
        if (keyCode.equals(pref.getKeyCode(KeySettings.KeyAction.MUTE_UN_MUTE))) {
            SoundSettings soundSettings = this.settingsHandler.getSoundSettings();
            soundSettings.setSound(!soundSettings.isSound());
            soundSettings.setBackgroundMusic(!soundSettings.isSound());
            soundSettings.setSoundEffect(!soundSettings.isSound());
            soundSettings.save();
            this.settingsHandler.updateSettings(Settings.Category.SOUND);
        } else if (keyCode.equals(pref.getKeyCode(KeySettings.KeyAction.SHOW_BOARD_VIEW))) {
            this.controller.getScene().onKeyPressed(KeySettings.KeyAction.SHOW_BOARD_VIEW);
        } else if (keyCode.equals(pref.getKeyCode(KeySettings.KeyAction.FULL_SCREEN))) {
            if (this.controller.getGameWindow().isFullScreen()) {
                this.controller.getGameWindow().setFullScreen(false);
            } else {
                this.controller.getGameWindow().setFullScreen(true);
            }
        } else if (keyCode.equals(pref.getKeyCode(KeySettings.KeyAction.ESC_GAME))) {
            this.controller.onCloseClicked();
        }
    }

    public void onKeyReleased(KeyEvent keyEvent) {
        this.controller.getScene().onKeyPressed(keyEvent.getCode());
        if (keyEvent.getCode().equals(KeyCode.ALT)) {
            this.altPressed = false;
        }
        if (this.altPressed) {
            this.onAltShortCutMade(keyEvent.getCode());
        }
    }

    public void checkIfWon(String ident, User user) {
        if (this.players.size() == 1 && this.wonGameAlert == null) {
            this.pingTimer.cancel();
            this.wonGameAlert = new Alert(Alert.AlertType.INFORMATION);
            this.wonGameAlert.getDialogPane().getStylesheets().add(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/alert.css").toExternalForm());
            this.wonGameAlert.getDialogPane().getStyleClass().add("alertStyle");
            this.wonGameAlert.setGraphic((Node)new ImageView(this.getClass().getResource("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png").toString()));
            Stage stage = (Stage)this.wonGameAlert.getDialogPane().getScene().getWindow();
            stage.getIcons().add(new Image(this.getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
            this.wonGameAlert.setHeaderText(this.getBundle().getString("youWon"));
            this.wonGameAlert.setTitle(this.getBundle().getString("congrats"));
            this.wonGameAlert.setContentText(String.format(this.getBundle().getString(ident), user.getName()));
            Button okButton = (Button)this.wonGameAlert.getDialogPane().lookupButton(ButtonType.OK);
            ImageView checkView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CHECK));
            checkView.setFitHeight(25.0);
            checkView.setFitWidth(25.0);
            okButton.setGraphic((Node)checkView);
            okButton.setCursor(Cursor.HAND);
            okButton.getStyleClass().add("greenActionButton");
            this.wonGameAlert.getDialogPane().setMaxWidth(500.0);
            Optional optional = this.wonGameAlert.showAndWait();
            optional.ifPresent(buttonType -> this.controller.leaveGame());
        }
    }

    public void showPurchaseDialog(Property property) {
        this.controller.showPurchaseDialog(property);
    }

    public ActionCard drawCard() {
        return this.controller.getScene().getCardDeck().pullCard();
    }

    public Field getField(int position) {
        Field[] fields;
        for (Field f : fields = this.controller.getScene().getFields()) {
            if (f.getPosition() != position) continue;
            return f;
        }
        throw new InvalidParameterException("Field with the given position should exist.", "position", position);
    }

    public void showActionCard(ActionCard actionCard) {
        this.controller.disableFinishTurn();
        this.controller.getScene().showActionCard(actionCard);
    }

    public void hideActionCard(ActionCard actionCard) {
        DrawedActionCardAction action = new DrawedActionCardAction(this.getClientPlayer().getUser(), this.getClientPlayer().getUser(), actionCard.getIdentifier(), actionCard.getValues());
        this.addAction(action);
        this.controller.getScene().hideActionCard();
        if (!(this.getDiceActive() || actionCard instanceof MoveActionCard || actionCard instanceof MoveForwardActionCard || actionCard instanceof MoveToNextTrainStationActionCard)) {
            if (this.clientPlayer.equals(this.getPlayer(this.getCurrent()))) {
                this.controller.enableFinishTurn();
            }
        } else if (!(actionCard instanceof MoveActionCard || actionCard instanceof MoveForwardActionCard || actionCard instanceof MoveToNextTrainStationActionCard)) {
            this.getScene().setDiceActive();
            this.setDiceActive(false);
        }
    }

    public void disableFinishTurn() {
        this.controller.disableFinishTurn();
    }

    public void placeFigure(Figure fig, Field field) {
        if (this.getPlayer(fig.getUser()).getPrisonCounter() == 0) {
            Field old = fig.getField();
            if (!(old instanceof Prison) && old.getPosition() > field.getPosition() && this.getClientPlayer().getUser().equals(fig.getUser()) && !(field instanceof Prison)) {
                int goBonus = field instanceof StartField ? GameConstants.ON_START_MONEY : GameConstants.OVER_START_MONEY;
                this.incrementLapCounter();
                this.getPlayer(fig.getUser()).addMoney(goBonus);
                ThreadRunner.run(() -> {
                    TransactionAction transaction = new TransactionAction(fig.getUser(), goBonus, true, this.getClientPlayer().getUser());
                    this.addAction(transaction);
                });
            }
            EventHandler playerIndicatorListener = event -> {
                if (!this.controller.isPurchaseVisible()) {
                    try {
                        if (this.getDiceActive()) {
                            if (!(field instanceof ActionField)) {
                                this.controller.getScene().setDiceActive();
                                this.setDiceActive(false);
                                this.disableFinishTurn();
                            }
                        } else if (this.getClientPlayer() != null && this.getClientPlayer().equals(this.getPlayer(fig.getUser())) && !(this.getClientPlayer().getFigure().getField() instanceof GoToPrisonField)) {
                            this.controller.getScene().getPlayerIndicator().show(this.getPlayer(this.getCurrent()));
                            if (!(this.getPlayer(fig.getUser()).isCasinoRoll() || field instanceof ActionField || field instanceof GoToPrisonField)) {
                                this.controller.getScene().getPlayerIndicator().hide();
                            }
                        } else {
                            this.disableFinishTurn();
                        }
                    }
                    catch (InvalidParameterException e) {
                        logger.info("Can be ignored:" + e.getMessage());
                        this.controller.getScene().getPlayerIndicator().hide();
                    }
                }
            };
            Figure.FigureAnimation animation = Figure.FigureAnimation.ANIM_DRAW;
            if (field instanceof Prison) {
                this.controller.getScene().getPlayerIndicator().hide();
                animation = Figure.FigureAnimation.ANIM_TO_PRISON;
            } else if (field instanceof StartField && old instanceof Prison) {
                this.controller.getScene().getPlayerIndicator().hide();
                fig.setNextRow(0);
                animation = Figure.FigureAnimation.ANIM_OUT_PRISON;
            }
            if (this.getClientPlayer().getUser().equals(fig.getUser())) {
                MoveFigure move = new MoveFigure(fig.getUser(), field.getPosition(), fig.getUser());
                this.addAction(move);
            }
            fig.placeFigure(field, playerIndicatorListener, () -> {
                try {
                    if (!this.getPlayer(fig.getUser()).isCasinoRoll() && field instanceof Casino) {
                        if (this.clientPlayer.getUser().equals(fig.getUser())) {
                            this.controller.showCasinoDialog();
                        }
                        this.getPlayer(fig.getUser()).setCasinoRoll(true);
                        this.controller.getScene().setDiceActive();
                        this.disableFinishTurn();
                    }
                    if (this.getClientPlayer().getUser().equals(fig.getUser()) && !this.getPlayer(fig.getUser()).isCasinoRoll() && !(old instanceof Prison)) {
                        field.onFigureEntered(fig, this);
                    }
                    if (field instanceof StartField && old instanceof Prison && this.clientPlayer.equals(this.getPlayer(this.getCurrent()))) {
                        this.controller.enableFinishTurn();
                    }
                    if (field instanceof GoToPrisonField) {
                        this.setDiceActive(false);
                    }
                    if (field instanceof Prison && !(old instanceof Prison)) {
                        if (this.clientPlayer.equals(this.getPlayer(this.getCurrent()))) {
                            this.controller.enableFinishTurn();
                        }
                        this.getScene().getPlayerIndicator().show(this.getPlayer(this.getCurrent()));
                    }
                    if (!this.diceActive && (field instanceof PayToCasinoField || field instanceof FreeParkingField || field instanceof Property && ((Property)field).getOwner() != null || field instanceof StartField) && this.clientPlayer.equals(this.getPlayer(this.getCurrent()))) {
                        this.getScene().getPlayerIndicator().show(this.getPlayer(this.getCurrent()));
                        this.controller.enableFinishTurn();
                    }
                }
                catch (InvalidParameterException e) {
                    logger.info("Can be ignored: " + e.getMessage());
                }
            }, animation);
        }
    }

    public void placeFigure(Figure fig, int distance) {
        int nextPosition = FieldConfiguration.wrapPosition(fig.getField().getPosition(), distance);
        this.placeFigure(fig, this.getField(nextPosition));
    }

    public void placeFigure(User user, int fieldPosition) {
        Player player = this.getPlayer(user);
        if (player == null) {
            throw new FigureNotFoundException(user);
        }
        this.placeFigure(player.getFigure(), this.getField(fieldPosition));
    }

    public void placeFigure(int roll1, int roll2) {
        this.firstRollDone = true;
        this.addAction(new RolledAction(this.getClientPlayer().getUser(), roll1, roll2, this.getClientPlayer().getUser()));
        if (this.getClientPlayer().isCasinoRoll()) {
            if (this.getClientPlayer().getFigure().getField().getPosition() == 20) {
                int[] temp = this.getClientPlayer().getLastRoll();
                this.getClientPlayer().setLastRoll(roll1, roll2);
                this.getClientPlayer().getFigure().getField().onFigureEntered(this.getClientPlayer().getFigure(), this);
                this.getClientPlayer().setLastRoll(temp[0], temp[1]);
                this.getClientPlayer().setCasinoRoll(false);
                if (temp[0] == temp[1]) {
                    this.controller.getScene().setDiceActive();
                    return;
                }
                if (this.clientPlayer.equals(this.getPlayer(this.getCurrent()))) {
                    this.controller.enableFinishTurn();
                }
                return;
            }
            throw new InvalidConditionException("The player is not on the casino but casino roll is positive. Was on field: " + this.getClientPlayer().getFigure().getField().getName() + " (" + this.getClientPlayer().getFigure().getField().getPosition() + ")");
        }
        this.getClientPlayer().setLastRoll(roll1, roll2);
        if (roll1 == roll2 && !this.getClientPlayer().isCasinoRoll()) {
            if (this.getClientPlayer().getPrisonCounter() != 0) {
                this.getClientPlayer().setPrisonCounter(0);
                this.setDiceActive(true);
                this.placeFigure(this.getClientPlayer().getFigure(), this.getField(0));
                return;
            }
            this.getClientPlayer().incrementDoubleCounter();
            if (this.getClientPlayer().getDoubleCounter() == 3) {
                this.placeFigure(this.getClientPlayer().getFigure(), this.getField(40));
                this.getClientPlayer().resetDoubleCounter();
                return;
            }
            this.setDiceActive(true);
            this.placeFigure(this.getClientPlayer().getFigure(), roll1 + roll2);
            return;
        }
        if (this.getClientPlayer().getPrisonCounter() != 0) {
            this.getClientPlayer().decrementPrisonCounter();
            if (this.getClientPlayer().getPrisonCounter() == 0) {
                if (!this.getClientPlayer().removeMoney(50)) {
                    this.kickPlayer(this.getClientPlayer().getFigure().getUser(), "lostNoMoneyLeft");
                    return;
                }
                TransactionAction action = new TransactionAction(this.getClientPlayer().getFigure().getUser(), 50, false, this.getClientPlayer().getUser());
                this.addAction(action);
                this.placeFigure(this.getClientPlayer().getFigure(), this.getField(0));
                return;
            }
            if (this.clientPlayer.equals(this.getPlayer(this.getCurrent()))) {
                this.controller.enableFinishTurn();
            }
            return;
        }
        this.placeFigure(this.getClientPlayer().getFigure(), roll1 + roll2);
        this.getClientPlayer().resetDoubleCounter();
    }

    public void nextUserOnTurn(User user) {
        this.firstRollDone = false;
        this.cameToPrisonThisRound = false;
        this.setCurrent(user);
        this.incrementTurnCounter();
        this.setUserHasTravelledThisRound(false);
        if (this.clientPlayer.getUser().equals(user)) {
            ThreadRunner.onFX(() -> this.controller.getTurnLabel().setText(String.format(this.controller.getBundle().getString("itsYourTurn"), this.getCurrent().getName())), 0L);
            this.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(this.controller.getBundle().getString("itsYourTurn"), user.getName()), System.SYSTEM_USER));
        } else {
            ThreadRunner.onFX(() -> this.controller.getTurnLabel().setText(String.format(this.controller.getBundle().getString("itsTurn"), this.getCurrent().getName())), 0L);
            this.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(this.controller.getBundle().getString("onTurn"), user.getName()), System.SYSTEM_USER));
        }
        if (this.clientIsCurrentPlayer()) {
            Sound.NOTIFY.play();
            this.controller.getScene().setOnTurn();
        }
    }

    public void enablePlayerCameIntoPrisonThisRound() {
        this.cameToPrisonThisRound = true;
    }

    public void stopPingTimer() {
        this.pingTimer.cancel();
    }
}


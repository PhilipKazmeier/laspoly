/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 *  javafx.event.EventHandler
 */
package de.hhn.seb.labsw.laspoly.network.client.listeners;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import de.hhn.seb.labsw.laspoly.System;
import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.exception.WrongControllerException;
import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.Transactable;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import de.hhn.seb.labsw.laspoly.model.action.BuildingConstructionAction;
import de.hhn.seb.labsw.laspoly.model.action.DrawedActionCardAction;
import de.hhn.seb.labsw.laspoly.model.action.FigureChangedAction;
import de.hhn.seb.labsw.laspoly.model.action.FigureChosenAction;
import de.hhn.seb.labsw.laspoly.model.action.KickPlayerAction;
import de.hhn.seb.labsw.laspoly.model.action.KnockDownBuildingAction;
import de.hhn.seb.labsw.laspoly.model.action.LeaveGameAction;
import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.model.action.MortgageAction;
import de.hhn.seb.labsw.laspoly.model.action.MoveFigure;
import de.hhn.seb.labsw.laspoly.model.action.NextUserAction;
import de.hhn.seb.labsw.laspoly.model.action.PaidOutOfPrisonAction;
import de.hhn.seb.labsw.laspoly.model.action.PropertyBoughtAction;
import de.hhn.seb.labsw.laspoly.model.action.PropertySoldAction;
import de.hhn.seb.labsw.laspoly.model.action.RolledAction;
import de.hhn.seb.labsw.laspoly.model.action.SwapOfferAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.action.TravelAction;
import de.hhn.seb.labsw.laspoly.model.building.Building;
import de.hhn.seb.labsw.laspoly.model.building.Factory;
import de.hhn.seb.labsw.laspoly.model.building.Hotel;
import de.hhn.seb.labsw.laspoly.model.building.House;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.model.field.TrainStation;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.Casino;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.network.client.ServerClient;
import de.hhn.seb.labsw.laspoly.utils.DateTimeConverter;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.audio.Sound;
import de.hhn.seb.labsw.laspoly.view.BaseController;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import de.hhn.seb.labsw.laspoly.view.game.lobby.GameLobbyController;
import java.lang.reflect.Type;
import java.util.ResourceBundle;
import java.util.logging.Logger;
import javafx.application.Platform;
import javafx.event.EventHandler;
import org.glassfish.jersey.media.sse.EventListener;
import org.glassfish.jersey.media.sse.InboundEvent;
import org.joda.time.DateTime;
import org.json.JSONArray;

public class RunningGameListener
implements EventListener {
    private static Logger logger;
    private final ServerClient client;
    private final Gson gson;

    public RunningGameListener(ServerClient serverClient) {
        logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/network/client/client_logging.properties");
        this.client = serverClient;
        this.gson = new GsonBuilder().registerTypeAdapter((Type)(DateTime.class), new DateTimeConverter()).create();
    }

    @Override
    public void onEvent(InboundEvent inboundEvent) {
        if (!this.client.updateIsRunning()) {
            return;
        }
        final String data = inboundEvent.readData();
        this.client.notifySseEventReceived();
        Platform.runLater(() -> this.dispatchEvent(data));
    }

    private void dispatchEvent(String data) {
        if (!this.client.updateIsRunning()) {
            return;
        }
        JSONArray array;
        ActionType type;
        try {
            array = new JSONArray(data);
            type = this.gson.fromJson(array.get(0).toString(), ActionType.class);
        }
        catch (Exception e) {
            this.client.handleRunningGameEventFailure(null, e);
            return;
        }
        BaseController controller = this.client.getController();
        User user = this.client.getUser();
        try {
            switch (type) {
                    case START_GAME: {
                        this.startGame(controller, user);
                        break;
                    }
                    case FIGURE_CHANGED: {
                        FigureChangedAction figureChangedAction = this.gson.fromJson(array.get(1).toString(), FigureChangedAction.class);
                        this.figureChanged(figureChangedAction, controller, user);
                        break;
                    }
                    case MESSAGE: {
                        this.gotMessage(array.get(1).toString(), controller);
                        break;
                    }
                    case NEXT_USER: {
                        this.nextUserOnTurn(array.get(1).toString(), controller);
                        break;
                    }
                    case MOVE_FIGURE: {
                        this.moveFigure(array.get(1).toString(), controller, user);
                        break;
                    }
                    case KICK_PLAYER: {
                        this.kickPlayer(array.get(1).toString(), controller, user);
                        break;
                    }
                    case LEAVE_GAME: {
                        this.leaveGame(array.get(1).toString(), controller);
                        break;
                    }
                    case PROPERTY_BOUGHT: {
                        this.boughtProperty(array.get(1).toString(), controller);
                        break;
                    }
                    case TRANSACTION: {
                        this.transactMoney(array.get(1).toString(), controller);
                        break;
                    }
                    case ROLLED: {
                        this.rolledDices(array.get(1).toString(), controller);
                        break;
                    }
                    case BUILDING: {
                        this.constructBuilding(array.get(1).toString(), controller);
                        break;
                    }
                    case MORTGAGE: {
                        this.mortgageProperty(array.get(1).toString(), controller);
                        break;
                    }
                    case KNOCK_DOWN_BUILDING: {
                        this.knockDownBuilding(array.get(1).toString(), controller);
                        break;
                    }
                    case SWAP_OFFER: {
                        this.swapOffer(array.get(1).toString(), controller);
                        break;
                    }
                    case ACTION_CARD: {
                        this.actionCard(array.get(1).toString(), controller);
                        break;
                    }
                    case PROPERTY_SOLD: {
                        this.soldProperty(array.get(1).toString(), controller);
                        break;
                    }
                    case FIGURE_CHOSEN: {
                        FigureChosenAction figureChosenAction = this.gson.fromJson(array.get(1).toString(), FigureChosenAction.class);
                        this.figureChosen(figureChosenAction, controller);
                        break;
                    }
                    case TRAVEL: {
                        TravelAction travelAction = this.gson.fromJson(array.get(1).toString(), TravelAction.class);
                        this.travel(travelAction, controller);
                        break;
                    }
                    case OUT_OF_PRISON: {
                        PaidOutOfPrisonAction paidOutOfPrisonAction = this.gson.fromJson(array.get(1).toString(), PaidOutOfPrisonAction.class);
                        this.paidOutOfPrison(paidOutOfPrisonAction, controller);
                        break;
                    }
            }
        }
        catch (Exception e) {
            this.client.handleRunningGameEventFailure(type, e);
        }
    }

    private void paidOutOfPrison(PaidOutOfPrisonAction paidOutOfPrisonAction, BaseController controller) {
        if (controller instanceof GameController) {
            GameController gameController = (GameController)controller;
            if (!gameController.getClientPlayer().getUser().equals(paidOutOfPrisonAction.getUser())) {
                EventHandler playerIndicatorListener = event -> {};
                gameController.getPlayer(paidOutOfPrisonAction.getUser()).getFigure().placeFigure(gameController.getField(0), playerIndicatorListener, () -> {}, Figure.FigureAnimation.ANIM_OUT_PRISON);
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void travel(TravelAction travelAction, BaseController controller) {
        if (controller instanceof GameController) {
            GameController gameController = (GameController)controller;
            if (!gameController.getClientPlayer().getUser().equals(travelAction.getActuator())) {
                TrainStation station = (TrainStation)gameController.getField(travelAction.getPosition());
                Player player = gameController.getPlayer(travelAction.getUser());
                EventHandler playerIndicatorListener = event -> {};
                player.getFigure().placeFigure(station, playerIndicatorListener, () -> {}, Figure.FigureAnimation.ANIM_TRAVEL);
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void figureChosen(FigureChosenAction action, BaseController controller) {
        if (controller instanceof GameLobbyController) {
            GameLobbyController gameLobbyController = (GameLobbyController)controller;
            if (action.isHasSelected()) {
                gameLobbyController.getPlayerReady().add(action.getUser());
                gameLobbyController.checkPlayersReady();
            } else {
                gameLobbyController.getPlayerReady().remove(action.getUser());
                gameLobbyController.checkPlayersReady();
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameLobbyController.class.getName());
        }
    }

    private void leaveGame(String json, BaseController controller) {
        if (controller instanceof GameController) {
            GameController gameController = (GameController)controller;
            LeaveGameAction leave = this.gson.fromJson(json, LeaveGameAction.class);
            if (!gameController.getClientPlayer().getUser().equals(leave.getUser())) {
                ((GameController)controller).removePlayer(leave.getUser(), "leave");
                Platform.runLater(() -> ((GameController)controller).checkIfWon("leave", leave.getUser()));
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void soldProperty(String json, BaseController controller) {
        if (controller instanceof GameController) {
            GameController gameController = (GameController)controller;
            PropertySoldAction action = this.gson.fromJson(json, PropertySoldAction.class);
            if (!action.getActuator().equals(gameController.getClientPlayer().getUser())) {
                Sound.SELL.play();
                Property prop = (Property)gameController.getField(action.getPosition());
                Player owner = prop.getOwner();
                if (owner != null) {
                    owner.remove(prop);
                }
                prop.setOwner(null);
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void actionCard(String json, BaseController controller) {
        if (controller instanceof GameController) {
            GameController gameController = (GameController)controller;
            DrawedActionCardAction action = this.gson.fromJson(json, DrawedActionCardAction.class);
            if (!action.getActuator().equals(gameController.getClientPlayer().getUser())) {
                ResourceBundle bundle = gameController.getBundleActionCard();
                String orig = bundle.getString(action.getIdentifier());
                String mes = String.format(orig.replace("%d", "%.1f"), action.getValues());
                String fulMes = String.format(gameController.getBundle().getString("drawedActionCard"), action.getDrawer().getName(), mes.replace(",0", "").replace(".0", ""));
                Sound.DRAW.play();
                MessageAction message = new MessageAction(System.SYSTEM_USER, fulMes, System.SYSTEM_USER);
                gameController.addChatMessage(message);
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void swapOffer(String json, BaseController controller) {
        if (controller instanceof GameController) {
            GameController gameController = (GameController)controller;
            SwapOfferAction action = this.gson.fromJson(json, SwapOfferAction.class);
            if (action.getStatus().equals(SwapOfferAction.Status.ACCEPTED)) {
                Player sender = gameController.getPlayer(action.getSender());
                Player receiver = gameController.getPlayer(action.getReceiver());
                if (!sender.removeMoney(action.getSenderMoney())) {
                    logger.warning("Swap aborted: sender cannot afford cash payment");
                    return;
                }
                if (!receiver.removeMoney(action.getReceiverMoney())) {
                    sender.addMoney(action.getSenderMoney());
                    logger.warning("Swap aborted: receiver cannot afford cash payment");
                    return;
                }
                sender.addMoney(action.getReceiverMoney());
                receiver.addMoney(action.getSenderMoney());
                action.getSenderProperties().stream().forEach(pos -> {
                    Property prop = (Property)gameController.getField((int)pos);
                    prop.setOwner(receiver);
                    sender.remove(prop);
                    receiver.add(prop);
                });
                action.getReceiverProperties().stream().forEach(pos -> {
                    Property prop = (Property)gameController.getField((int)pos);
                    prop.setOwner(sender);
                    receiver.remove(prop);
                    sender.add(prop);
                });
                MessageAction message = new MessageAction(System.SYSTEM_USER, String.format(gameController.getBundle().getString("swapAccepted"), receiver.getName(), sender.getName()), gameController.getClientPlayer().getUser());
                gameController.addChatMessage(message);
            } else if (action.getReceiver().equals(gameController.getClientPlayer().getUser()) && (action.getStatus().equals(SwapOfferAction.Status.SENT) || action.getStatus().equals(SwapOfferAction.Status.CHANGED_BY_SENDER))) {
                ThreadRunner.onFX(() -> gameController.getScene().onReceiveSwapOffer(action), 10L);
            } else if (action.getSender().equals(gameController.getClientPlayer().getUser()) && action.getStatus().equals(SwapOfferAction.Status.CHANGED_BY_RECEIVER)) {
                switch (action.getStatus()) {
                    case CHANGED_BY_RECEIVER: {
                        ThreadRunner.onFX(() -> gameController.getScene().onReceiveSwapOffer(action), 10L);
                        break;
                    }
                }
            } else if (action.getStatus().equals(SwapOfferAction.Status.DECLINED_BY_SENDER) || action.getStatus().equals(SwapOfferAction.Status.DECLINED_BY_RECEIVER)) {
                String name = action.getStatus().equals(SwapOfferAction.Status.DECLINED_BY_SENDER) ? action.getSender().getName() : action.getReceiver().getName();
                MessageAction message = new MessageAction(System.SYSTEM_USER, String.format(gameController.getBundle().getString("swapDeclined"), name), gameController.getClientPlayer().getUser());
                gameController.addChatMessage(message);
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void knockDownBuilding(String json, BaseController controller) {
        if (controller instanceof GameController) {
            GameController gameController = (GameController)controller;
            KnockDownBuildingAction action = this.gson.fromJson(json, KnockDownBuildingAction.class);
            if (!gameController.getClientPlayer().getUser().equals(action.getActuator())) {
                Street street = (Street)gameController.getField(action.getPosition());
                ThreadRunner.onFX(() -> {
                    Building building = street.getBuildings().get(0);
                    street.knockDownBuilding();
                    if (building instanceof House) {
                        Sound.SELL.play();
                        gameController.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(gameController.getBundle().getString("soldHouse"), action.getUser().getName()), System.SYSTEM_USER));
                    } else if (building instanceof Hotel) {
                        Sound.SELL.play();
                        gameController.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(gameController.getBundle().getString("soldHotel"), action.getUser().getName()), System.SYSTEM_USER));
                    } else if (building instanceof Factory) {
                        Sound.SELL.play();
                        gameController.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(gameController.getBundle().getString("soldFactory"), action.getUser().getName()), System.SYSTEM_USER));
                    }
                }, 0L);
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void mortgageProperty(String json, BaseController controller) {
        if (controller instanceof GameController) {
            GameController gameController = (GameController)controller;
            MortgageAction action = this.gson.fromJson(json, MortgageAction.class);
            if (!action.getActuator().equals(gameController.getClientPlayer().getUser())) {
                Property property = (Property)gameController.getField(action.getPosition());
                property.setMortgaged(action.isMortgage());
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void constructBuilding(String json, BaseController controller) {
        if (controller instanceof GameController) {
            BuildingConstructionAction action = this.gson.fromJson(json, BuildingConstructionAction.class);
            GameController gameController = (GameController)controller;
            if (!action.getActuator().equals(gameController.getClientPlayer().getUser())) {
                Street street = (Street)gameController.getField(action.getPosition());
                Sound.CONSTRUCTION.play();
                street.syncBuildingFromNetwork(action.getBuildingType());
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void rolledDices(String json, BaseController controller) {
        if (controller instanceof GameController) {
            RolledAction rolled = this.gson.fromJson(json, RolledAction.class);
            GameController gameController = (GameController)controller;
            if (!gameController.getClientPlayer().getUser().equals(rolled.getRoller())) {
                ResourceBundle bundle = gameController.getBundle();
                gameController.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(bundle.getString("rolled"), rolled.getRoller().getName(), rolled.getRollOne(), rolled.getRollTwo()), System.SYSTEM_USER));
                gameController.getPlayer(rolled.getRoller()).setLastRoll(rolled.getRollOne(), rolled.getRollTwo());
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void transactMoney(String json, BaseController controller) {
        if (controller instanceof GameController) {
            TransactionAction transaction = this.gson.fromJson(json, TransactionAction.class);
            GameController gameController = (GameController)controller;
            Transactable transactor = transaction.getUser().equals(Casino.CASINO_USER) ? (Transactable)((Object)((GameController)controller).getField(20)) : gameController.getPlayer(transaction.getUser());
            if (transaction.isPositive()) {
                ResourceBundle bundle = gameController.getBundle();
                if (!gameController.getClientPlayer().getUser().equals(transaction.getActuator())) {
                    transactor.addMoney(transaction.getAmount());
                }
                if (gameController.getClientPlayer().getUser().equals(transaction.getUser())) {
                    gameController.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(bundle.getString("youGotMoney"), transaction.getAmount()), System.SYSTEM_USER));
                } else {
                    gameController.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(bundle.getString("gotMoney"), transactor.getName(), transaction.getAmount()), System.SYSTEM_USER));
                }
            } else {
                ResourceBundle bundle = gameController.getBundle();
                if (!gameController.getClientPlayer().getUser().equals(transaction.getActuator())) {
                    transactor.removeMoney(transaction.getAmount());
                }
                if (gameController.getClientPlayer().getUser().equals(transaction.getUser())) {
                    gameController.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(bundle.getString("youPaidMoney"), transaction.getAmount()), System.SYSTEM_USER));
                } else {
                    gameController.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(bundle.getString("paidMoney"), transactor.getName(), transaction.getAmount()), System.SYSTEM_USER));
                }
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void boughtProperty(String json, BaseController controller) {
        if (controller instanceof GameController) {
            PropertyBoughtAction sold = this.gson.fromJson(json, PropertyBoughtAction.class);
            GameController gameController = (GameController)controller;
            if (!gameController.getClientPlayer().getUser().equals(sold.getActuator())) {
                ResourceBundle bundle = gameController.getBundle();
                Field field = gameController.getField(sold.getPropertyPosition());
                if (!(field instanceof Property)) {
                    throw new InvalidParameterException("Field should be instance of property.", "field", field);
                }
                Sound.PURCHASE.play();
                Property prop = (Property)field;
                Player player = ((GameController)controller).getPlayer(sold.getUser());
                player.add(prop);
                prop.setOwner(player);
                gameController.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(bundle.getString("anotherBought"), sold.getUser().getName(), prop.getName()), gameController.getClientPlayer().getUser()));
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void kickPlayer(String json, BaseController controller, User user) {
        if (controller instanceof GameLobbyController) {
            KickPlayerAction kick = this.gson.fromJson(json, KickPlayerAction.class);
            if (kick.getUser().equals(user)) {
                ((GameLobbyController)controller).closeGame();
                Platform.runLater(() -> ((GameLobbyController)controller).showKickFromGameDialog());
            }
        } else if (controller instanceof GameController) {
            KickPlayerAction kick = this.gson.fromJson(json, KickPlayerAction.class);
            ((GameController)controller).removePlayer(kick.getUser(), kick.getIdentifier());
            if (kick.getUser().equals(user)) {
                Platform.runLater(() -> ((GameController)controller).showLostGameDialog(kick.getIdentifier()));
            } else {
                Platform.runLater(() -> ((GameController)controller).checkIfWon(kick.getIdentifier(), kick.getUser()));
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameLobbyController.class.getName());
        }
    }

    private void moveFigure(String json, BaseController controller, User user) {
        if (controller instanceof GameController) {
            GameController gameController = (GameController)controller;
            MoveFigure move = this.gson.fromJson(json, MoveFigure.class);
            if (!move.getUser().equals(user)) {
                if (move.isRide()) {
                    TrainStation station = (TrainStation)gameController.getField(move.getFieldPosition());
                    Player player = gameController.getPlayer(move.getUser());
                    EventHandler playerIndicatorListener = event -> {};
                    player.getFigure().placeFigure(station, playerIndicatorListener, () -> {}, Figure.FigureAnimation.ANIM_TRAVEL);
                } else {
                    ((GameController)controller).placeFigure(move.getUser(), move.getFieldPosition());
                }
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
    }

    private void nextUserOnTurn(String json, BaseController controller) {
        NextUserAction next = this.gson.fromJson(json, NextUserAction.class);
        if (!(controller instanceof GameController)) {
            throw new WrongControllerException(controller.getClass().getName(), GameController.class.getName());
        }
        ((GameController)controller).nextUserOnTurn(next.getUser());
    }

    private void gotMessage(String json, BaseController controller) {
        MessageAction message = null;
        try {
            message = this.gson.fromJson(json, MessageAction.class);
        }
        catch (Exception e) {
            logger.severe("Message couldn't send to the Game Controller");
            e.printStackTrace();
        }
        if (message == null) {
            return;
        }
        if (controller instanceof GameLobbyController) {
            ((GameLobbyController)controller).addChatMessage(message);
        } else if (controller instanceof GameController && !((GameController)controller).getClientPlayer().getUser().equals(message.getActuator())) {
            ((GameController)controller).addChatMessage(message);
        }
    }

    private void figureChanged(FigureChangedAction action, BaseController controller, User user) {
        if (controller instanceof GameLobbyController) {
            if (!action.getUser().equals(user)) {
                ((GameLobbyController)controller).addBlackListFigure(action);
            }
        } else {
            throw new WrongControllerException(controller.getClass().getName(), GameLobbyController.class.getName());
        }
    }

    private void startGame(BaseController controller, User user) {
        if (controller instanceof GameLobbyController) {
            if (!controller.getMainWindowController().getGame().isHost(user)) {
                Platform.runLater(() -> controller.getMainWindowController().showGameWindow());
            }
        } else if (!(controller instanceof GameController)) {
            throw new WrongControllerException(controller.getClass().getName(), GameLobbyController.class.getName());
        }
    }
}


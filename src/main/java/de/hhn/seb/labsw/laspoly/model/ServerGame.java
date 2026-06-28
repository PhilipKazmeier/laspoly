/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import de.hhn.seb.labsw.laspoly.System;
import de.hhn.seb.labsw.laspoly.exception.InvalidActionException;
import de.hhn.seb.labsw.laspoly.exception.UserNotKnownException;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.ServerPlayer;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import de.hhn.seb.labsw.laspoly.model.action.FigureChangedAction;
import de.hhn.seb.labsw.laspoly.model.action.FigureChosenAction;
import de.hhn.seb.labsw.laspoly.model.action.FinishTurn;
import de.hhn.seb.labsw.laspoly.model.action.KickPlayerAction;
import de.hhn.seb.labsw.laspoly.model.action.LeaveGameAction;
import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.model.action.MoveFigure;
import de.hhn.seb.labsw.laspoly.model.action.NextUserAction;
import de.hhn.seb.labsw.laspoly.model.action.PingAction;
import de.hhn.seb.labsw.laspoly.model.action.PropertyBoughtAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.network.server.resource.GamesResource;
import de.hhn.seb.labsw.laspoly.network.server.resource.UsersResource;
import de.hhn.seb.labsw.laspoly.utils.DateTimeConverter;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FigureSource;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import java.util.logging.Logger;
import javax.ws.rs.core.MediaType;
import org.glassfish.jersey.media.sse.OutboundEvent;
import org.glassfish.jersey.media.sse.SseBroadcaster;
import org.glassfish.jersey.server.BroadcasterListener;
import org.glassfish.jersey.server.ChunkedOutput;

public class ServerGame {
    private static final long PING_TIMEOUT_MS = 60_000L;
    private static final long PING_JOIN_GRACE_MS = 30_000L;
    private final HashMap<User, ServerPlayer> players;
    private final Game game;
    private final SseBroadcaster broadcaster;
    private final Gson gson;
    private final Logger logger = Logger.getLogger(UsersResource.class.getName());
    private boolean started;
    private int current = -1;
    private User currentUser = null;
    private int casinoMoney = 1200;
    private Timer keepaliveTimer;

    public ServerGame(Game serverGame) {
        this.game = serverGame;
        this.players = new HashMap();
        this.broadcaster = new SseBroadcaster();
        this.broadcaster.add(new BroadcasterListener<OutboundEvent>(){

            @Override
            public void onException(ChunkedOutput<OutboundEvent> output, Exception exception) {
                ServerGame.this.logger.warning("Removing dead SSE client from game " + ServerGame.this.game.getId() + ": " + exception.getMessage());
                ServerGame.this.broadcaster.remove(output);
            }

            @Override
            public void onClose(ChunkedOutput<OutboundEvent> output) {
                ServerGame.this.logger.fine("SSE client disconnected from game " + ServerGame.this.game.getId());
            }
        });
        this.started = false;
        this.gson = new GsonBuilder().registerTypeAdapter((Type)(MessageAction.class), new DateTimeConverter()).create();
    }

    public void startKeepalive() {
        if (this.keepaliveTimer != null) {
            return;
        }
        this.keepaliveTimer = new Timer("game-keepalive-" + this.game.getId(), true);
        this.keepaliveTimer.scheduleAtFixedRate(new TimerTask(){

            @Override
            public void run() {
                try {
                    OutboundEvent event = new OutboundEvent.Builder().name("heartbeat").mediaType(MediaType.APPLICATION_JSON_TYPE).data(String.class, "{}").build();
                    ServerGame.this.broadcaster.broadcast(event);
                }
                catch (Exception e) {
                    ServerGame.this.logger.fine("Keepalive broadcast failed: " + e.getMessage());
                }
            }
        }, 15000L, 15000L);
    }

    public void setFigureSource(User user, FigureSource source) throws UserNotKnownException {
        if (!this.players.containsKey(user)) {
            throw new UserNotKnownException(user);
        }
        this.players.get(user).setFigureSource(source);
        this.logger.info("Set figure source for " + user.getName());
    }

    public FigureSource getFigureSource(User user) throws UserNotKnownException {
        if (!this.players.containsKey(user)) {
            throw new UserNotKnownException(user);
        }
        return this.players.get(user).getFigureSource();
    }

    public SseBroadcaster getBroadcaster() {
        return this.broadcaster;
    }

    public Map<User, ServerPlayer> getPlayers() {
        return this.players;
    }

    public void start() {
        this.started = true;
    }

    public void nextUser() {
        if (this.game.getUsers().size() != 1) {
            this.current = (this.current + 1) % this.game.getUsers().size();
            OutboundEvent.Builder builder = new OutboundEvent.Builder();
            this.currentUser = this.game.getUsers().get(this.current);
            NextUserAction next = new NextUserAction(this.currentUser, System.SYSTEM_USER);
            String json = "[" + this.gson.toJson(ActionType.NEXT_USER) + "," + this.gson.toJson(next) + "]";
            OutboundEvent event = builder.name("gameRunning").mediaType(MediaType.APPLICATION_JSON_TYPE).data(String.class, json).build();
            this.broadcaster.broadcast(event);
            this.logger.info("Next user is on turn: " + this.game.getUsers().get(this.current).getName());
        } else {
            this.logger.info("Only one user is left. There will be no next turn.");
        }
    }

    public void addUser(User user) {
        this.players.put(user, new ServerPlayer(user));
        this.logger.info("Added user to server game: " + user.getName());
    }

    public void removeUser(User user) {
        this.players.remove(user);
        this.logger.info("Removed user from server game: " + user.getName());
    }

    public void notifyAction(ActionType type, String json, GamesResource gamesResource) {
        switch (type) {
            case FIGURE_CHANGED: {
                FigureChangedAction figureChanged = this.gson.fromJson(json, FigureChangedAction.class);
                try {
                    this.setFigureSource(figureChanged.getUser(), figureChanged.getFigureSource());
                }
                catch (UserNotKnownException e) {
                    this.logger.severe(e.getMessage());
                }
                this.logger.info(figureChanged.toString());
                break;
            }
            case FINISH: {
                FinishTurn turn = this.gson.fromJson(json, FinishTurn.class);
                try {
                    if (!turn.getActuator().equals(this.game.getUsers().get(this.current))) break;
                    this.nextUser();
                }
                catch (IndexOutOfBoundsException e) {
                    this.logger.severe(e.getMessage());
                }
                break;
            }
            case KICK_PLAYER: {
                User cur = null;
                if (this.current != -1) {
                    cur = this.game.getUsers().get(this.current);
                }
                KickPlayerAction kick = this.gson.fromJson(json, KickPlayerAction.class);
                this.game.removeUser(kick.getUser());
                this.removeUser(kick.getUser());
                if (this.current != -1) {
                    this.current = this.game.getUsers().indexOf(cur);
                }
                if (!this.game.getUsers().isEmpty()) break;
                gamesResource.endGame(this.game);
                break;
            }
            case LEAVE_GAME: {
                LeaveGameAction leave = this.gson.fromJson(json, LeaveGameAction.class);
                this.game.removeUser(leave.getUser());
                this.removeUser(leave.getUser());
                this.current = this.game.getUsers().indexOf(this.currentUser);
                if (!this.game.getUsers().isEmpty()) break;
                gamesResource.endGame(this.game);
                break;
            }
            case MOVE_FIGURE: {
                MoveFigure move = this.gson.fromJson(json, MoveFigure.class);
                if (!this.players.containsKey(move.getUser())) {
                    throw new InvalidActionException(move, "Unknown player");
                }
                this.players.get(move.getUser()).setPosition(move.getFieldPosition());
                break;
            }
            case PROPERTY_BOUGHT: {
                PropertyBoughtAction bought = this.gson.fromJson(json, PropertyBoughtAction.class);
                if (!this.players.containsKey(bought.getUser())) {
                    throw new InvalidActionException(bought, "Unknown player");
                }
                this.players.get(bought.getUser()).addProperty(bought.getPropertyPosition());
                break;
            }
            case TRANSACTION: {
                TransactionAction transaction = this.gson.fromJson(json, TransactionAction.class);
                if (transaction.getUser().equals(System.SYSTEM_USER)) break;
                if (transaction.getUser().equals(System.CASINO_USER)) {
                    if (transaction.getAmount() > this.casinoMoney / 2) {
                        throw new InvalidActionException(transaction, "Invalid amount");
                    }
                    if (transaction.isPositive()) {
                        this.casinoMoney += transaction.getAmount();
                        break;
                    }
                    this.casinoMoney -= transaction.getAmount();
                    break;
                }
                if (transaction.isPositive()) {
                    this.players.get(transaction.getUser()).addMoney(transaction.getAmount());
                    break;
                }
                if (!this.players.get(transaction.getUser()).removeMoney(transaction.getAmount())) {
                    throw new InvalidActionException(transaction, "Insufficient funds");
                }
                break;
            }
            case FIGURE_CHOSEN: {
                FigureChosenAction figureChosenAction = this.gson.fromJson(json, FigureChosenAction.class);
                if (figureChosenAction.isHasSelected()) {
                    this.game.getPlayerReady().add(figureChosenAction.getUser());
                    break;
                }
                this.game.getPlayerReady().remove(figureChosenAction.getUser());
                break;
            }
            case PING: {
                PingAction pingAction = this.gson.fromJson(json, PingAction.class);
                if (this.players.containsKey(pingAction.getActuator())) {
                    try {
                        this.players.get(pingAction.getActuator()).recordPing();
                        long now = java.lang.System.currentTimeMillis();
                        ArrayList<User> toRemove = new ArrayList<User>();
                        this.players.forEach((user, serverPlayer) -> {
                            if (now - serverPlayer.getJoinedAt() < PING_JOIN_GRACE_MS) {
                                return;
                            }
                            if (now - serverPlayer.getLastPingAt() > PING_TIMEOUT_MS) {
                                toRemove.add(user);
                            }
                        });
                        toRemove.forEach(user -> this.kickForLostConnection(user, gamesResource));
                        if (this.currentUser == null || !toRemove.contains(this.currentUser)) break;
                        this.nextUser();
                    }
                    catch (Exception e) {
                        this.logger.severe(e.getMessage());
                        e.printStackTrace();
                    }
                    break;
                }
                this.logger.severe("Ping action occured put given player is not in the game.");
                break;
            }
        }
    }

    private void kickForLostConnection(User user, GamesResource gamesResource) {
        this.game.removeUser(user);
        this.removeUser(user);
        KickPlayerAction kickPlayerAction = new KickPlayerAction(System.SYSTEM_USER, user, "lostConnection");
        OutboundEvent.Builder builder = new OutboundEvent.Builder();
        String actionJson = "[" + this.gson.toJson(ActionType.KICK_PLAYER) + "," + this.gson.toJson(kickPlayerAction) + "]";
        OutboundEvent event = builder.name("gameRunning").mediaType(MediaType.APPLICATION_JSON_TYPE).data(String.class, actionJson).build();
        this.broadcaster.broadcast(event);
    }
}

